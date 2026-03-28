package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;

import java.util.List;

public interface BPRowBuilderService
{
    List<BPRow> buildCategoryRows(List<BudgetCategoryGroup> budgetCategoryGroups, List<BPColumn> columns);
    List<BPRow> buildBalanceRows(List<BPAccountBalance> bpAccountBalances, List<BPColumn> columns);
    List<BPRow> buildIncomeRows(List<BPIncome> incomes, List<BPColumn> columns);
    List<BPRow> buildSavingsRows(List<BPSavings> savings, List<BPColumn> columns);
}
