package com.app.budgetbuddy.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryPeriod
{
    private String category;
    private List<Transaction> transactions;
    private CategoryPeriodCriteria categoryPeriodCriteria;
    private Long budgetId;
    private Boolean isActive;

    public CategoryPeriod(String category, List<DateRange> dateRange){
        this.category = category;
        this.categoryPeriodCriteria = new CategoryPeriodCriteria();
        this.categoryPeriodCriteria.setCategoryDateRanges(dateRange);
        this.transactions = new ArrayList<>();
    }

    public CategoryPeriod(String category, List<DateRange> dateRanges, Long budgetId, Boolean isActive) {
        this.category = category;
        this.categoryPeriodCriteria = new CategoryPeriodCriteria();
        this.categoryPeriodCriteria.setCategoryDateRanges(dateRanges);
        this.budgetId = budgetId;
        this.isActive = isActive;
    }

    public void setBudgetForDateRange(DateRange dateRange, Double amount) {
        categoryPeriodCriteria.addBudgetAmount(dateRange, amount);
    }

    public void setCategoryActualAmountForDateRange(DateRange dateRange, Double amount) {
        categoryPeriodCriteria.addActualAmount(dateRange, amount);
    }




}
