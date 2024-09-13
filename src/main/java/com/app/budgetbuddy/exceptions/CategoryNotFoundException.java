package com.app.budgetbuddy.exceptions;

public class CategoryNotFoundException extends RuntimeException
{
    public CategoryNotFoundException(String message) {
        super(message);
    }
}
