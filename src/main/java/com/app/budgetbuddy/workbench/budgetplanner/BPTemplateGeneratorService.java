package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BPColumnEntity;
import com.app.budgetbuddy.entities.BPTemplateDetailEntity;
import com.app.budgetbuddy.entities.BPTemplateEntity;
import com.app.budgetbuddy.exceptions.BPTemplateBuilderException;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.exceptions.TemplateDetailException;
import com.app.budgetbuddy.services.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class BPTemplateGeneratorService
{
    private BPTemplateService bpTemplateService;
    private BPTemplateDetailsService bpTemplateDetailsService;
    private BPTemplateBuilderService templateBuilder;
    private BPColumnService bpColumnService;
    private BPCategoryService bpcategoryService;
    private SubBudgetService subBudgetService;
    private BPTemplateUpdaterService bpTemplateUpdaterService;

    @Autowired
    public BPTemplateGeneratorService(BPTemplateService bpTemplateService,
                                      BPTemplateDetailsService bpTemplateDetailsService,
                                      BPTemplateBuilderService bpTemplateDetailBuilderService,
                                      BPColumnService bpColumnService,
                                      BPCategoryService bpCategoryService,
                                      SubBudgetService subBudgetService,
                                      BPTemplateUpdaterService bpTemplateUpdaterService)
    {
        this.bpTemplateService = bpTemplateService;
        this.bpTemplateDetailsService = bpTemplateDetailsService;
        this.bpColumnService = bpColumnService;
        this.bpcategoryService = bpCategoryService;
        this.templateBuilder = bpTemplateDetailBuilderService;
        this.subBudgetService = subBudgetService;
        this.bpTemplateUpdaterService = bpTemplateUpdaterService;
    }

    public Optional<BPTemplate> resyncTemplate(Long templateId, Long userId)
    {
        if(templateId == null)
        {
            throw new TemplateDetailException("Template id cannot be null");
        }
        BPTemplateDetail bpTemplateDetail = findBPTemplateDetailByTemplateId(templateId);
        BPTemplateType templateType = bpTemplateService.getTemplateTypeById(templateId);
        log.info("Template Type: {}", templateType);
        try
        {
            List<BPCategory> updatedBPCategories;
            List<BPCategory> unmatchedBPCategories;
            switch(templateType)
            {
                case MONTHLY_STD:
                    updatedBPCategories = bpTemplateUpdaterService.updateBPCategories(bpTemplateDetail, userId, false);
                    unmatchedBPCategories = bpTemplateUpdaterService.createUnmatchedBPCategories(bpTemplateDetail, false, userId);
                    break;
                case INCOME_STD:
                    updatedBPCategories = bpTemplateUpdaterService.updateBPCategories(bpTemplateDetail, userId, true);
                    unmatchedBPCategories = bpTemplateUpdaterService.createUnmatchedBPCategories(bpTemplateDetail, true, userId);
                    break;
                default:
                    log.error("Invalid template type: {}", templateType);
                    return Optional.empty();
            }
            updateBPCategories(updatedBPCategories);
            createMissingBPCategories(unmatchedBPCategories, bpTemplateDetail.getId());
            return Optional.of(bpTemplateService.getTemplateByUserAndId(userId, templateId).get());
        }catch(DataException e){
            log.error("Error updating budget template categories: ", e);
            return Optional.empty();
        }
    }


    public Optional<BPTemplate> generateNewTemplateWithCategoryHeaders(BPTemplateType templateType, Period period, List<String> categoryHeaders, List<DateRange> dateRanges, List<SubBudget> subBudgets)
    {
        return null;
    }

    BPTemplate saveAndReturnTemplate(BPTemplate template, BPTemplateDetail initialTemplateDetail, Long userId)
    {
        if(initialTemplateDetail == null)
        {
            throw new TemplateDetailException("Template detail cannot be null");
        }
        BPTemplateEntity savedTemplate = bpTemplateService.saveTemplate(template, userId);

        BPTemplateDetailEntity savedTemplateDetail = bpTemplateDetailsService.saveModel(initialTemplateDetail, savedTemplate);

        List<BPColumnEntity> savedColumns = bpColumnService.saveColumns(template.getBpTemplateDetail().getLayoutGrid().columns(), savedTemplateDetail);

        bpcategoryService.saveCategories(template.getBpTemplateDetail().getLayoutGrid().rows(), savedColumns);

        BPTemplate finalTemplate = templateBuilder.buildTemplate(template, template.getBpGoalsDetail(), template.getBpTemplateDetail());
        finalTemplate.setId(savedTemplate.getId());
        return finalTemplate;
    }

    public Optional<BPTemplate> generateNewTemplate(BPTemplateType templateType, Period period, List<DateRange> dateRanges, Long userId, Integer startDay)
    {
        if(templateType == null)
        {
            return Optional.empty();
        }
        try
        {
            List<SubBudget> subBudgets = fetchSubBudgetsByDateRange(dateRanges, userId);
            BPTemplate initialTemplate = templateBuilder.buildInitialTemplate(
                    templateType, period, false, List.of(), null, subBudgets, startDay);
            if(initialTemplate == null)
            {
                throw new BPTemplateBuilderException("Error building initial template");
            }
            BPTemplateDetail initialDetail = initialTemplate.getBpTemplateDetail();
            BPTemplate finalTemplate = saveAndReturnTemplate(initialTemplate, initialDetail, userId);
            return Optional.of(finalTemplate);
        }catch(BPTemplateBuilderException e){
            log.error("Error building template: ", e);
            return Optional.empty();
        }
    }

    public Optional<BPTemplate> generateDefaultTemplate(Long userId)
    {
        try
        {
            DateRange templateDateRange = new DateRange();
            LocalDate currentDate = LocalDate.now();
            List<DateRange> monthRanges = templateDateRange.rangesByCurrentDateType(Period.MONTHLY, currentDate);
            List<SubBudget> subBudgets = fetchSubBudgetsByDateRange(monthRanges, userId);
            BPTemplate initialTemplate = templateBuilder.buildInitialTemplate(BPTemplateType.MONTHLY_STD, Period.MONTHLY, false, List.of(), null, subBudgets, 0);
            BPTemplateDetail initialDetail = initialTemplate.getBpTemplateDetail();
            BPTemplate finalTemplate = saveAndReturnTemplate(initialTemplate, initialDetail, userId);
            return Optional.of(finalTemplate);
        }catch(BPTemplateBuilderException e){
            log.error("Error building template: ", e);
            return Optional.empty();
        }
    }

    private BPTemplateDetail findBPTemplateDetailByTemplateId(Long templateId)
    {
        return bpTemplateDetailsService.findByTemplateId(templateId).orElseThrow(() -> new TemplateDetailException("Budget template detail not found"));
    }

    private void createMissingBPCategories(List<BPCategory> missingBPCategories, Long templateDetailId)
    {
        if(!missingBPCategories.isEmpty())
        {
            bpcategoryService.saveNewTemplateCategories(missingBPCategories, templateDetailId);
        }
    }

    private void updateBPCategories(List<BPCategory> updatedBPCategories)
    {
        bpcategoryService.updateCategories(updatedBPCategories);
    }

    private List<SubBudget> fetchSubBudgetsByDateRange(List<DateRange> dateRanges, Long userId)
    {
        return subBudgetService.getSubBudgetsByDateRanges(dateRanges, userId);
    }
}
