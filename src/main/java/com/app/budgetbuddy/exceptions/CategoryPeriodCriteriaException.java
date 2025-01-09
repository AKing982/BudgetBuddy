package com.app.budgetbuddy.exceptions;

public class CategoryPeriodCriteriaException extends RuntimeException
{
    public CategoryPeriodCriteriaException(String message) {
        super(message);
    }

    public CategoryPeriodCriteriaException(String message, Throwable cause) {
        super(message, cause);
    }
}
