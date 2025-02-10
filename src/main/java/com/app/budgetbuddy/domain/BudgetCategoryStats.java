package com.app.budgetbuddy.domain;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Data
@Slf4j
public class BudgetCategoryStats
{
    private List<BudgetPeriodCategory> budgetPeriodCategories;
    private List<Category> topExpenseCategories;
    private List<ExpenseCategory> expenseCategories;
    private List<Category> savingsCategories;
    private List<Category> incomeCategories;

    public BudgetCategoryStats(List<BudgetPeriodCategory> budgetPeriodCategories, List<Category> topExpenseCategories, List<ExpenseCategory> expenseCategories, List<Category> savingsCategories, List<Category> incomeCategories) {
        this.budgetPeriodCategories = budgetPeriodCategories;
        this.topExpenseCategories = topExpenseCategories;
        this.expenseCategories = expenseCategories;
        this.savingsCategories = savingsCategories;
        this.incomeCategories = incomeCategories;
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

    public void getBudgetCategoryStatsSummary()
    {
        log.info("Budget Category Stats Summary:");

        // Summary of Budget Period Categories
        log.info("Total Budget Period Categories: " +
                (budgetPeriodCategories != null ? budgetPeriodCategories.size() : 0));

        // Top Expense Categories
        log.info("Top Expense Categories: " +
                (topExpenseCategories != null ? topExpenseCategories.size() : 0));
        if (topExpenseCategories != null && !topExpenseCategories.isEmpty()) {
            log.info("Top Expense Category Names: " +
                    topExpenseCategories.stream()
                            .map(Category::getCategoryName)
                            .collect(Collectors.joining(", ")));
        }

        // Expense Categories
        log.info("Total Expense Categories: " +
                (expenseCategories != null ? expenseCategories.size() : 0));

        // Savings Categories
        log.info("Total Savings Categories: " +
                (savingsCategories != null ? savingsCategories.size() : 0));

        // Income Categories
        log.info("Total Income Categories: " +
                (incomeCategories != null ? incomeCategories.size() : 0));

        // Optional detailed breakdown for debugging or analytics
        if (expenseCategories != null && !expenseCategories.isEmpty()) {
            log.info("Expense Category Names: " +
                    expenseCategories.stream()
                            .map(Category::getCategoryName)
                            .collect(Collectors.joining(", ")));
        }
        if (savingsCategories != null && !savingsCategories.isEmpty()) {
            log.info("Savings Category Names: " +
                    savingsCategories.stream()
                            .map(Category::getCategoryName)
                            .collect(Collectors.joining(", ")));
        }
        if (incomeCategories != null && !incomeCategories.isEmpty()) {
            log.info("Income Category Names: " +
                    incomeCategories.stream()
                            .map(Category::getCategoryName)
                            .collect(Collectors.joining(", ")));
        }
    }
}
