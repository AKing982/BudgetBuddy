package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.workbench.RecurringTransactionLoaderImpl;
import com.app.budgetbuddy.workbench.TransactionDataLoaderImpl;
import com.app.budgetbuddy.workbench.categories.CategoryRuleEngine;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping(value="/api/categorize-test")
@CrossOrigin(value="http://localhost:3000")
public class CategorizationController
{
    private CategoryRuleEngine categoryRuleEngine;
    private TransactionDataLoaderImpl transactionDataLoader;
    private RecurringTransactionLoaderImpl recurringTransactionLoader;

    @Autowired
    public CategorizationController(CategoryRuleEngine categoryRuleEngine,
                                    TransactionDataLoaderImpl transactionDataLoader,
                                    RecurringTransactionLoaderImpl recurringTransactionLoader) {
        this.categoryRuleEngine = categoryRuleEngine;
        this.transactionDataLoader = transactionDataLoader;
        this.recurringTransactionLoader = recurringTransactionLoader;
    }

    @GetMapping("/categorize")
    public ResponseEntity<CategorizationResponse> categorizeTransactions(
            @RequestParam(defaultValue = "1") Long userId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {

        try
        {
            // Load transactions
            List<Transaction> transactions = transactionDataLoader.loadTransactionsByDateRange(userId, startDate, endDate);
            List<RecurringTransaction> recurringTransactions =
                    recurringTransactionLoader.loadTransactionsByDateRange(userId, startDate, endDate);

            // Categorize transactions
            List<TransactionCategory> categorizedTransactions =
                    categoryRuleEngine.categorizeTransactions(transactions);
            List<TransactionCategory> categorizedRecurringTransactions =
                    categoryRuleEngine.categorizeRecurringTransactions(recurringTransactions);

            // Build response
            CategorizationResponse response = CategorizationResponse.builder()
                    .regularTransactions(categorizedTransactions)
                    .recurringTransactions(categorizedRecurringTransactions)
                    .regularTransactionStats(categoryRuleEngine.getRegularTransactionCategoryStats())
                    .recurringTransactionStats(categoryRuleEngine.getRecurringTransactionCategoryStats())
                    .userRuleCount(categoryRuleEngine.getUserRuleCount())
                    .systemRuleCount(categoryRuleEngine.getSystemRuleCount())
                    .totalTransactionsProcessed(transactions.size() + recurringTransactions.size())
                    .dateRange(new DateRange(startDate, endDate))
                    .userId(userId)
                    .processedAt(LocalDateTime.now())
                    .build();

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(CategorizationResponse.builder()
                            .error("Error processing categorization: " + e.getMessage())
                            .processedAt(LocalDateTime.now())
                            .build());
        }
    }




}
