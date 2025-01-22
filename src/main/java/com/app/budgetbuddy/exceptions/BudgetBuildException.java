package com.app.budgetbuddy.exceptions;

public class BudgetBuildException extends RuntimeException
{
    public BudgetBuildException(String message, Throwable cause) {
        super(message, cause);
    }

    public BudgetBuildException(String message) {
        super(message);
    }
}
