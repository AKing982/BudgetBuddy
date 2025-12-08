package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.entities.CSVTransactionEntity;

import java.time.LocalDate;
import java.util.List;

public interface CSVTransactionService extends ServiceModel<CSVTransactionEntity>
{
    List<CSVTransactionEntity> createCSVTransactionEntities(List<TransactionCSV> transactionCSVList, Long userId);
    void saveAllCSVTransactionEntities(List<CSVTransactionEntity> csvTransactionEntities);
    List<CSVTransactionEntity> findCSVTransactionEntitiesByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);
}
