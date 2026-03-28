package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BPRowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BPRowBuilderServiceImpl implements BPRowBuilderService
{
    private final BPRowService rowService;

    @Autowired
    public BPRowBuilderServiceImpl(BPRowService bpRowService)
    {
        this.rowService = bpRowService;
    }


    @Override
    public List<BPRow> buildCategoryRows(List<BudgetCategoryGroup> budgetCategoryGroups, List<BPColumn> columns)
    {
        return List.of();
    }

    @Override
    public List<BPRow> buildBalanceRows(List<BPAccountBalance> bpAccountBalances, List<BPColumn> columns) {
        return List.of();
    }

    @Override
    public List<BPRow> buildIncomeRows(List<BPIncome> incomes, List<BPColumn> columns) {
        return List.of();
    }

    @Override
    public List<BPRow> buildSavingsRows(List<BPSavings> savings, List<BPColumn> columns) {
        return List.of();
    }
}
