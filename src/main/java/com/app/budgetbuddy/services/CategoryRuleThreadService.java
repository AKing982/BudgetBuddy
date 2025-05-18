package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.workbench.categories.CategoryRuleEngine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;

@Async
@Service
@Slf4j
public class CategoryRuleThreadService
{
    private CategoryRuleEngine categoryRuleEngine;
    private TransactionCategoryService transactionCategoryService;
    private ThreadPoolTaskScheduler threadPoolTaskScheduler;

    @Autowired
    public CategoryRuleThreadService(@Qualifier("taskScheduler1") ThreadPoolTaskScheduler threadPoolTaskSc,
                                     TransactionCategoryService transactionCategoryService,
                                     CategoryRuleEngine categoryRuleEngine)
    {
        this.categoryRuleEngine = categoryRuleEngine;
        this.threadPoolTaskScheduler = threadPoolTaskSc;
        this.transactionCategoryService = transactionCategoryService;
    }

    //TODO: Figure out best way to get recent transactions and recurring transactions to categorize
    public CompletableFuture<List<TransactionCategory>> categorizeTransactions(final List<Transaction> transactions)
    {
        return CompletableFuture.supplyAsync(() -> {
            try
            {
                List<TransactionCategory> transactionCategories = categoryRuleEngine.categorizeTransactions(transactions);
                if(transactionCategories.isEmpty())
                {
                    return Collections.emptyList();
                }
                saveTransactionCategories(transactionCategories);
                return transactionCategories;
            }catch(CompletionException e){
                log.error("There was an error while categorizing transactions", e);
                return Collections.emptyList();
            }
        }, threadPoolTaskScheduler.getScheduledExecutor());
    }

    public CompletableFuture<List<TransactionCategory>> categorizeRecurringTransactions(final List<RecurringTransaction> recurringTransactions)
    {
        return CompletableFuture.supplyAsync(() -> {
            try
            {
                return categoryRuleEngine.categorizeRecurringTransactions(recurringTransactions);
            }catch(CompletionException e){
                log.error("There was an error while categorizing recurring transactions", e);
                return Collections.emptyList();
            }
        }, threadPoolTaskScheduler.getScheduledExecutor());
    }

    public CompletableFuture<Boolean> saveTransactionCategories(final List<TransactionCategory> transactionCategories)
    {
        return CompletableFuture.supplyAsync(() -> {
            try
            {
                transactionCategoryService.saveAll(transactionCategories);
                return true;
            }catch(CompletionException e){
                log.error("There was an error while saving transaction categories", e);
                return false;
            }
        }, threadPoolTaskScheduler.getScheduledExecutor());
    }
}
