package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.entities.TransactionsEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TransactionService extends ServiceModel<TransactionsEntity>
{
    Collection<TransactionsEntity> getTransactionsByAmountBetween(BigDecimal startAmount, BigDecimal endAmount);
    Collection<TransactionsEntity> getTransactionsByAmount(BigDecimal amount);
    Collection<TransactionsEntity> getTransactionsByAmountGreaterThan(BigDecimal amount);
    Collection<TransactionsEntity> getTransactionsByAmountLessThan(BigDecimal amount);

    List<TransactionsEntity> createAndSaveTransactions(List<Transaction> transactions);

    Optional<TransactionsEntity> getTransactionById(String id);
    Optional<TransactionsEntity> getTransactionByIdAndCategoryId(String id, String categoryId);
    List<String> getCategoriesForTransaction(Long id, String categoryId);
    Collection<TransactionsEntity> loadTransactionsForUser(Long userId);
    List<TransactionsEntity> getTransactionsForUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);
    Collection<TransactionsEntity> getTransactionsByPendingTrue();
    Collection<TransactionsEntity> getTransactionsByAuthorizedDate(LocalDate date);
    List<TransactionsEntity> getTransactionsByAccountId(String accountId);
    List<TransactionsEntity> getTransactionsByDescription(String description);
    Optional<TransactionsEntity> getTransactionByTransactionId(String transactionId);
    Collection<TransactionsEntity> getTransactionsByMerchantName(String merchantName);
}
