package com.app.budgetbuddy.workbench.runner;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class BudgetScheduleRunner
{
    private final BudgetRunner budgetRunner;
    private volatile boolean isRunning = false;



    @Autowired
    public BudgetScheduleRunner(BudgetRunner budgetRunner)
    {
        this.budgetRunner = budgetRunner;
    }

    @Scheduled(cron="${budget.runnder.schedule}")
    public void runScheduledBudgetUpdate(){

    }

    public boolean isProcessRunning(){return false;}

}
