package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BPColumnEntity;
import com.app.budgetbuddy.entities.BPTemplateDetailEntity;
import com.app.budgetbuddy.entities.BPTemplateEntity;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class BPTemplateRunner
{
    private final BPTemplateService templateService;
    private final BPTemplateDetailsService templateDetailsService;
    private final BPColumnService bpColumnService;
    private final BPTemplateBuilderService templateBuilder;
    private final SubBudgetService subBudgetService;
    private final BPCategoryService categoryService;

    @Autowired
    public BPTemplateRunner(BPTemplateService templateService,
                            BPColumnService bpColumnService,
                            BPTemplateDetailsService templateDetailsService,
                            BPTemplateBuilderService templateBuilder,
                            BPCategoryService bpcategoryService,
                            SubBudgetService subBudgetService)
    {
        this.templateService = templateService;
        this.bpColumnService = bpColumnService;
        this.templateDetailsService = templateDetailsService;
        this.templateBuilder = templateBuilder;
        this.categoryService = bpcategoryService;
        this.subBudgetService = subBudgetService;
    }

    public List<BPTemplate> getUserBudgetTemplates(Long userId)
    {
        try
        {
            return templateService.getAllUserBudgetTemplates(userId);
        }catch(DataException e){
           log.error("Error getting user budget templates: ", e);
           return Collections.emptyList();
        }
    }

    public BPTemplate runUpdateTemplatePeriod(Period period, Long templateId)
    {
        return null;
    }

    public BPTemplate runCustomTemplateBuild(BPTemplateType templateType, Period period, boolean requireCategoryHeaders, List<DateRange> dateRanges, List<String> categoryHeaders, List<CategoryAllocation> categoryAllocations, BPIncomeCriteria incomeCriteria)
    {
        return null;
    }

    public BPTemplate runDefaultTemplateBuild(Long userId)
    {
        DateRange templateDateRange = new DateRange();
        LocalDate currentDate = LocalDate.now();
        List<DateRange> monthRanges = templateDateRange.rangesByCurrentDateType(Period.MONTHLY, currentDate);
        List<SubBudget> subBudgets = subBudgetService.getSubBudgetsByDateRanges(monthRanges, userId);
        BPTemplate initialTemplate = templateBuilder.buildInitialTemplate(BPTemplateType.MONTHLY_STD, Period.MONTHLY, false, List.of(), null, subBudgets);

        BPTemplateEntity savedTemplate = templateService.saveTemplate(initialTemplate, userId);
        BPGoalsDetail initialGoals = initialTemplate.getBpGoalsDetail();
        BPTemplateDetail initialDetail = initialTemplate.getBpTemplateDetail();

        BPTemplateDetailEntity savedDetailEntity = templateDetailsService.saveModel(initialDetail, savedTemplate);
        List<BPColumnEntity> savedColumns = bpColumnService.saveColumns(initialDetail.getLayoutGrid().columns(), savedDetailEntity);
        categoryService.saveCategories(initialDetail.getLayoutGrid().rows(), savedColumns);
        return templateBuilder.buildTemplate(initialTemplate, initialGoals, initialDetail);
    }

    public BPTemplate runTemplateBuild(BPTemplateType templateType, Period period, boolean requireCategoryHeaders, List<String> categoryHeaders, List<DateRange> dateRanges, BPIncomeCriteria incomeCriteria, Long userId)
    {
        if (templateType == null || dateRanges.isEmpty() || userId == null) {
            throw new DataException("Template Type, Date Range, and User Id cannot be null");
        }

        // Guard: avoid duplicate templates of the same type for this user
        List<BPTemplate> existing = templateService.getAllUserBudgetTemplates(userId);
        if (existing != null) {
            Optional<BPTemplate> match = existing.stream()
                    .filter(t -> t.getTemplateType() == templateType)
                    .findFirst();
            if (match.isPresent()) return match.get();
        }

        List<SubBudget> subBudgets = subBudgetService.getSubBudgetsByDateRanges(dateRanges, userId);
        BPTemplate initialTemplate = templateBuilder.buildInitialTemplate(
                templateType, period, requireCategoryHeaders, categoryHeaders, incomeCriteria, subBudgets
        );

        BPGoalsDetail initialGoals   = initialTemplate.getBpGoalsDetail();
        BPTemplateDetail initialDetail = initialTemplate.getBpTemplateDetail();

        // Save once
        BPTemplateEntity savedTemplate = templateService.saveTemplate(initialTemplate, userId);
        BPTemplateDetailEntity savedDetail = templateDetailsService.saveModel(initialDetail, savedTemplate);
        List<BPColumnEntity> savedColumns = bpColumnService.saveColumns(
                initialDetail.getLayoutGrid().columns(), savedDetail
        );
        categoryService.saveCategories(initialDetail.getLayoutGrid().rows(), savedColumns);

        BPTemplate finalTemplate = templateBuilder.buildTemplate(initialTemplate, initialGoals, initialDetail);
        return finalTemplate;  // ← no second save
    }


}
