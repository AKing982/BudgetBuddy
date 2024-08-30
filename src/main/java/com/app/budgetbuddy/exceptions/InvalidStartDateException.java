package com.app.budgetbuddy.exceptions;

public class InvalidStartDateException extends IllegalArgumentException
{
    public InvalidStartDateException(String s) {
        super(s);
    }

    public InvalidStartDateException(String message, Throwable cause) {
        super(message, cause);
    }
}
