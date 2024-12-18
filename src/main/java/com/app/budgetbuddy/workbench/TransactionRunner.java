package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.PlaidTransaction;
import com.app.budgetbuddy.services.PlaidTransactionService;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.services.TransactionService;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
public class TransactionRunner
{
    private final PlaidTransactionManager plaidTransactionManager;
    private final TransactionService transactionService;
    private final RecurringTransactionService recurringTransactionService;
    private volatile boolean isRunning = false;

    @Autowired
    public TransactionRunner(PlaidTransactionManager plaidTransactionManager,
                             TransactionService transactionService,
                             RecurringTransactionService recurringTransactionService)
    {
        this.plaidTransactionManager = plaidTransactionManager;
        this.transactionService = transactionService;
        this.recurringTransactionService = recurringTransactionService;
    }

    @Scheduled(cron = "0 0 1 * * *")
    public void syncDailyTransactions(){

    }

    public void syncUserTransactions(Long userId){

    }

    private void processNewTransactions(Long userId, List<PlaidTransaction> plaidTransactions){

    }



}
