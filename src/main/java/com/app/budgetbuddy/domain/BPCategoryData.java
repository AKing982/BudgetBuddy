package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;


@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@Deprecated
public class BPCategoryData
{
    private List<BPBudgetCategory> budgetCategories;
    private List<BudgetCategoryGroup> budgetCategoryGroups;
    private List<BPAccountBalance> accountBalances;
    private List<BPExpenses> expenses;
    private List<BPIncome> incomes;
    private List<BPSavings> savings;

    public BPCategoryData(List<BPBudgetCategory> budgetCategories, List<BudgetCategoryGroup> budgetCategoryGroups, List<BPAccountBalance> accountBalances, List<BPExpenses> expenses, List<BPIncome> incomes, List<BPSavings> savings)
    {
        this.budgetCategories = budgetCategories;
        this.budgetCategoryGroups = budgetCategoryGroups;
        this.accountBalances = accountBalances;
        this.expenses = expenses;
        this.incomes = incomes;
        this.savings = savings;
    }

}
