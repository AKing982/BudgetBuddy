package com.app.budgetbuddy.exceptions;

import java.io.IOException;

public class PlaidApiException extends IOException
{
    public PlaidApiException(String message) {
        super(message);
    }

    public PlaidApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
