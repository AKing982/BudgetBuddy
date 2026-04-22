package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;

import java.util.List;

public interface BPTemplateBuilderService
{
    BPTemplate buildInitialTemplate(BPTemplateType templateType, Period period, boolean requireCategoryHeaders, List<String> categoryHeaders, BPIncomeCriteria incomeCriteria, List<SubBudget> subBudgets, Integer startDay);
    BPTemplate buildTemplate(BPTemplate firstTemplate, BPGoalsDetail bpGoalsDetail, BPTemplateDetail bpTemplateDetail);
}
