package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.BudgetBuddyApplication;
import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionType;
import com.app.budgetbuddy.entities.RecurringTransactionEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.DataConversionException;
import com.app.budgetbuddy.exceptions.PlaidApiException;
import com.app.budgetbuddy.exceptions.TransactionRunnerException;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.services.TransactionRefreshService;
import com.app.budgetbuddy.services.TransactionService;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.plaid.client.model.TransactionStream;
import com.plaid.client.model.TransactionsGetResponse;
import com.plaid.client.model.TransactionsRecurringGetResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;


/**
 * The TransactionRunner orchestrates different transaction operations through the application
 * The operations include syncing recurring transactions/transactions, and fetching plaid transactions
 * for recurring and normal transactions.
 * @author aking94
 */
@Service
@Slf4j
public class TransactionRunner
{
    private final PlaidTransactionManager plaidTransactionManager;

    @Autowired
    public TransactionRunner(PlaidTransactionManager plaidTransactionManager)
    {
        this.plaidTransactionManager = plaidTransactionManager;
    }

    public List<Transaction> getNewPlaidTransactionsByUserId(final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        return null;
    }

    public List<RecurringTransaction> getNewRecurringTransactionsByUserId(Long userId, LocalDate startDate, LocalDate endDate)
    {
        return null;
    }

    public static void main(String[] args) {
        try {
            // Get Spring Application Context
            ApplicationContext context = SpringApplication.run(BudgetBuddyApplication.class, args);

            // Get beans from Spring context
            TransactionRunner runner = context.getBean(TransactionRunner.class);

            // Test parameters
            Long userId = 1L;
            LocalDate startDate = LocalDate.of(2024, 1, 1);
            LocalDate endDate = LocalDate.of(2024, 1, 31);

            // Test transaction sync flow
            log.info("Testing transaction sync for user {} from {} to {}",
                    userId, startDate, endDate);
            runner.syncUserTransactions(userId, startDate, endDate);

            // Test recurring transaction sync
            log.info("Testing recurring transaction sync");
            runner.syncRecurringTransactions(userId, startDate, endDate);

        } catch (Exception e) {
            log.error("Error in main: ", e);
        }
    }


}
