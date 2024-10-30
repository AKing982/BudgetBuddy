package com.app.budgetbuddy.exceptions;

public class InvalidBudgetAmountException extends IllegalArgumentException
{
    public InvalidBudgetAmountException(String s) {
        super(s);
    }
}
