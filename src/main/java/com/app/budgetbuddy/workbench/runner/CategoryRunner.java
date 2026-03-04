package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.CategoryException;
import com.app.budgetbuddy.exceptions.CategoryRunnerException;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.categories.CategorizationEngine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class CategoryRunner
{
    private final CategorizationEngine<TransactionCSV> csvCategorizerService;
    private final CategorizationEngine<Transaction> transactionCategorizerService;
    private final CSVTransactionService csvTransactionService;
    private final UserLogService userLogService;
    private final SubBudgetService subBudgetService;
    private final TransactionService transactionService;
    private final TransactionCategoryService transactionCategoryService;

    @Autowired
    public CategoryRunner(@Qualifier("csvCategorizer") CategorizationEngine<TransactionCSV> categorizerService,
                          @Qualifier("transactionCategorizer") CategorizationEngine<Transaction> transactionCategorizerService,
                          CSVTransactionService csvTransactionService,
                          UserLogService userLogService,
                          SubBudgetService subBudgetService,
                          TransactionService transactionService,
                          TransactionCategoryService transactionCategoryService)
    {
        this.csvCategorizerService = categorizerService;
        this.csvTransactionService = csvTransactionService;
        this.userLogService = userLogService;
        this.subBudgetService = subBudgetService;
        this.transactionService = transactionService;
        this.transactionCategoryService = transactionCategoryService;
        this.transactionCategorizerService = transactionCategorizerService;
    }

    public void categorizeSingleCSVTransaction(final CategorySaveData categorySaveData)
    {
        if(categorySaveData == null)
        {
            throw new CategoryRunnerException("Category save data cannot be null");
        }
        try
        {
            String category = categorySaveData.category();
            if(category == null || category.isEmpty())
            {
                throw new CategoryRunnerException("Category cannot be empty");
            }
            Long transactionId = parseTransactionId(categorySaveData.transactionId());
            transactionCategoryService.updateTransactionCategoriesByIdAndCategory(category, transactionId);

        }catch(CategoryRunnerException e){
            log.error("There was an error categorizing the category save data: {}", e.getMessage());
            throw e;
        }
    }

    private Long parseTransactionId(String transactionId)
    {
        try
        {
            String[] transactionIdSplit = transactionId.split("-");
            return Long.parseLong(transactionIdSplit[1]);
        }catch(Exception e)
        {
            log.error("There was an error parsing the transaction id: {}", transactionId);
            return 0L;
        }
    }

    public void categorizeCSVTransactionsByRange(Long userId,
                                                 LocalDate startDate,
                                                 LocalDate endDate)
    {
        try
        {
            List<SubBudget> subBudgets = subBudgetService.getSubBudgetsByUserIdAndDateRange(userId, startDate, endDate);
            if(subBudgets.isEmpty())
            {
                log.info("There are no sub-budgets for user {} at {}", userId, startDate);
                return;
            }
            int pageNum = 500;
            List<TransactionCSV> transactionCSVS = csvTransactionService.findTransactionCSVByUserIdAndDateRange(userId, startDate, endDate, pageNum);
            if(transactionCSVS.isEmpty())
            {
                log.warn("There are no transactions to categorize for user {} between {} and {}", userId, startDate, endDate);
                return;
            }
            List<TransactionCategory> categorizedCSVTransactions = transactionCSVS.stream()
                    .map(transactionCSV -> {
                        Long csvTransactionId = transactionCSV.getId();
                        LocalDate transactionDate = transactionCSV.getTransactionDate();
                        // Categorize the transaction
                        Category category = csvCategorizerService.categorize(transactionCSV);
                        String categoryName = category.getCategoryName();
                        SubBudget matchingSubBudget = subBudgets.stream()
                                .filter(sb -> !transactionDate.isBefore(sb.getStartDate()) &&
                                        !transactionDate.isAfter((sb.getEndDate())))
                                .findFirst()
                                .orElseThrow(() -> new RuntimeException("Sub-budget not found"));
                        Long subBudgetId = matchingSubBudget.getId();
                        return TransactionCategory.builder()
                                .category(categoryName)
                                .subBudgetId(subBudgetId)
                                .csvTransactionId(csvTransactionId)
                                .categorizedDate(category.getCategorizedDate())
                                .createdAt(LocalDateTime.now())
                                .categorizedBy(category.getCategorizedBy())
                                .build();
                    })
                    .collect(Collectors.toList());
            log.info("Categorized {} transactions", categorizedCSVTransactions.size());
            transactionCategoryService.saveAll(categorizedCSVTransactions);
        }catch(Exception e){
            log.error("There was an error fetching the transaction categories: {}", e.getMessage());
            throw e;
        }
    }

    @Transactional
    public List<TransactionCSV> reCategorizeCsvTransactionsByRange(Long userId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            List<TransactionCategory> uncategorized = transactionCategoryService
                    .getUncategorizedTransactionsByUserIdAndDateRange(userId, startDate, endDate);

            if(uncategorized.isEmpty())
            {
                log.info("No uncategorized transactions found for user {} between {} and {}", userId, startDate, endDate);
                return List.of();
            }

            // We need the underlying CSVTransactions to pass to the categorizer
            List<Long> csvIds = uncategorized.stream()
                    .map(TransactionCategory::getCsvTransactionId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            List<TransactionCSV> csvTransactions = csvTransactionService
                    .findTransactionCSVByIds(csvIds);

            List<TransactionCSV> updated = new ArrayList<>();
            for(TransactionCSV transactionCSV : csvTransactions)
            {
                try
                {
                    Category category = csvCategorizerService.categorize(transactionCSV);
                    String categoryName = category.getCategoryName();

                    if(!"Uncategorized".equals(categoryName))
                    {
                        transactionCategoryService.updateTransactionCategoriesByIdAndCategory(
                                categoryName, transactionCSV.getId());
                        transactionCSV.setCategory(categoryName);
                        updated.add(transactionCSV);
                    }
                }
                catch(Exception e)
                {
                    log.warn("Could not categorize csv transaction id {}: {}",
                            transactionCSV.getId(), e.getMessage());
                }
            }

            log.info("Re-categorized {}/{} transactions for user {}",
                    updated.size(), csvTransactions.size(), userId);
            return updated;
        }
        catch (Exception e)
        {
            log.error("Error re-categorizing CSV transactions for user {}: {}", userId, e.getMessage());
            throw new CategoryRunnerException("Failed to re-categorize transactions: " + e.getMessage());
        }
    }


    public void categorizeTransactionsByRange(Long userId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            List<Transaction> transactions = transactionService.getConvertedPlaidTransactions(userId, startDate, endDate);
            if(transactions.isEmpty())
            {
                log.info("There are no transactions to convert...");
                return;
            }
            List<TransactionCategory> transactionCategories = transactions.stream()
                    .map(transaction -> {
                        String transactionId = transaction.getTransactionId();
                        Category category = transactionCategorizerService.categorize(transaction);
                        String matched_category = category.getCategoryName();
                        return TransactionCategory.builder()
                                .categorizedBy(category.getCategorizedBy())
                                .categorizedDate(category.getCategorizedDate())
                                .category(matched_category)
                                .createdAt(LocalDateTime.now())
                                .transactionId(transactionId)
                                .build();
                    })
                    .toList();
            transactionCategoryService.saveAll(transactionCategories);
        }catch(CategoryException e){
            log.error("There was an error categorizing transactions: {}", e.getMessage());
            throw e;
        }
    }
}
