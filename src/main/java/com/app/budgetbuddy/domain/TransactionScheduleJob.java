package com.app.budgetbuddy.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TransactionScheduleJob
{
    private final LocalDateTime startTime;
    private LocalDateTime endTime;
    private boolean success;
    private String errorMessage;

    public TransactionScheduleJob(LocalDateTime startTime) {
        this.startTime = startTime;
        this.success = false;
    }

    public void setSuccess(boolean success) {
        this.success = success;
        this.endTime = LocalDateTime.now();
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
        this.success = false;
        this.endTime = LocalDateTime.now();
    }
}
