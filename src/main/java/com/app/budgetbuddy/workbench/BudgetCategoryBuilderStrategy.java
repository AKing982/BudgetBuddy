package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.*;

import java.util.List;

public interface BudgetCategoryBuilderStrategy
{
    boolean supports(Period period);
    List<BudgetCategory> build(SubBudget subBudget, List<TransactionsByCategory> transactionsByCategory, BudgetScheduleRange budgetScheduleRange);
    List<BudgetCategory> update(SubBudget subBudget, List<TransactionsByCategory> transactionsByCategory, List<BudgetCategory> existingBudgetCategories, BudgetScheduleRange budgetScheduleRange);
}
