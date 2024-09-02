package com.app.budgetbuddy.exceptions;

public class MaxAttemptsReachedException extends RuntimeException
{
    public MaxAttemptsReachedException(String message) {
        super(message);
    }

    public MaxAttemptsReachedException(String message, Throwable cause) {
        super(message, cause);
    }
}
