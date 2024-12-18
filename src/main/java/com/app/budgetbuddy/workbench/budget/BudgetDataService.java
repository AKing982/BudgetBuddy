package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.services.TransactionCategoryService;
import com.app.budgetbuddy.workbench.TransactionRunner;
import com.app.budgetbuddy.workbench.runner.BudgetScheduleRunner;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BudgetDataService
{
    private BudgetScheduleRunner budgetScheduleRunner;
    private TransactionRunner transactionRunner;
    private TransactionCategoryService transactionCategoryService;

    @Autowired
    public BudgetDataService(BudgetScheduleRunner budgetScheduleRunner,
                             TransactionRunner transactionRunner,
                             TransactionCategoryService transactionCategoryService)
    {
        this.budgetScheduleRunner = budgetScheduleRunner;
        this.transactionRunner = transactionRunner;
        this.transactionCategoryService = transactionCategoryService;
    }



}
