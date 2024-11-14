package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.Transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface TransactionDataLoaderBase<T extends Transaction>
{
    List<T> loadTransactionsByDateRange(Long userId, LocalDate startDate, LocalDate endDate);
    List<T> loadRecentTransactions(Long userId);
    List<T> loadTransactionsByCategory(String categoryId);
    List<T> loadPendingTransactions();
    List<T> loadTransactionsByAmountRange(BigDecimal minAmount, BigDecimal maxAmount);
}
