package com.app.budgetbuddy.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryBudget
{
    private String categoryId;
    private String category;
    private SubBudget budget;
    private BudgetSchedule budgetSchedule;
    private List<Transaction> categoryTransactions;
    private List<DateRange> categoryDateRanges;
    private List<BudgetPeriodAmount> budgetedAmounts;
    private List<BudgetPeriodAmount> actualAmounts;
    private boolean active;

    public CategoryBudget(String categoryId, SubBudget budget, BudgetSchedule budgetSchedule, List<DateRange> categoryDateRanges, boolean active) {
        this.categoryId = categoryId;
        this.budget = budget;
        this.budgetSchedule = budgetSchedule;
        this.categoryDateRanges = categoryDateRanges;
        this.active = active;
    }

    public CategoryBudget(String categoryId, String category, List<DateRange> dateRanges, Boolean isActive) {
        this.categoryId = categoryId;
        this.category = category;
        this.categoryDateRanges = dateRanges;
        this.budgetedAmounts = new ArrayList<>();
        this.actualAmounts = new ArrayList<>();
        this.active = isActive;
    }

    public CategoryBudget(String category, List<DateRange> dateRange){
        this.category = category;
        this.categoryDateRanges = dateRange;
        this.budgetedAmounts = new ArrayList<>();
        this.actualAmounts = new ArrayList<>();
    }

    public CategoryBudget(String category, List<DateRange> dateRanges, SubBudget budget, Boolean isActive) {
        this.category = category;
        this.categoryDateRanges = dateRanges;
        this.budgetedAmounts = new ArrayList<>();
        this.actualAmounts = new ArrayList<>();
        this.budget = budget;
        this.active = isActive;
    }

    public CategoryBudget(String categoryId, String category, List<DateRange> dateRanges, SubBudget budget, List<Transaction> categoryTransactions, Boolean isActive) {
        this.categoryId = categoryId;
        this.category = category;
        this.categoryDateRanges = dateRanges;
        this.budgetedAmounts = new ArrayList<>();
        this.actualAmounts = new ArrayList<>();
        this.budget = budget;
        this.active = isActive;
        this.categoryTransactions = categoryTransactions;
    }

    public Double getBudgetAmount(DateRange dateRange) {
        return budgetedAmounts.stream()
                .filter(dra -> dra.getDateRange().equals(dateRange))
                .findFirst()
                .map(BudgetPeriodAmount::getAmount)
                .orElse(null);
    }


    public Double getActualAmount(DateRange dateRange) {
        return actualAmounts.stream()
                .filter(dra -> dra.getDateRange().equals(dateRange))
                .findFirst()
                .map(BudgetPeriodAmount::getAmount)
                .orElse(null);
    }

    public static CategoryBudget buildCategoryBudget(List<BudgetPeriodAmount> budgetedAmounts, List<BudgetPeriodAmount> actualBudgetAmounts,
                                               List<DateRange> categoryDateRanges, SubBudget budget, List<Transaction> transactions, String category) {

        CategoryBudget categoryBudget = new CategoryBudget();
        categoryBudget.setCategory(category);
        categoryBudget.setBudget(budget);
        categoryBudget.setActive(true);
        categoryBudget.setCategoryTransactions(transactions);
        categoryBudget.setActualAmounts(actualBudgetAmounts);
        categoryBudget.setBudgetedAmounts(budgetedAmounts);
        categoryBudget.setCategoryDateRanges(categoryDateRanges);

        return categoryBudget;
    }

    public static CategoryBudget buildCategoryBudget(String categoryId, String category, List<Transaction> transactions,  List<BudgetPeriodAmount> budgetedAmounts, List<BudgetPeriodAmount> actualBudgetAmounts,
                                                     List<DateRange> categoryDateRanges, SubBudget budget, boolean isActive) {

        CategoryBudget categoryBudget = new CategoryBudget();
        categoryBudget.setCategory(category);
        categoryBudget.setBudget(budget);
        categoryBudget.setCategoryId(categoryId);
        categoryBudget.setActive(isActive);
        categoryBudget.setCategoryTransactions(transactions);
        categoryBudget.setActualAmounts(actualBudgetAmounts);
        categoryBudget.setBudgetedAmounts(budgetedAmounts);
        categoryBudget.setCategoryDateRanges(categoryDateRanges);

        return categoryBudget;
    }

    public void setCategoryBudgetAmountForDateRange(DateRange dateRange, Double amount) {
        budgetedAmounts.add(new BudgetPeriodAmount(dateRange, amount));
    }

    public void setCategoryBudgetActualAmountForDateRange(DateRange dateRange, Double amount) {
        actualAmounts.add(new BudgetPeriodAmount(dateRange, amount));
    }
}
