package com.app.budgetbuddy.domain;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Data
@Slf4j
public class BudgetCategoryStats
{
    private List<BudgetPeriodCategory> budgetPeriodCategories;
    private List<ExpenseCategory> topExpenseCategories;
    private ExpenseCategory expenseCategories;
    private SavingsCategory savingsCategories;
    private IncomeCategory incomeCategories;

    public BudgetCategoryStats(List<BudgetPeriodCategory> budgetPeriodCategories, List<ExpenseCategory> topExpenseCategories, Optional<ExpenseCategory> expenseCategories, Optional<SavingsCategory> savingsCategories, Optional<IncomeCategory> incomeCategories) {
        this.budgetPeriodCategories = budgetPeriodCategories;
        this.topExpenseCategories = topExpenseCategories;
        this.expenseCategories = expenseCategories.orElse(null);
        this.savingsCategories = savingsCategories.orElse(null);
        this.incomeCategories = incomeCategories.orElse(null);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BudgetCategoryStats that = (BudgetCategoryStats) o;
        return Objects.equals(budgetPeriodCategories, that.budgetPeriodCategories) && Objects.equals(topExpenseCategories, that.topExpenseCategories) && Objects.equals(expenseCategories, that.expenseCategories) && Objects.equals(savingsCategories, that.savingsCategories) && Objects.equals(incomeCategories, that.incomeCategories);
    }

    @Override
    public int hashCode() {
        return Objects.hash(budgetPeriodCategories, topExpenseCategories, expenseCategories, savingsCategories, incomeCategories);
    }

    public void getBudgetCategoryStatsSummary() {
        log.info("Budget Category Stats Summary:");
        log.info("Total Budget Period Categories: {}", budgetPeriodCategories.size());
        log.info("Top Expense Categories: {}", topExpenseCategories.size());

        if (expenseCategories != null) {
            log.info("Expense Category Summary:");
            log.info("  Budgeted: ${}", expenseCategories.getBudgetedExpenses());
            log.info("  Actual: ${}", expenseCategories.getActualExpenses());
            log.info("  Remaining: ${}", expenseCategories.getRemainingExpenses());
        }

        if (savingsCategories != null) {
            log.info("Savings Category Summary:");
            log.info("  Target Amount: ${}", savingsCategories.getBudgetedSavingsTarget());
            log.info("  Total Saved: ${}", savingsCategories.getActualSavedAmount());
        }

        if (incomeCategories != null) {
            log.info("Income Category Summary:");
            log.info("  Budgeted Income: ${}", incomeCategories.getBudgetedIncome());
            log.info("  Actual Income: ${}", incomeCategories.getActualBudgetedIncome());
            log.info("  Remaining Income: ${}", incomeCategories.getRemainingIncome());
        }
    }
}
