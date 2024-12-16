package com.app.budgetbuddy.workbench.runner;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BudgetScheduleRunner
{
    private final BudgetRunner budgetRunner;


    @Autowired
    public BudgetScheduleRunner(BudgetRunner budgetRunner)
    {
        this.budgetRunner = budgetRunner;
    }
}
