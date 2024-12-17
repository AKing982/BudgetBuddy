package com.app.budgetbuddy.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BudgetScheduleJob
{
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private boolean success;
    private String errorMessage;
    private BudgetSchedule budgetSchedule;

    public BudgetScheduleJob(LocalDateTime startTime, LocalDateTime endTime, boolean success, String errorMessage, BudgetSchedule budgetSchedule){
        this.startTime = startTime;
        this.endTime = endTime;
        this.success = success;
        this.errorMessage = errorMessage;
        this.budgetSchedule = budgetSchedule;
    }
}
