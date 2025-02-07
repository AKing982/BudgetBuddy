package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.ExpenseCategory;
import com.app.budgetbuddy.domain.IncomeCategory;
import com.app.budgetbuddy.domain.SavingsCategory;

import java.time.LocalDate;
import java.util.List;

public interface SubBudgetOverviewService
{
    List<IncomeCategory> loadIncomeCategories(Long budgetId, LocalDate startDate, LocalDate endDate);
    List<ExpenseCategory> loadExpenseCategories(Long budgetId, LocalDate startDate, LocalDate endDate);
    List<SavingsCategory> loadSavingsCategories(Long budgetId, LocalDate startDate, LocalDate endDate);
}
