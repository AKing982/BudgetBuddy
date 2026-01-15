package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@NoArgsConstructor(access= AccessLevel.PUBLIC)
@EqualsAndHashCode(callSuper=true)
@Getter
public class WeeklyBudgetCategoryCriteria extends BudgetCategoryCriteriaBase
{
    private WeeklyCategorySpending weeklyCategorySpending;

    public WeeklyBudgetCategoryCriteria(String category, WeeklyCategorySpending weeklyCategorySpending, SubBudget subBudget, boolean isActive)
    {
        super(category, subBudget, isActive);
        this.weeklyCategorySpending = weeklyCategorySpending;
    }

    public static WeeklyBudgetCategoryCriteria createWeeklyBudgetCategoryCriteria(String category, WeeklyCategorySpending weeklyCategorySpending, SubBudget subBudget, boolean isActive)
    {
        return new WeeklyBudgetCategoryCriteria(category, weeklyCategorySpending, subBudget, isActive);
    }
}
