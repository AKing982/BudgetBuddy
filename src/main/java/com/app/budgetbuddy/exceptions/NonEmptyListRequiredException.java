package com.app.budgetbuddy.exceptions;

public class NonEmptyListRequiredException extends RuntimeException
{
    public NonEmptyListRequiredException(String message) {
        super(message);
    }

    public NonEmptyListRequiredException(String message, Throwable cause) {
        super(message, cause);
    }
}
