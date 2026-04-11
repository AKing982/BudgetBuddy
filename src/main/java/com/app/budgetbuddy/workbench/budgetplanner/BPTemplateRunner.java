package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.BPTemplateService;
import com.app.budgetbuddy.services.SubBudgetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BPTemplateRunner
{
    private final BPTemplateService templateService;
    private final BPTemplateBuilderService templateBuilder;
    private final SubBudgetService subBudgetService;

    @Autowired
    public BPTemplateRunner(BPTemplateService templateService,
                            BPTemplateBuilderService templateBuilder,
                            SubBudgetService subBudgetService) {
        this.templateService = templateService;
        this.templateBuilder = templateBuilder;
        this.subBudgetService = subBudgetService;

    }

    public BPTemplate runTemplateBuild(BPTemplateType templateType, Period period, List<DateRange> dateRanges, Long userId) {
        if (templateType == null || dateRanges.isEmpty() || userId == null) {
            throw new DataException("Template Type, Date Range, and User Id cannot be null");
        }
        List<SubBudget> subBudgets = subBudgetService.getSubBudgetsByDateRanges(dateRanges, userId);
        BPTemplate initialTemplate = templateBuilder.buildInitialTemplate(templateType, period, subBudgets);
        BPGoalsDetail initialGoals = initialTemplate.getBpGoalsDetail();
        BPTemplateDetail initialDetail = initialTemplate.getBpTemplateDetail();
        BPTemplate finalTemplate = templateBuilder.buildTemplate(initialTemplate, initialGoals, initialDetail);

        return null;
    }

    private void saveTemplate(BPTemplate template)
    {

    }

}
