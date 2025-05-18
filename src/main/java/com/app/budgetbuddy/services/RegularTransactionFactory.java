package com.app.budgetbuddy.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class RegularTransactionFactory implements TransactionServiceFactory
{
    private final TransactionService transactionService;

    @Autowired
    public RegularTransactionFactory(TransactionService transactionService)
    {
        this.transactionService = transactionService;
    }

    @Override
    public TransactionService createTransactionService()
    {
        return transactionService;
    }

    @Override
    public RecurringTransactionService createRecurringTransactionService() {
        throw new UnsupportedOperationException("Not supported yet.");
    }
}
