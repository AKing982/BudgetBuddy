package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.CategoryException;
import com.app.budgetbuddy.exceptions.CategoryRunnerException;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.categories.TransactionCategoryBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
@Slf4j
public class CategoryRunner
{
    private final CSVTransactionService csvTransactionService;
    private final UserLogService userLogService;
    private final SubBudgetService subBudgetService;
    private final TransactionService transactionService;
    private final TransactionCategoryService transactionCategoryService;
    private final TransactionCategoryBuilder transactionCategoryBuilder;

    @Autowired
    public CategoryRunner(CSVTransactionService csvTransactionService,
                          UserLogService userLogService,
                          SubBudgetService subBudgetService,
                          TransactionService transactionService,
                          TransactionCategoryBuilder transactionCategoryBuilder,
                          TransactionCategoryService transactionCategoryService)
    {
        this.csvTransactionService = csvTransactionService;
        this.userLogService = userLogService;
        this.subBudgetService = subBudgetService;
        this.transactionService = transactionService;
        this.transactionCategoryBuilder = transactionCategoryBuilder;
        this.transactionCategoryService = transactionCategoryService;
    }

    public void categorizeSingleTransaction(final CategorySaveData categorySaveData)
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
            String transactionId = categorySaveData.transactionId();
            transactionCategoryService.updateTransactionCategoriesByIdAndCategory(category, transactionId);
        }catch(CategoryRunnerException e){
            log.error("There was an error categorizing the category save data: {}", e.getMessage());
            throw e;
        }
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
            transactionCategoryService.updateTransactionCategoriesByCsvIdAndCategory(category, transactionId);

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

    public List<TransactionCategory> testCategorizeTransactionsByDateRange(Long userId, List<Transaction> transactions, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            List<SubBudget> subBudgets = subBudgetService.getSubBudgetsByUserIdAndDateRange(userId, startDate, endDate);
            if(subBudgets.isEmpty())
            {
                log.info("There are no sub-budgets for user {} at {}", userId, startDate);
                return Collections.emptyList();
            }
            List<TransactionCategory> transactionCategories = transactionCategoryBuilder.build(transactions, subBudgets);
            log.info("Transaction Categories: {}", transactionCategories);
            log.info("Categorized {} transactions", transactionCategories.size());
            return transactionCategories;

        }catch(Exception e){
            log.error("There was an error categorizing transactions: {}", e.getMessage());
            throw e;
        }
    }

    public void categorizeTransactionsByDateRange(Long userId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            List<SubBudget> subBudgets = subBudgetService.getSubBudgetsByUserIdAndDateRange(userId, startDate, endDate);
            if(subBudgets.isEmpty())
            {
                log.info("There are no sub-budgets for user {} at {}", userId, startDate);
                return;
            }
            List<Transaction> transactions = transactionService.getConvertedPlaidTransactions(userId, startDate, endDate);
            log.info("Transactions: {}", transactions);
            if(transactions.isEmpty())
            {
                log.info("There are no transactions to convert...");
                return;
            }
            List<TransactionCategory> transactionCategories = transactionCategoryBuilder.build(transactions, subBudgets);
            log.info("Transaction Categories: {}", transactionCategories);
            log.info("Categorized {} transactions", transactionCategories.size());
            transactionCategoryService.saveAll(transactionCategories);
        }catch(Exception e){
            log.error("There was an error categorizing transactions: {}", e.getMessage());
            throw e;
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
            List<TransactionCategory> categorizedCSVTransactions = transactionCategoryBuilder.build(transactionCSVS, subBudgets);
            log.info("Transaction Categories: {}", categorizedCSVTransactions);
            log.info("Categorized {} transactions", categorizedCSVTransactions.size());
            transactionCategoryService.saveAll(categorizedCSVTransactions);
        }catch(Exception e){
            log.error("There was an error fetching the transaction categories: {}", e.getMessage());
            throw e;
        }
    }

    public void reCategorizeTransactionsByRange(Long userId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            List<TransactionCategory> uncategorized = transactionCategoryService.getUncategorizedTransactionsByUserIdAndDateRange(userId, startDate, endDate);
            List<SubBudget> subBudgets = subBudgetService.getSubBudgetsByUserIdAndDateRange(userId, startDate, endDate);
            if(subBudgets.isEmpty())
            {
                log.info("There are no sub-budgets for user {} at {}", userId, startDate);
                return;
            }
            List<String> transactionIds = uncategorized.stream()
                    .map(TransactionCategory::getTransactionId)
                    .toList();
            log.info("Uncategorized Transactions: {}", transactionIds);
            List<Transaction> transactions = transactionService.getConvertedPlaidTransactions(userId, startDate, endDate);
            log.info("Transactions: {}", transactions);
            List<TransactionCategory> categorizedTransactions = transactionCategoryBuilder.reCategorize(uncategorized, transactions, subBudgets);
            log.info("Transaction Categories: {}", categorizedTransactions);
            transactionCategoryService.updateAll(categorizedTransactions);
        } catch(Exception e){
            log.error("There was an error fetching the uncategorized transactions: {}", e.getMessage());
            throw e;
        }
    }

    public void reCategorizeCsvTransactionsByRange(Long userId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            List<TransactionCategory> uncategorized = transactionCategoryService.getUncategorizedTransactionsByUserIdAndDateRange(userId, startDate, endDate);
            List<SubBudget> subBudgets = subBudgetService.getSubBudgetsByUserIdAndDateRange(userId, startDate, endDate);
            if(subBudgets.isEmpty())
            {
                log.info("There are no sub-budgets for user {} at {}", userId, startDate);
                return;
            }
            List<Long> csvTransactionIds = uncategorized.stream()
                    .map(TransactionCategory::getCsvTransactionId)
                    .toList();
            log.info("Uncategorized CSV Transactions: {}", csvTransactionIds);
            List<TransactionCSV> transactionCSVS = csvTransactionService.findTransactionCSVByIds(csvTransactionIds);
            log.info("CSV Transactions: {}", transactionCSVS);
            List<TransactionCategory> categorizedCSVTransactions = transactionCategoryBuilder.reCategorize(uncategorized, transactionCSVS, subBudgets);
            log.info("Transaction Categories: {}", categorizedCSVTransactions);
            transactionCategoryService.updateAll(categorizedCSVTransactions);
        }
        catch(CategoryException e)
        {
            log.error("Error re-categorizing CSV transactions for user {}: {}", userId, e.getMessage());
            throw new CategoryRunnerException("Failed to re-categorize transactions: " + e.getMessage());
        }
    }

}
