package com.app.budgetbuddy.domain;

import lombok.*;

import java.util.List;

@NoArgsConstructor(access= AccessLevel.PUBLIC)
@AllArgsConstructor(access= AccessLevel.PUBLIC)
@EqualsAndHashCode(callSuper=true)
@Getter
@Setter
@Builder
public class WeeklyBudgetCategoryCriteria extends BudgetCategoryCriteriaBase
{
    private WeeklyCategorySpending weeklyCategorySpending;

    public WeeklyBudgetCategoryCriteria(WeeklyCategorySpending weeklyCategorySpending, SubBudget subBudget, boolean isActive)
    {
        super(weeklyCategorySpending.getCategory(),subBudget, isActive);
        this.weeklyCategorySpending = weeklyCategorySpending;
    }
}
