package com.app.budgetbuddy.exceptions;

public class TransactionRuleException extends RuntimeException
{
    public TransactionRuleException(String message, Throwable cause) {
        super(message, cause);
    }

    public TransactionRuleException(String message) {
        super(message);
    }
}
