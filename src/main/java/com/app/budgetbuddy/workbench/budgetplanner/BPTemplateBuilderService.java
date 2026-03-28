package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;

public interface BPTemplateBuilderService
{
    BPTemplate buildInitialTemplate(BPTemplateType templateType, Period period, Long subBudgetId);
    BPTemplate buildTemplate(BPTemplate firstTemplate, BPGoalsDetail bpGoalsDetail, BPTemplateDetail bpTemplateDetail);
    BPTemplate saveTemplate(BPTemplate template);
}
