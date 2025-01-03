package com.app.budgetbuddy.exceptions;

public class TransactionsScheduleException extends RuntimeException
{
    public TransactionsScheduleException(String message, Throwable cause) {
        super(message, cause);
    }

    public TransactionsScheduleException(String message) {
        super(message);
    }
}
