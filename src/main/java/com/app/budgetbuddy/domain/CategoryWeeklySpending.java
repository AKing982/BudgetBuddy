package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class CategoryWeeklySpending
{
    private String category;
    private BudgetScheduleRange budgetWeek;
    private double spentOnCategory;

    public CategoryWeeklySpending(String category, BudgetScheduleRange budgetWeek, double spentOnCategory)
    {
        this.category = category;
        this.budgetWeek = budgetWeek;
        this.spentOnCategory = spentOnCategory;
    }
}
