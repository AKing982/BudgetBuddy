package com.app.budgetbuddy.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class TransactionServiceFactoryImpl
{
    private RegularTransactionFactory regularTransactionFactory;
    private RecurringTransactionFactory recurringTransactionFactory;

    @Autowired
    public TransactionServiceFactoryImpl(RegularTransactionFactory regularTransactionFactory,
                                         RecurringTransactionFactory recurringTransactionFactory)
    {
        this.regularTransactionFactory = regularTransactionFactory;
        this.recurringTransactionFactory = recurringTransactionFactory;
    }

    public TransactionServiceFactory getFactory(boolean isRecurring)
    {
        return isRecurring ? recurringTransactionFactory : regularTransactionFactory;
    }
}
