package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BudgetCategoryCriteriaBase
{
    private String category;
    private SubBudget subBudget;
    private boolean active;

    public BudgetCategoryCriteriaBase(String category, SubBudget subBudget, boolean active)
    {
        this.category = category;
        this.subBudget = subBudget;
        this.active = active;
    }
}
