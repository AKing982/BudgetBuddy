package com.app.budgetbuddy.exceptions;

public class InvalidAccessTokenException extends RuntimeException
{
    public InvalidAccessTokenException(String message, Throwable cause) {
        super(message, cause);
    }

    public InvalidAccessTokenException(String message) {
        super(message);
    }
}
