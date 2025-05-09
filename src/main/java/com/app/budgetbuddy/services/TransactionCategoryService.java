package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.entities.TransactionCategoryEntity;

import java.time.LocalDate;
import java.util.List;

public interface TransactionCategoryService extends ServiceModel<TransactionCategoryEntity>
{
    void saveAll(List<TransactionCategory> transactionCategoryList);

    TransactionCategoryEntity convertToEntity(TransactionCategory transactionCategory);

    TransactionCategory convertFromEntity(TransactionCategoryEntity transactionCategoryEntity);

    List<TransactionCategory> getTransactionCategoriesBetweenStartAndEndDates(LocalDate startDate, LocalDate endDate, Long userId);
}
