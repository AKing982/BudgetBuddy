package com.app.budgetbuddy.exceptions;

public class RecurringTransactionsNotFoundException extends RuntimeException
{
    public RecurringTransactionsNotFoundException(String message) {
        super(message);
    }
}
