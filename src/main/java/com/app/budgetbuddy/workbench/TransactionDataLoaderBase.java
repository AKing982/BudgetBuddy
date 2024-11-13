package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.Transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface TransactionDataLoaderBase<T extends Transaction>
{
    List<T> loadTransactionsByDateRange(LocalDate startDate, LocalDate endDate);
    List<T> loadTransactionsByUserDateRange(Long userId, LocalDate startDate, LocalDate endDate);
    List<T> loadRecentTransactions();
    List<T> loadTransactionsByCategory(String categoryId);
    List<T> loadPendingTransactions();
    List<T> loadTransactionsByAmountRange(BigDecimal minAmount, BigDecimal maxAmount);
}
