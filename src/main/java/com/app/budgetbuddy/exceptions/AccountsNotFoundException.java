package com.app.budgetbuddy.exceptions;

public class AccountsNotFoundException extends RuntimeException
{
    public AccountsNotFoundException(String message) {
        super(message);
    }
}
