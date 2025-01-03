package com.app.budgetbuddy.exceptions;

public class BudgetPeriodException extends RuntimeException
{
    public BudgetPeriodException(String message, Throwable cause) {
        super(message, cause);
    }

    public BudgetPeriodException(String message) {
        super(message);
    }
}
