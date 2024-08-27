package com.app.budgetbuddy.exceptions;

public class PlaidLinkException extends RuntimeException
{
    public PlaidLinkException(String message) {
        super(message);
    }

    public PlaidLinkException(String message, Throwable cause) {
        super(message, cause);
    }
}
