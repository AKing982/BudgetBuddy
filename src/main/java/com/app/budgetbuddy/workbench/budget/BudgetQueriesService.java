package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetCategory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface BudgetQueriesService
{
    List<BudgetCategory> getTopExpenseBudgetCategories(final Long budgetId, final LocalDate startDate, final LocalDate endDate);

    List<BudgetCategory> getIncomeBudgetCategory(final Long budgetId, final LocalDate startDate, final LocalDate endDate);

    List<BudgetCategory> getSavingsBudgetCategory(final Long budgetId, final LocalDate startDate, final LocalDate endDate);

    List<BudgetCategory> getExpensesBudgetCategories(final Long budgetId, final LocalDate startDate, final LocalDate endDate);

    BigDecimal getTotalBudgeted(final Long budgetId, final LocalDate startDate, final LocalDate endDate);

    BigDecimal getRemainingOnBudget(final Long budgetId, final LocalDate startDate, final LocalDate endDate);

    BigDecimal getTotalSpentOnBudget(final Long budgetId, final LocalDate startDate, final LocalDate endDate);
}
