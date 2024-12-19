package com.app.budgetbuddy.exceptions;

public class TransactionRunnerException extends RuntimeException
{
    public TransactionRunnerException(String message, Throwable cause) {
        super(message, cause);
    }

    public TransactionRunnerException(String message) {
        super(message);
    }
}
