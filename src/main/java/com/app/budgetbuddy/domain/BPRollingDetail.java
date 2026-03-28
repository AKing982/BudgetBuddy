package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class BPRollingDetail
{
    private List<BPColumn> columns;
    private List<BudgetCategoryGroup> budgetCategoryGroups;

    private List<BPBudgetCategory> bpBudgetCategories;
    private List<BPAccountBalance> accountBalances;
    private List<BPRow> incomeRows;
    private List<BPRow> savingsRows;
    private boolean isClassic;
    private boolean isVisual;
}
