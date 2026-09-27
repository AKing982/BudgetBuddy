package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BPColumnEntity;
import com.app.budgetbuddy.entities.BPTemplateDetailEntity;
import com.app.budgetbuddy.entities.BPTemplateEntity;
import com.app.budgetbuddy.entities.BPTemplatePointerEntity;
import com.app.budgetbuddy.exceptions.BPTemplateBuilderException;
import com.app.budgetbuddy.exceptions.BPTemplatePointerException;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.exceptions.TemplateDetailException;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.IncomeRangeBuilderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class BPTemplateGeneratorService
{
    private BPTemplateService bpTemplateService;
    private SubBudgetService subBudgetService;
    private BPTemplateGeneratorBuilderService templateGeneratorBuilderService;
    private BPTemplatePersistenceService templatePersistenceService;
    private BPTemplateUpdaterService bpTemplateUpdaterService;

    @Autowired
    public BPTemplateGeneratorService(BPTemplateService bpTemplateService,
                                      SubBudgetService subBudgetService,
                                      BPTemplateGeneratorBuilderService templateGeneratorBuilderService,
                                      BPTemplatePersistenceService templatePersistenceService,
                                      BPTemplateUpdaterService bpTemplateUpdaterService)
    {
        this.bpTemplateService = bpTemplateService;
        this.subBudgetService = subBudgetService;
        this.templateGeneratorBuilderService = templateGeneratorBuilderService;
        this.templatePersistenceService = templatePersistenceService;
        this.bpTemplateUpdaterService = bpTemplateUpdaterService;
    }

    public Optional<BPTemplate> moveFuturePointerAndResyncTemplate(final Long templateId, final Long userId, final BPTemplatePointer futurePointer, final LocalDate nextFuturePointerDate)
    {
        if(templateId == null || userId == null || futurePointer == null || nextFuturePointerDate == null)
        {
            return Optional.empty();
        }
        try
        {
            BPTemplateDetail detail = templatePersistenceService.findTemplateDetailByTemplateId(templateId);
            BPTemplateType templateType = bpTemplateService.getTemplateTypeById(templateId);
            List<BPColumn> existingColumns = detail.getLayoutGrid().columns();

            // 1. Build
            List<BPColumn> newColumns = templateGeneratorBuilderService.buildFutureColumns(templateType, existingColumns, nextFuturePointerDate);
            List<BPColumn> allColumns = new ArrayList<>(existingColumns);
            allColumns.addAll(newColumns);
            BPTemplatePointer movedPointer = templateGeneratorBuilderService.buildMovedPointer(futurePointer, allColumns, detail.getId(), nextFuturePointerDate);

            // 2. Persist
            templatePersistenceService.persistFuturePointerMove(detail.getId(), newColumns, movedPointer);

            // 3. Resync categories so the new columns get their BPCategories, and return the fresh template
            return resyncTemplate(templateId, userId);
        }
        catch(TemplateDetailException | BPTemplatePointerException | BPTemplateBuilderException e)
        {
            log.error("Error moving future pointer: ", e);
            return Optional.empty();
        }
    }

    public Optional<BPTemplate> resyncTemplate(Long templateId, Long userId)
    {
        if(templateId == null)
        {
            throw new TemplateDetailException("Template id cannot be null");
        }
        BPTemplateDetail bpTemplateDetail = templatePersistenceService.findTemplateDetailByTemplateId(templateId);
        BPTemplateType templateType = bpTemplateService.getTemplateTypeById(templateId);
        log.info("Template Type: {}", templateType);
        try
        {
            boolean isIncome;
            switch(templateType)
            {
                case MONTHLY_STD -> isIncome = false;
                case INCOME_STD  -> isIncome = true;
                default -> {
                    log.error("Invalid template type: {}", templateType);
                    return Optional.empty();
                }
            }
            List<BPCategory> updatedBPCategories = bpTemplateUpdaterService.updateBPCategories(bpTemplateDetail, userId, isIncome);
            List<BPCategory> unmatchedBPCategories = bpTemplateUpdaterService.createUnmatchedBPCategories(bpTemplateDetail, isIncome, userId);
            templatePersistenceService.saveCategoryChanges(updatedBPCategories, unmatchedBPCategories, bpTemplateDetail.getId());
            return bpTemplateService.getTemplateByUserAndId(userId, templateId);
        }
        catch(DataException e)
        {
            log.error("Error updating budget template categories: ", e);
            return Optional.empty();
        }
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
            BPTemplate initialTemplate = templateGeneratorBuilderService.buildInitialTemplate(templateType, period, subBudgets, startDay);
            return Optional.of(saveNewTemplate(initialTemplate, userId));
        }
        catch(BPTemplateBuilderException | TemplateDetailException e)
        {
            log.error("Error building template: ", e);
            return Optional.empty();
        }
    }

    public Optional<BPTemplate> generateDefaultTemplate(Long userId)
    {
        try
        {
            LocalDate currentDate = LocalDate.now();
            List<DateRange> monthRanges = new DateRange().rangesByCurrentDateType(Period.MONTHLY, currentDate);
            List<SubBudget> subBudgets = fetchSubBudgetsByDateRange(monthRanges, userId);
            BPTemplate initialTemplate = templateGeneratorBuilderService.buildInitialTemplate(BPTemplateType.MONTHLY_STD, Period.MONTHLY, subBudgets, 0);
            return Optional.of(saveNewTemplate(initialTemplate, userId));
        }
        catch(BPTemplateBuilderException | TemplateDetailException e)
        {
            log.error("Error building template: ", e);
            return Optional.empty();
        }
    }

    private BPTemplate saveNewTemplate(BPTemplate template, Long userId)
    {
        BPTemplateDetail detail = template.getBpTemplateDetail();
        BPTemplatePointer pointer = templateGeneratorBuilderService.buildInitialPointer(detail.getLayoutGrid().columns(), detail.getId(), LocalDate.now());
        BPTemplateEntity savedTemplate = templatePersistenceService.persistNewTemplate(template, pointer, userId);
        return templateGeneratorBuilderService.buildFinalTemplate(template, savedTemplate.getId());
    }

    private List<SubBudget> fetchSubBudgetsByDateRange(List<DateRange> dateRanges, Long userId)
    {
        return subBudgetService.getSubBudgetsByDateRanges(dateRanges, userId);
    }
}
