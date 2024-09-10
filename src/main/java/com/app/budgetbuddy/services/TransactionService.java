package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.TransactionsEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Optional;

public interface TransactionService extends ServiceModel<TransactionsEntity>
{
    Collection<TransactionsEntity> getTransactionsByAmountBetween(BigDecimal startAmount, BigDecimal endAmount);
    Collection<TransactionsEntity> getTransactionsByAmount(BigDecimal amount);
    Collection<TransactionsEntity> getTransactionsByAmountGreaterThan(BigDecimal amount);
    Collection<TransactionsEntity> getTransactionsByAmountLessThan(BigDecimal amount);

    Collection<TransactionsEntity> getTransactionsByPendingTrue();
    Collection<TransactionsEntity> getTransactionsByAuthorizedDate(LocalDate date);
    Optional<TransactionsEntity> getTransactionByAccountId(String accountId);
    Optional<TransactionsEntity> getTransactionByDescription(String description);
    Optional<TransactionsEntity> getTransactionByTransactionId(String transactionId);
    Collection<TransactionsEntity> getTransactionsByMerchantName(String merchantName);
}
