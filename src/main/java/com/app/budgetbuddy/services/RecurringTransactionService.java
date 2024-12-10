package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.RecurringTransactionDTO;
import com.app.budgetbuddy.domain.RecurringTransactionType;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.RecurringTransactionEntity;
import com.plaid.client.model.TransactionStream;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RecurringTransactionService extends ServiceModel<RecurringTransactionEntity>
{

    List<RecurringTransactionEntity> createRecurringTransactionEntitiesFromStream(List<TransactionStream> outflow, List<TransactionStream> inflow, Long userId);

    Optional<RecurringTransactionEntity> findById(Long id);
    List<RecurringTransactionEntity> findAllByUserId(Long userId);
    List<RecurringTransactionEntity> findAllByAccountId(String accountId);
    List<RecurringTransactionEntity> findByStreamId(String streamId);
    List<RecurringTransactionEntity> findAllActive();
    List<RecurringTransactionEntity> findAllByType(RecurringTransactionType type);
    List<RecurringTransactionEntity> findByDateRange(LocalDate startDate, LocalDate endDate);
    List<RecurringTransactionEntity> findByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);
    List<RecurringTransactionEntity> findByMerchantName(String merchantName);
    List<RecurringTransactionEntity> findByCategory(CategoryEntity category);

    BigDecimal getTotalRecurringExpensesForPeriod(Long userId, LocalDate startDate, LocalDate endDate);
    List<RecurringTransaction> findIncomeRecurringTransactionByCategoryAndUserId(String categoryName, String categoryId, Long userId, LocalDate startDate, LocalDate endDate);

    List<RecurringTransaction> getRecurringTransactions(Long userId, LocalDate startDate, LocalDate endDate);
    List<RecurringTransactionEntity> createRecurringTransactions(final List<RecurringTransactionDTO> outflowing, final List<RecurringTransactionDTO> inflowing);
    Optional<RecurringTransactionEntity> findByIdAndCategoryId(Long id, String categoryId);

}
