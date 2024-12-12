package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class TransactionDataLoaderImpl implements TransactionLoader {

    private final TransactionService transactionService;

    @Autowired
    public TransactionDataLoaderImpl(final TransactionService transactionService)
    {
        this.transactionService = transactionService;
    }

    @Override
    public List<Transaction> loadTransactionsByDateRange(final Long userId, final LocalDate startDate, final LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new IllegalDateException("Start date cannot be null");
        }
        if(startDate.isAfter(endDate)) {
            return List.of();
        }
        return transactionService.getConvertedPlaidTransactions(userId, startDate, endDate);
    }


    @Override
    public List<Transaction> loadRecentTransactions(Long userId, int limit) {
        return transactionService.getRecentTransactionsForUser(userId, limit);
    }

    @Override
    public List<Transaction> loadTransactionsByCategory(String categoryId) {
        return transactionService.getTransactionsByCategory(categoryId);
    }

    @Override
    public List<Transaction> loadPendingTransactions(Long userId) {
        return transactionService.getPendingTransactionsForUser(userId);
    }

    @Override
    public List<Transaction> loadTransactionsByAmountRange(BigDecimal minAmount, BigDecimal maxAmount) {
        return transactionService.getTransactionsByAmountRange(minAmount, maxAmount);
    }

    @Override
    public List<Transaction> loadTransactionsByPosted(LocalDate date, Long userID) {
        return transactionService.getTransactionsByDate(date, userID);
    }
}
