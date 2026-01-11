package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.CSVTransactionsByCategory;
import com.app.budgetbuddy.domain.TransactionCSV;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class CSVTransactionsByCategoryQueries
{
    @PersistenceContext
    private EntityManager entityManager;
    private CSVTransactionService csvTransactionService;

    @Autowired
    public CSVTransactionsByCategoryQueries(CSVTransactionService csvTransactionService,
                                            EntityManager entityManager)
    {
        this.csvTransactionService = csvTransactionService;
        this.entityManager = entityManager;
    }

    public List<CSVTransactionsByCategory> getCSVTransactionsByCategoryList(final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        List<TransactionCSV> csvTransactionEntities = csvTransactionService.findTransactionCSVByUserIdAndDateRange(userId, startDate, endDate);
        return createCSVTransactionsByCategoryList(csvTransactionEntities);
    }

    private List<CSVTransactionsByCategory> createCSVTransactionsByCategoryList(final List<TransactionCSV> csvTransactions)
    {
        return csvTransactions.stream()
                .collect(Collectors.groupingBy(tx -> tx.getCategory() != null ? tx.getCategory() : "Uncategorized"))
                .entrySet().stream()
                .map(entry -> {
                    String category = entry.getKey();
                    List<TransactionCSV> transactions = entry.getValue();
                    BigDecimal totalSpending = transactions.stream()
                            .map(TransactionCSV::getTransactionAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new CSVTransactionsByCategory(category, totalSpending, transactions);
                })
                .sorted(Comparator.comparing(CSVTransactionsByCategory::getTotalCategorySpending))
                .collect(Collectors.toList());
    }

}
