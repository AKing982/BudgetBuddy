package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.CSVTransactionsByCategory;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.entities.CSVTransactionEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CSVTransactionService extends ServiceModel<CSVTransactionEntity>
{
    List<CSVTransactionEntity> createCSVTransactionEntities(List<TransactionCSV> transactionCSVList, Long userId);
    void saveAllCSVTransactionEntities(List<CSVTransactionEntity> csvTransactionEntities);

    Optional<TransactionCSV> updateTransactionCSVByCategory(Long transactionId, String category);
    Optional<TransactionCSV> findTransactionCSVById(Long transactionId);

    Optional<TransactionCSV> updateTransactionCSVCategoryAndMerchantName(Long transactionId, String category, String merchantName);
    List<TransactionCSV> findTransactionCSVByUserIdAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);
    List<CSVTransactionEntity> findCSVTransactionEntitiesByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);
}
