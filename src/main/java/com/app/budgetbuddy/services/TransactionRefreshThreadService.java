package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.workbench.budget.BudgetCategoryBuilder;
import com.app.budgetbuddy.workbench.categories.CategoryRuleEngine;
import com.app.budgetbuddy.workbench.categories.TransactionCategoryBuilder;
import com.app.budgetbuddy.workbench.converter.TransactionBaseToModelConverter;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.plaid.client.model.Transaction;
import com.plaid.client.model.TransactionsSyncResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.stream.Collectors;

@Service
@Async
@Slf4j
public class TransactionRefreshThreadService
{
    private final PlaidTransactionManager plaidTransactionManager;
    private final TransactionBaseToModelConverter transactionBaseToModelConverter;
    private final CategoryRuleEngine categoryRuleEngine;
    private final TransactionCategoryBuilder transactionCategoryBuilder;
    private final BudgetCategoryBuilder budgetCategoryBuilder;
    private final ThreadPoolTaskScheduler threadPoolTaskScheduler;

    @Autowired
    public TransactionRefreshThreadService(PlaidTransactionManager plaidTransactionManager,
                                           TransactionBaseToModelConverter transactionBaseToModelConverter,
                                           CategoryRuleEngine categoryRuleEngine,
                                           TransactionCategoryBuilder transactionCategoryBuilder,
                                           BudgetCategoryBuilder budgetCategoryBuilder,
                                           ThreadPoolTaskScheduler threadPoolTaskScheduler)
    {
        this.plaidTransactionManager = plaidTransactionManager;
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

    public void startTransactionSyncThread(final Long userId, final String cursor) throws IOException
    {
        if(userId == null || cursor.isEmpty())
        {
            log.warn("User Id is null or cursor is empty");
            return;
        }
        try
        {
            CompletableFuture.runAsync(() -> {
                List<com.app.budgetbuddy.domain.Transaction> convertedTransactionList = new ArrayList<>();
                // 1. Sync the transactions
                try
                {
                    TransactionsSyncResponse transactionsSyncResponse = plaidTransactionManager.syncTransactionsForUser(userId, cursor);
                    List<Transaction> plaidTransactionList = transactionsSyncResponse.getAdded();
                    // Convert the Plaid Transactions to Transaction Objects
                    convertedTransactionList.addAll(convertBaseTransactionList(plaidTransactionList));
                }catch(Exception e){
                    log.error("Unable to sync transactions for user " + userId + ": " + e.getMessage());
                }
                // 2. Store the Transactions
                plaidTransactionManager.saveTransactions(convertedTransactionList);

                // 3. Categorize the Transactions
                if(categoryRuleEngine.processTransactionsForUser(convertedTransactionList, new ArrayList<>(), userId)) {

                    log.info("Transaction Categorization has been successfully completed.");
                }
            }, threadPoolTaskScheduler.getScheduledExecutor())
                    .thenRunAsync(() -> {
                        // Now safely build Transaction Categories after categorization
                        // Fetch transactions, create transaction categories, save them

                        // 4.1 Fetch the transactions from the database

                        // 4.2 Create the Transaction Categories using the transactions

                        // 4.3 Store the transaction categories

                        log.info("Building transaction categories for user {}", userId);
                    }, threadPoolTaskScheduler.getScheduledExecutor())
                            .thenRunAsync(() -> {
                                // 6. Build/Update the Budget categories for new transactions

                            }, threadPoolTaskScheduler.getScheduledExecutor());

        }catch(CompletionException ex)
        {
            log.error("There was an error running the transaction sync thread: " + ex.getMessage());
            throw ex;
        }
    }

    private void buildTransactionCategories(Long userId)
    {
        try {
            log.info("Building transaction categories for user {}", userId);
//            transactionCategoryBuilder.buildTransactionCategoriesForUser(userId);
        } catch (Exception ex) {
            log.error("Error building transaction categories: {}", ex.getMessage());
            throw new RuntimeException(ex);
        }
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

    public void startRecurringTransactionSyncThread(final Long userId)
    {
        CompletableFuture.runAsync(() -> {
            // 1. Sync the recurring transactions

            // 2. Store the recurring Transactions

            // 3. Categorize the recurring Transactions

            // 4. Build the Transaction Categories

            // 5. Store the Transaction Categories

            // 6. Build/Update the Budget categories for new transactions

        }, threadPoolTaskScheduler.getScheduledExecutor());
    }
}
