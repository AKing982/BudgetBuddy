package com.app.budgetbuddy.domain;

import lombok.Data;

@Data
public class CategoryBudget
{
    private Budget budget;
    private String category;
    private Double categoryBudgetAmount;
    private Double categorySpentAmount;
    private DateRange budgetPeriod;

    public CategoryBudget(Budget budget, String category, Double categoryBudgetAmount, Double categorySpentAmount, DateRange budgetPeriod) {
        this.budget = budget;
        this.category = category;
        this.categoryBudgetAmount = categoryBudgetAmount;
        this.categorySpentAmount = categorySpentAmount;
        this.budgetPeriod = budgetPeriod;
    }
}
