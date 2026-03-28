package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;

public interface BPLayoutBuilderService
{
    BPLayout buildLayout(BPTemplateType templateType, BudgetSchedule budgetSchedule);
}
