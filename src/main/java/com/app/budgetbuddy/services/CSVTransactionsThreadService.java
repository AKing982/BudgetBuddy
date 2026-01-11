package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.CSVTransactionsByCategory;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.domain.TransactionsByCategory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class CSVTransactionsThreadService
{
    private final CSVTransactionsByCategoryQueries csvTransactionsByCategoryQueries;

    @Autowired
    public CSVTransactionsThreadService(CSVTransactionsByCategoryQueries csvTransactionsByCategoryQueries)
    {
        this.csvTransactionsByCategoryQueries = csvTransactionsByCategoryQueries;
    }

    /**
     * Asynchronously fetches CSV transactions grouped by category for a given date range
     *
     * @param userId the user ID
     * @param startDate the start date of the range
     * @param endDate the end date of the range
     * @return CompletableFuture containing list of transactions grouped by category
     */
    @Async("taskExecutor")
    public CompletableFuture<List<CSVTransactionsByCategory>> fetchCSVTransactionsByCategoryListByDateRange(Long userId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            log.debug("Fetching CSV transactions by category for userId={}", userId);

            List<CSVTransactionsByCategory> result =
                    csvTransactionsByCategoryQueries.getCSVTransactionsByCategoryList(userId, startDate, endDate);

            log.debug("Successfully fetched {} categories for userId={}", result.size(), userId);
            return CompletableFuture.completedFuture(result);

        } catch (Exception e) {
            log.error("Error fetching CSV transactions by category for userId={}: {}", userId, e.getMessage(), e);
            return CompletableFuture.failedFuture(e); // Or return empty list
        }
    }
}
