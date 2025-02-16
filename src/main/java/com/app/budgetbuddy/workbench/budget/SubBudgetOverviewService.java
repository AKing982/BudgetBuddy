package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.ExpenseCategory;
import com.app.budgetbuddy.domain.IncomeCategory;
import com.app.budgetbuddy.domain.SavingsCategory;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SubBudgetOverviewService
{
    Optional<IncomeCategory> loadIncomeCategory(Long budgetId, LocalDate startDate, LocalDate endDate);
    Optional<ExpenseCategory> loadExpenseCategory(Long budgetId, LocalDate startDate, LocalDate endDate);
    Optional<SavingsCategory> loadSavingsCategory(Long budgetId, LocalDate startDate, LocalDate endDate);
    List<ExpenseCategory> loadTopExpenseCategories(Long budgetId, LocalDate startDate, LocalDate endDate);
}
