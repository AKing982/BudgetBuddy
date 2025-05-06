package com.app.budgetbuddy.domain;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.*;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
public class MonthlyBudgetCategoryCriteria extends BudgetCategoryCriteriaBase
{
    private MonthlyCategorySpending monthlyCategorySpending;

    public MonthlyBudgetCategoryCriteria(String category, SubBudget subBudget, boolean active, MonthlyCategorySpending monthlyCategorySpending) {
        super(category, subBudget, active);
        this.monthlyCategorySpending = monthlyCategorySpending;
    }

    public static MonthlyBudgetCategoryCriteria buildCategoryBudget(SubBudget budget, String category, MonthlyCategorySpending monthlyCategorySpending) {

        MonthlyBudgetCategoryCriteria categoryBudget = new MonthlyBudgetCategoryCriteria();
        categoryBudget.setCategory(category);
        categoryBudget.setSubBudget(budget);
        categoryBudget.setActive(true);
        categoryBudget.setMonthlyCategorySpending(monthlyCategorySpending);
        return categoryBudget;
    }
}
