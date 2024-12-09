package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.entities.TransactionCategoryEntity;


import java.time.LocalDate;
import java.util.List;

public interface TransactionCategoryService extends ServiceModel<TransactionCategoryEntity>
{
    List<TransactionCategoryEntity> getAllTransactionCategoriesByUser(Long userId);

    List<TransactionCategoryEntity> getActiveTransactionCategoriesByUser(Long userId);

    List<TransactionCategoryEntity> getTransactionCategoriesByBudgetId(Long budgetId);
    List<TransactionCategoryEntity> getTransactionCategoriesByBudgetIdAndDateRange(Long budgetId, LocalDate startDate, LocalDate endDate);
    List<TransactionCategoryEntity> getTransactionCategoriesByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);

    List<TransactionCategory> getTransactionCategoryListByBudgetIdAndDateRange(Long budgetId, LocalDate startDate, LocalDate endDate);

    Integer getTotalBudgetAmountSumByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);
}
