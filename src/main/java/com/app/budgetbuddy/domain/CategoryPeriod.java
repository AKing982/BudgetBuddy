package com.app.budgetbuddy.domain;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.*;

@Data
@NoArgsConstructor
public class CategoryPeriod
{
    private String category;
    private List<Transaction> transactions;
    private List<DateRange> dateRanges;
    private Map<DateRange, Double> categoryBudgetAmount;
    private Map<DateRange, Double> categoryActualAmount;
    private Long budgetId;
    private Boolean isActive;

    public CategoryPeriod(String category, List<DateRange> dateRange){
        this.category = category;
        this.dateRanges = dateRange;
        this.transactions = new ArrayList<>();
    }

    public CategoryPeriod(String category, List<DateRange> dateRanges, Long budgetId, Boolean isActive) {
        this.category = category;
        this.dateRanges = dateRanges;
        this.budgetId = budgetId;
        this.isActive = isActive;
    }

    public void setBudgetForDateRange(DateRange dateRange, Double amount){
        if(categoryBudgetAmount == null){
            categoryBudgetAmount = new HashMap<>();
        }
        categoryBudgetAmount.put(dateRange, amount);
    }

    public void setCategoryActualAmountForDateRange(DateRange dateRange, Double amount)
    {
        if(categoryActualAmount == null){
            categoryActualAmount = new HashMap<>();
        }
        categoryActualAmount.put(dateRange, amount);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CategoryPeriod that = (CategoryPeriod) o;
        return Objects.equals(category, that.category) && Objects.equals(transactions, that.transactions) && Objects.equals(dateRanges, that.dateRanges) && Objects.equals(categoryBudgetAmount, that.categoryBudgetAmount) && Objects.equals(budgetId, that.budgetId) && Objects.equals(isActive, that.isActive);
    }

    @Override
    public int hashCode() {
        return Objects.hash(category, transactions, dateRanges, categoryBudgetAmount, budgetId, isActive);
    }
}
