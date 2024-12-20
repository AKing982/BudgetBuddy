package com.app.budgetbuddy.workbench.runner;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

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

    @Scheduled(cron="0 0 0 * * *")
    public void runDailyBudgetUpdate(){

    }

    public void runBudget(Long userId, LocalDate startDate, LocalDate endDate){

    }

    public void runManualBudgetUpdate(Long userId, LocalDate date){

    }

    public boolean isProcessRunning(){return false;}

}
