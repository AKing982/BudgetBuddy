package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.services.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TransactionDataLoader {

    private TransactionService transactionService;
    private RecurringTransactionService recurringTransactionService;

    @Autowired
    public TransactionDataLoader(TransactionService transactionService, RecurringTransactionService recurringTransactionService) {
        this.transactionService = transactionService;
    }

    public List<Transaction> loadTransactions()
    {
        return null;
    }

    public List<Transaction> loadTransactionsByUser(Long userId)
    {
        return null;
    }

    public List<RecurringTransaction> loadRecurringTransactionsByUser(Long userId)
    {
        return null;
    }

}
