package com.app.budgetbuddy.exceptions;

public class InvalidDataException extends IllegalArgumentException
{
    public InvalidDataException(String s) {
        super(s);
    }
}
