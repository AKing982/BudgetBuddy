package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;

import java.util.List;

public interface BPBudgetCategoryBuilderService
{
    List<BPBudgetCategory> buildBPBudgetCategories(List<BudgetCategory> budgetCategories, SubBudget subBudget);
    BPBudgetCategory saveBPBudgetCategory(BPBudgetCategory budgetCategory);
}
