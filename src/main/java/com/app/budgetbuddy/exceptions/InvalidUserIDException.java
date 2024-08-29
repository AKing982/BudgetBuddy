package com.app.budgetbuddy.exceptions;

public class InvalidUserIDException extends IllegalArgumentException
{
    public InvalidUserIDException(String s) {
        super(s);
    }

    public InvalidUserIDException(String message, Throwable cause) {
        super(message, cause);
    }
}
