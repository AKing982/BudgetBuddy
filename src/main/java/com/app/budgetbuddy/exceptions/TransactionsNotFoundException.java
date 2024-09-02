package com.app.budgetbuddy.exceptions;

public class TransactionsNotFoundException extends RuntimeException
{
    public TransactionsNotFoundException(String message) {
        super(message);
    }

    public TransactionsNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
