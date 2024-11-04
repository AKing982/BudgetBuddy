package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.workbench.budget.BudgetSetupEngine;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BudgetSetupRunner
{
    private BudgetSetupEngine budgetSetupEngine;

    @Autowired
    public BudgetSetupRunner(BudgetSetupEngine budgetSetupEngine)
    {
        this.budgetSetupEngine = budgetSetupEngine;
    }
}
