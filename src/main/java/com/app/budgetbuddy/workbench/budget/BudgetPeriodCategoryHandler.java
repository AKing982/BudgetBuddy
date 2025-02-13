package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.BudgetPeriodCategory;
import com.app.budgetbuddy.domain.BudgetSchedule;
import com.app.budgetbuddy.domain.SubBudget;

import java.util.List;

public interface BudgetPeriodCategoryHandler
{
    List<BudgetPeriodCategory> getBudgetPeriodCategories(BudgetSchedule budgetSchedule);
}
