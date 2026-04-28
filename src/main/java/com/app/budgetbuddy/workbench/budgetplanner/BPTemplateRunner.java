package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.BPTemplateException;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class BPTemplateRunner
{
    private final BPTemplateGeneratorService templateGeneratorService;

    @Autowired
    public BPTemplateRunner(BPTemplateGeneratorService templateGeneratorService)
    {
        this.templateGeneratorService = templateGeneratorService;
    }

    public BPTemplate runFuturePeriodTemplateBuild(Long templateId, Long userId, DateRange dateRange, List<FuturePeriodCategories> categories)
    {
//        Optional<BPTemplateDetail> bpTemplateDetailOptional = templateDetailsService.findByTemplateId(templateId);
//        if(bpTemplateDetailOptional.isEmpty())
//        {
//            throw new DataException("Budget template detail not found");
//        }
//        try
//        {
//            BPTemplateDetail bpTemplateDetail = bpTemplateDetailOptional.get();
//            bpTemplateUpdaterService.updateFuturePeriodBPCategories(bpTemplateDetail, categories, dateRange);
//            return templateService.getTemplateByUserAndId(userId, templateId).get();
//
//        }catch(DataException e){
//            log.error("Error updating budget template categories: ", e);
//            throw new DataException("Error updating budget template categories");
//        }
        return null;
    }

    public BPTemplate syncBPTemplate(Long templateId, Long userId)
    {
        try
        {
            Optional<BPTemplate> bpTemplateOptional = templateGeneratorService.resyncTemplate(templateId, userId);
            if(bpTemplateOptional.isEmpty())
            {
                throw new DataException("Budget template not found");
            }
            return bpTemplateOptional.get();
        }catch(BPTemplateException ex){
            log.error("Error syncing budget template: ", ex);
            throw new DataException("Error syncing budget template");
        }
    }

    public List<BPTemplate> getUserBudgetTemplates(Long userId)
    {
//        try
//        {
//            return templateService.getAllUserBudgetTemplates(userId);
//        }catch(DataException e){
//           log.error("Error getting user budget templates: ", e);
//           return Collections.emptyList();
//        }
        return null;
    }

    public BPTemplate runCustomTemplateBuild(BPTemplateType templateType, Period period, boolean requireCategoryHeaders, List<DateRange> dateRanges, List<String> categoryHeaders, List<CategoryAllocation> categoryAllocations, BPIncomeCriteria incomeCriteria)
    {
        return null;
    }

    public BPTemplate runDefaultTemplateBuild(Long userId)
    {
        try
        {
            Optional<BPTemplate> bpTemplateOptional = templateGeneratorService.generateDefaultTemplate(userId);
            if(bpTemplateOptional.isEmpty())
            {
                throw new DataException("Default budget template not found");
            }
            return bpTemplateOptional.get();
        }catch(BPTemplateException ex){
            log.error("Error creating default budget template: ", ex);
            throw new DataException("Error creating default budget template");
        }
    }

    public BPTemplate runTemplateBuild(BPTemplateType templateType, Period period, boolean requireCategoryHeaders, List<String> categoryHeaders, List<DateRange> dateRanges, BPIncomeCriteria incomeCriteria, Long userId, Integer startDay)
    {
//        if (templateType == null || dateRanges.isEmpty() || userId == null) {
//            throw new DataException("Template Type, Date Range, and User Id cannot be null");
//        }
//
//        // Guard: avoid duplicate templates of the same type for this user
//        List<BPTemplate> existing = templateService.getAllUserBudgetTemplates(userId);
//        if (existing != null) {
//            Optional<BPTemplate> match = existing.stream()
//                    .filter(t -> t.getTemplateType() == templateType)
//                    .findFirst();
//            if (match.isPresent()) return match.get();
//        }
//
//        List<SubBudget> subBudgets = subBudgetService.getSubBudgetsByDateRanges(dateRanges, userId);
//        BPTemplate initialTemplate = templateBuilder.buildInitialTemplate(
//                templateType, period, requireCategoryHeaders, categoryHeaders, incomeCriteria, subBudgets, startDay);
//
//        BPGoalsDetail initialGoals   = initialTemplate.getBpGoalsDetail();
//        BPTemplateDetail initialDetail = initialTemplate.getBpTemplateDetail();
//
//        // Save once
//        BPTemplateEntity savedTemplate = templateService.saveTemplate(initialTemplate, userId);
//        BPTemplateDetailEntity savedDetail = templateDetailsService.saveModel(initialDetail, savedTemplate);
//        List<BPColumnEntity> savedColumns = bpColumnService.saveColumns(
//                initialDetail.getLayoutGrid().columns(), savedDetail
//        );
//        categoryService.saveCategories(initialDetail.getLayoutGrid().rows(), savedColumns);
//
//        BPTemplate finalTemplate = templateBuilder.buildTemplate(initialTemplate, initialGoals, initialDetail);
//        return finalTemplate;  // ← no second save
        return null;
    }
}
