package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.domain.Category;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface BudgetQueriesService
{
    List<Category> getTopExpenseBudgetCategories(final Long budgetId, final LocalDate startDate, final LocalDate endDate);

    List<Category> getIncomeBudgetCategory(final Long budgetId, final LocalDate startDate, final LocalDate endDate);

    List<Category> getSavingsBudgetCategory(final Long budgetId, final LocalDate startDate, final LocalDate endDate);

    List<Category> getExpensesBudgetCategories(final Long budgetId, final LocalDate startDate, final LocalDate endDate);

    BigDecimal getTotalBudgeted(final Long budgetId, final Long userId, final LocalDate startDate, final LocalDate endDate);

    BigDecimal getRemainingOnBudget(final Long budgetId, final LocalDate startDate, final LocalDate endDate);

    BigDecimal getTotalSpentOnBudget(final Long budgetId, final LocalDate startDate, final LocalDate endDate);
}
