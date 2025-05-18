package com.app.budgetbuddy.services;

public interface TransactionServiceFactory
{
    TransactionService createTransactionService();
    RecurringTransactionService createRecurringTransactionService();
}
