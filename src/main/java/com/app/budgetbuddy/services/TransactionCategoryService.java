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

    List<LocalDate> getIncomePostedDates(Long userId, Long subBudgetId);
    Optional<TransactionCategory> getTransactionCategoryByCsvIdAndCatName(String category, Long csvId);
    void updateTransactionCategoriesByCsvIdAndCategory(String category, Long id);
    void updateTransactionCategoriesByIdAndCategory(String category, String id);

    void updateAll(List<TransactionCategory> transactionCategoryList);
    void updateCSVTransactionCategoryStatus(TransactionCategoryStatus transactionCategoryStatus, Long csvId);
    void updateTransactionCategoryStatus(String id, TransactionCategoryStatus transactionCategoryStatus);

    List<TransactionCategory> getUncategorizedTransactionsByUserIdAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);
    List<TransactionCategory> getUncategorizedCsvTransactionsByUserIdAndDateRange(
            Long userId, LocalDate startDate, LocalDate endDate);

    boolean checkNewCSVTransactionCategoriesByDateRange(Long userId, LocalDate startDate, LocalDate endDate);
    boolean checkNewTransactionCategoriesByDateRange(Long userId, LocalDate startDate, LocalDate endDate);

    boolean checkUpdatedCSVTransactionCategoriesByDateRange(Long userId, LocalDate startDate, LocalDate endDate);
    boolean checkUpdatedTransactionCategoriesByDateRange(Long userId, LocalDate startDate, LocalDate endDate);

    void updateCSVTransactionCategoryIsUpdated(Long csvId, boolean isUpdated);
    void updateTransactionCategoryIsUpdated(String id, boolean isUpdated);


    List<TransactionCategory> getTransactionCategoryListByTransactionIds(List<String> transactionIds);
    List<TransactionCategory> getTransactionCategoriesBetweenStartAndEndDates(LocalDate startDate, LocalDate endDate, Long userId);
}
