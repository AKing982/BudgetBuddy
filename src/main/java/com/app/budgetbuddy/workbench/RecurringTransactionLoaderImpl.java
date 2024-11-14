package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.TransactionCriteria;
import com.app.budgetbuddy.services.RecurringTransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class RecurringTransactionLoaderImpl implements RecurringTransactionLoader
{
    private final RecurringTransactionService recurringTransactionService;

    @Autowired
    public RecurringTransactionLoaderImpl(RecurringTransactionService recurringTransactionService)
    {
        this.recurringTransactionService = recurringTransactionService;
    }

    @Override
    public List<RecurringTransaction> loadTransactionsByDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        return List.of();
    }


    @Override
    public List<RecurringTransaction> loadRecentTransactions(Long userId) {
        return List.of();
    }

    @Override
    public List<RecurringTransaction> loadTransactionsByCategory(String categoryId) {
        return List.of();
    }

    @Override
    public List<RecurringTransaction> loadPendingTransactions() {
        return List.of();
    }

    @Override
    public List<RecurringTransaction> loadTransactionsByAmountRange(BigDecimal minAmount, BigDecimal maxAmount) {
        return List.of();
    }
}
