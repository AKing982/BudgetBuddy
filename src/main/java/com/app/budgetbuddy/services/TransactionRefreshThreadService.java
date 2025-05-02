package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.RecurringTransactionResponse;
import com.app.budgetbuddy.entities.RecurringTransactionEntity;
import com.app.budgetbuddy.workbench.budget.BudgetCategoryBuilder;
import com.app.budgetbuddy.workbench.categories.CategoryRuleEngine;
import com.app.budgetbuddy.workbench.categories.TransactionCategoryBuilder;
import com.app.budgetbuddy.workbench.converter.TransactionBaseToModelConverter;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.plaid.client.model.Transaction;
import com.plaid.client.model.TransactionsRecurringGetResponse;
import com.plaid.client.model.TransactionsSyncResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;

@Service
@Async
@Slf4j
public class TransactionRefreshThreadService
{
    private final PlaidTransactionManager plaidTransactionManager;
    private final RecurringTransactionService recurringTransactionService;
    private final TransactionBaseToModelConverter transactionBaseToModelConverter;
    private final CategoryRuleEngine categoryRuleEngine;
    private final TransactionCategoryBuilder transactionCategoryBuilder;
    private final BudgetCategoryBuilder budgetCategoryBuilder;
    private final ThreadPoolTaskScheduler threadPoolTaskScheduler;

    @Autowired
    public TransactionRefreshThreadService(PlaidTransactionManager plaidTransactionManager,
                                           RecurringTransactionService recurringTransactionService,
                                           TransactionBaseToModelConverter transactionBaseToModelConverter,
                                           CategoryRuleEngine categoryRuleEngine,
                                           TransactionCategoryBuilder transactionCategoryBuilder,
                                           BudgetCategoryBuilder budgetCategoryBuilder,
                                           ThreadPoolTaskScheduler threadPoolTaskScheduler)
    {
        this.plaidTransactionManager = plaidTransactionManager;
        this.recurringTransactionService = recurringTransactionService;
        this.transactionBaseToModelConverter = transactionBaseToModelConverter;
        this.categoryRuleEngine = categoryRuleEngine;
        this.transactionCategoryBuilder = transactionCategoryBuilder;
        this.budgetCategoryBuilder = budgetCategoryBuilder;
        this.threadPoolTaskScheduler = threadPoolTaskScheduler;
    }

    private List<com.app.budgetbuddy.domain.Transaction> convertBaseTransactionList(List<Transaction> transactionList)
    {
        return transactionList.stream()
                .map(transactionBaseToModelConverter::convert)
                .collect(Collectors.toList());
    }

    public void startTransactionSyncThread(final Long userId, final List<com.app.budgetbuddy.domain.Transaction> transactions, final String cursor) throws IOException
    {
        if(userId == null || cursor.isEmpty())
        {
            log.warn("User Id is null or cursor is empty");
            return;
        }
        Executor executor = threadPoolTaskScheduler.getScheduledExecutor();
        CompletableFuture.runAsync(() -> syncAndStoreTransactions(userId, cursor), executor)
                .thenRunAsync(() -> categorizeTransactions(userId, transactions, new ArrayList<>()), executor)
                .thenRunAsync(() -> buildBudgetCategories(userId), executor)
                .exceptionally(ex -> {
                    log.error("Transaction Refresh pipeline failed", ex);
                    try {
                        throw ex;
                    } catch (Throwable e) {
                        throw new RuntimeException(e);
                    }
                });
    }

    private void buildBudgetCategories(Long userId)
    {
        try
        {
            log.info("Building budget categories for user {}", userId);
//            budgetCategoryBuilder.buildBudgetCategoriesForUser(userId);
        } catch (Exception ex)
        {
            log.error("Error building budget categories: {}", ex.getMessage());
            throw new RuntimeException(ex);
        }
    }


    private void categorizeTransactions(final Long userId, final List<com.app.budgetbuddy.domain.Transaction> transactionList, final List<RecurringTransaction> recurringTransactions)
    {
        try
        {
            log.info("Categorizing transactions for user {}", userId);
            categoryRuleEngine.processTransactionsForUser(transactionList, recurringTransactions, userId);
        } catch (Exception ex)
        {
            log.error("Error categorizing transactions: {}", ex.getMessage());
            throw new RuntimeException(ex);
        }
    }

    private void syncAndStoreRecurringTransactions(final Long userId) throws IOException
    {
        log.info("Syncing recurring transactions for user {}", userId);
        try
        {
            TransactionsRecurringGetResponse recurringTransactionResponse = plaidTransactionManager.getRecurringTransactionsForUser(userId);
            var inputStreams = recurringTransactionResponse.getInflowStreams();
            var outflowStreams = recurringTransactionResponse.getOutflowStreams();
            recurringTransactionService.createRecurringTransactionEntitiesFromStream(outflowStreams, inputStreams, userId);
            log.info("Synced recurring transactions for user {}", userId);

        }catch(IOException ex){
            log.error("Error syncing recurring transactions: {}", ex.getMessage());
            throw ex;
        }
    }

    private void syncAndStoreTransactions(final Long userId, final String cursor)
    {
        try
        {
            log.info("Syncing transactions for user {}", userId);
            TransactionsSyncResponse response = plaidTransactionManager.syncTransactionsForUser(userId, cursor);
            var transactions = convertBaseTransactionList(response.getAdded());
            plaidTransactionManager.saveTransactions(transactions);
        } catch (Exception ex) {
            log.error("Error syncing/storing transactions: {}", ex.getMessage());
            throw new RuntimeException(ex);
        }
    }

    public void startRecurringTransactionSyncThread(final Long userId, final List<RecurringTransaction> recurringTransactions) throws IOException
    {
        Executor executor = threadPoolTaskScheduler.getScheduledExecutor();
        CompletableFuture.runAsync(() -> {
                    try {
                        syncAndStoreRecurringTransactions(userId);
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
                }, executor)
                .thenRunAsync(() -> categorizeTransactions(userId, new ArrayList<>(), recurringTransactions), executor)
                .thenRunAsync(() -> buildBudgetCategories(userId), executor)
                .exceptionally(ex -> {
                    log.error("Recurring Transaction Refresh pipeline failed", ex);
                    try {
                        throw ex;
                    } catch (Throwable e) {
                        throw new RuntimeException(e);
                    }
                });
    }
}
