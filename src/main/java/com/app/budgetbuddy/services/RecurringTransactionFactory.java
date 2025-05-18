package com.app.budgetbuddy.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class RecurringTransactionFactory implements TransactionServiceFactory
{
    private final RecurringTransactionService recurringTransactionService;

    @Autowired
    public RecurringTransactionFactory(RecurringTransactionService recurringTransactionService)
    {
        this.recurringTransactionService = recurringTransactionService;
    }

    @Override
    public TransactionService createTransactionService()
    {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public RecurringTransactionService createRecurringTransactionService()
    {
        return recurringTransactionService;
    }
}
