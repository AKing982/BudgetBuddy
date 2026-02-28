package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class CategoryWeeklySpending
{
    private String category;
    private BudgetScheduleRange weekRange;
    private double spentOnCategory;

    public CategoryWeeklySpending(String category, BudgetScheduleRange weekRange, double spentOnCategory)
    {
        this.category = category;
        this.weekRange = weekRange;
        this.spentOnCategory = spentOnCategory;
    }
}
