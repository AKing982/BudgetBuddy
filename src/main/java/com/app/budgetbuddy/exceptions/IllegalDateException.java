package com.app.budgetbuddy.exceptions;

public class IllegalDateException extends IllegalArgumentException
{
    public IllegalDateException(String s) {
        super(s);
    }

    public IllegalDateException(String message, Throwable cause) {
        super(message, cause);
    }
}
