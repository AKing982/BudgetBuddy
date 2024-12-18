package com.app.budgetbuddy.exceptions;

public class DateRangeException extends RuntimeException
{
    public DateRangeException(String message, Throwable cause) {
        super(message, cause);
    }

    public DateRangeException(String message) {
        super(message);
    }
}
