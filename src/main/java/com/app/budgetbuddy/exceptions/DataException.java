package com.app.budgetbuddy.exceptions;

public class DataException extends RuntimeException
{
    public DataException(String message, Throwable cause) {
        super(message, cause);
    }

    public DataException(String message) {
        super(message);
    }
}
