package com.app.budgetbuddy.exceptions;

public class InvalidBudgetActualAmountException extends IllegalArgumentException
{
    public InvalidBudgetActualAmountException(String s) {
        super(s);
    }
}
