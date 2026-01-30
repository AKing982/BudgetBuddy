package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.domain.TransactionCategoryStatus;
import com.app.budgetbuddy.entities.TransactionCategoryEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TransactionCategoryService extends ServiceModel<TransactionCategoryEntity>
{
    void saveAll(List<TransactionCategory> transactionCategoryList);

    TransactionCategoryEntity convertToEntity(TransactionCategory transactionCategory);
    TransactionCategory convertFromEntity(TransactionCategoryEntity transactionCategoryEntity);

    Optional<TransactionCategory> getTransactionCategoryByCsvIdAndCatName(String category, Long csvId);
    void updateTransactionCategoriesByIdAndCategory(String category, Long id);

    void updateTransactionCategoryStatus(TransactionCategoryStatus transactionCategoryStatus, Long csvId);

    boolean checkNewTransactionCategoriesByDateRange(Long userId, LocalDate startDate, LocalDate endDate);
    boolean checkUpdatedTransactionCategoriesByDateRange(Long userId, LocalDate startDate, LocalDate endDate);

    void updateTransactionCategoryIsUpdated(Long csvId, boolean isUpdated);

    List<TransactionCategory> getTransactionCategoryListByTransactionIds(List<String> transactionIds);
    List<TransactionCategory> getTransactionCategoriesBetweenStartAndEndDates(LocalDate startDate, LocalDate endDate, Long userId);
}
