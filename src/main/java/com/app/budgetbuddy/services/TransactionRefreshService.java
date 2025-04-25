package com.app.budgetbuddy.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class TransactionRefreshService
{
    private final TransactionService transactionService;
    private final TransactionRefreshThreadService transactionRefreshThreadService;

    @Autowired
    public TransactionRefreshService(TransactionService transactionService,
                                     TransactionRefreshThreadService transactionRefreshThreadService)
    {
        this.transactionService = transactionService;
        this.transactionRefreshThreadService = transactionRefreshThreadService;
    }
}
