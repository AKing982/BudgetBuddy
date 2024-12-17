package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.services.TransactionCategoryService;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.app.budgetbuddy.workbench.runner.BudgetScheduleRunner;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BudgetDataService
{
    private BudgetScheduleRunner budgetScheduleRunner;
    private PlaidTransactionManager plaidTransactionManager;
    private TransactionCategoryService transactionCategoryService;

    @Autowired
    public BudgetDataService(BudgetScheduleRunner budgetScheduleRunner,
                             PlaidTransactionManager plaidTransactionManager,
                             TransactionCategoryService transactionCategoryService)
    {
        this.budgetScheduleRunner = budgetScheduleRunner;
        this.plaidTransactionManager = plaidTransactionManager;
        this.transactionCategoryService = transactionCategoryService;
    }



}
