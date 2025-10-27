package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.PlaidTransaction;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.entities.TransactionsEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface TransactionService extends ServiceModel<TransactionsEntity>
{
    Collection<TransactionsEntity> getTransactionsByAmountBetween(BigDecimal startAmount, BigDecimal endAmount);
    Collection<TransactionsEntity> getTransactionsByAmount(BigDecimal amount);
    Collection<TransactionsEntity> getTransactionsByAmountGreaterThan(BigDecimal amount);
    Collection<TransactionsEntity> getTransactionsByAmountLessThan(BigDecimal amount);

    List<String> findTransactionIdsByIds(List<String> transactionIds);

    List<TransactionsEntity> convertPlaidTransactionsToEntities(List<PlaidTransaction> plaidTransactions);
    List<TransactionsEntity> createAndSaveTransactions(List<Transaction> transactions);

    void saveAll(List<Transaction> transactions);

    void saveTransactionsByDate(List<Transaction> transactions, LocalDate date);

    boolean checkTransactionExistsByDate(String transactionId, LocalDate date);
    List<Transaction> convertPlaidTransactions(List<com.plaid.client.model.Transaction> plaidTransactions);

    Optional<TransactionsEntity> getTransactionById(String id);
    Optional<TransactionsEntity> getTransactionByIdAndCategoryId(String id, String categoryId);
    List<TransactionsEntity> getTransactionsByDateRange(LocalDate startDate, LocalDate endDate);
    List<TransactionsEntity> getTransactionsForUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);
    Collection<TransactionsEntity> getTransactionsByPendingTrue();
    Collection<TransactionsEntity> getTransactionsByAuthorizedDate(LocalDate date);
    List<TransactionsEntity> getTransactionsByAccountId(String accountId);
    List<TransactionsEntity> getTransactionsByDescription(String description);
    Optional<TransactionsEntity> getTransactionByTransactionId(String transactionId);

    Map<String, Transaction> getTransactionsMap(List<String> transactionIds);
    void updateTransactionCategorizationFlag(String transactionId);

    Optional<Transaction> updateExistingTransaction(final Transaction modifiedTransaction);

    List<Transaction> getTransactionsByAmountRange(BigDecimal startAmount, BigDecimal endAmount);
    List<Transaction> getPendingTransactionsForUser(Long userId);
    List<Transaction> getTransactionsByCategory(String categoryId);
    List<Transaction> getRecentTransactionsForUser(Long userId, int limit);
    List<Transaction> getConvertedPlaidTransactions(Long userId, LocalDate startDate, LocalDate endDate);
    List<Transaction> getTransactionsByDate(LocalDate date, Long userID);
    Optional<Transaction> findTransactionById(String transactionId);
}
