package com.app.budgetbuddy.exceptions;

public class BudgetScheduleException extends RuntimeException
{
    public BudgetScheduleException(String message, Throwable cause) {
        super(message, cause);
    }

    public BudgetScheduleException(String message) {
        super(message);
    }
}
