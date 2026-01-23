package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.CSVTransactionsByCategory;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.entities.CSVTransactionEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CSVTransactionService extends ServiceModel<CSVTransactionEntity>
{

    boolean existsByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);
    List<CSVTransactionEntity> createCSVTransactionEntities(List<TransactionCSV> transactionCSVList, Long userId);
    void saveAllCSVTransactionEntities(List<CSVTransactionEntity> csvTransactionEntities);

    Optional<TransactionCSV> findTransactionCSVById(Long transactionId);

    List<TransactionCSV> findTransactionCSVByUserIdAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);
    List<CSVTransactionEntity> findCSVTransactionEntitiesByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);
}
