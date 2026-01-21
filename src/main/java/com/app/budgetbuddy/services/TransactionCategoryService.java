package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.entities.TransactionCategoryEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TransactionCategoryService extends ServiceModel<TransactionCategoryEntity>
{
    void saveAll(List<TransactionCategory> transactionCategoryList);

    TransactionCategoryEntity convertToEntity(TransactionCategory transactionCategory);

    TransactionCategory getTransactionCategoryByCsvId(Long csvId, Long categoryId);
    TransactionCategory convertFromEntity(TransactionCategoryEntity transactionCategoryEntity);

    Optional<TransactionCategory> getTransactionCategoryById(Long categoryId, Long csvId);
    void updateTransactionCategoriesByIdAndCategory(String category, Long id);
    List<TransactionCategory> getTransactionCategoryListByTransactionIds(List<String> transactionIds);
    List<TransactionCategory> getTransactionCategoriesBetweenStartAndEndDates(LocalDate startDate, LocalDate endDate, Long userId);
}
