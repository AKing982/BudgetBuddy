package com.app.budgetbuddy.exceptions;

public class BudgetCategoriesNotFoundException extends RuntimeException
{
    public BudgetCategoriesNotFoundException(String message) {
        super(message);
    }
}
