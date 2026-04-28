package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.exceptions.TemplateDetailException;
import com.app.budgetbuddy.services.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
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
        Optional<BPTemplateDetail> bpTemplateDetailOptional = bpTemplateDetailsService.findByTemplateId(templateId);
        if(bpTemplateDetailOptional.isEmpty())
        {
            throw new DataException("Budget template detail not found");
        }
        BPTemplateType templateType = bpTemplateService.getTemplateTypeById(templateId);
        log.info("Template Type: {}", templateType);
        try
        {
            BPTemplateDetail bpTemplateDetail = bpTemplateDetailOptional.get();
            List<BPCategory> updatedBPCategories = Collections.emptyList();
            if(templateType == BPTemplateType.MONTHLY_STD)
            {
                updatedBPCategories = bpTemplateUpdaterService.updateBPCategories(bpTemplateDetail, userId, false);
            }
            else if(templateType == BPTemplateType.INCOME_STD)
            {
                log.info("Updating Income Categories");
                updatedBPCategories = bpTemplateUpdaterService.updateBPCategories(bpTemplateDetail, userId, true);
            }
            bpcategoryService.updateCategories(updatedBPCategories);
            return bpTemplateService.getTemplateByUserAndId(userId, templateId).get();
        }catch(DataException e){
            log.error("Error updating budget template categories: ", e);
            return Optional.empty();
        }
    }

    public Optional<BPTemplate> generateNewTemplate(BPTemplateType templateType, BPIncomeCriteria incomeCriteria, boolean requireCategoryHeaders, List<String> categoryHeaders, List<SubBudget> subBudgets, Integer startDay)
    {
        return null;
    }

    public Optional<BPTemplate> generateDefaultTemplate(Long userId)
    {
        //        DateRange templateDateRange = new DateRange();
//        LocalDate currentDate = LocalDate.now();
//        List<DateRange> monthRanges = templateDateRange.rangesByCurrentDateType(Period.MONTHLY, currentDate);
//        List<SubBudget> subBudgets = subBudgetService.getSubBudgetsByDateRanges(monthRanges, userId);
//        BPTemplate initialTemplate = templateBuilder.buildInitialTemplate(BPTemplateType.MONTHLY_STD, Period.MONTHLY, false, List.of(), null, subBudgets, 0);
//
//        BPTemplateEntity savedTemplate = templateService.saveTemplate(initialTemplate, userId);
//        BPGoalsDetail initialGoals = initialTemplate.getBpGoalsDetail();
//        BPTemplateDetail initialDetail = initialTemplate.getBpTemplateDetail();
//
//        BPTemplateDetailEntity savedDetailEntity = templateDetailsService.saveModel(initialDetail, savedTemplate);
//        List<BPColumnEntity> savedColumns = bpColumnService.saveColumns(initialDetail.getLayoutGrid().columns(), savedDetailEntity);
//        categoryService.saveCategories(initialDetail.getLayoutGrid().rows(), savedColumns);
//        return templateBuilder.buildTemplate(initialTemplate, initialGoals, initialDetail);
        return null;
    }



}
