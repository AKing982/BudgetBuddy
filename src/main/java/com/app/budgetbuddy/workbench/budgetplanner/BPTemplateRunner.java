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

    public BPTemplate runTemplateBuildWithCategoryHeaders(BPTemplateType templateType, Period period, boolean requireCategoryHeaders, List<DateRange> dateRanges, List<String> categoryHeaders, Long userId, Integer startDay)
    {
        return null;
    }

    public BPTemplate runTemplateBuild(BPTemplateType templateType, Period period, List<DateRange> dateRanges, Long userId, Integer startDay)
    {
        try
        {
            Optional<BPTemplate> bpTemplateOptional = templateGeneratorService.generateNewTemplate(templateType, period, dateRanges, userId, startDay);
            if(bpTemplateOptional.isEmpty())
            {
                throw new DataException("Budget template not found");
            }
            return bpTemplateOptional.get();
        }catch(BPTemplateException ex){
            log.error("Error creating budget template: ", ex);
            throw new DataException("Error creating budget template");
        }
    }
}
