package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.services.TransactionService;
import com.app.budgetbuddy.workbench.runner.PlaidTransactionRunner;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TransactionImportAsyncService
{
    private PlaidTransactionRunner plaidTransactionRunner;
    private TransactionService transactionService;
    private RecurringTransactionService recurringTransactionService;

    @Autowired
    public TransactionImportAsyncService(PlaidTransactionRunner plaidTransactionRunner,
                                         TransactionService transactionService,
                                         RecurringTransactionService recurringTransactionService) {
        this.plaidTransactionRunner = plaidTransactionRunner;
        this.transactionService = transactionService;
        this.recurringTransactionService = recurringTransactionService;
    }

    @Async("monthlyExecutor")
    public CompletableFuture<List<RecurringTransaction>> importMonthlyRecurringTransactionsAsync(final SubBudget subBudget)
    {
        try {
            Long userId = subBudget.getBudget().getUserId();

            List<RecurringTransaction> recurringTransactions = plaidTransactionRunner.getRecurringTransactionsResponse(userId);

            return CompletableFuture.completedFuture(recurringTransactions);
        } catch (Exception e) {
            log.error("Error importing recurring transactions for subBudget: {}", subBudget.getId(), e);
            return CompletableFuture.failedFuture(e);
        }
    }

    @Async("monthlyExecutor")
    public CompletableFuture<List<Transaction>> importMonthlyTransactionsAsync(final SubBudget subBudget)
    {
        try
        {
            Long userId = subBudget.getBudget().getUserId();
            LocalDate startDate = subBudget.getStartDate();
            LocalDate endDate = subBudget.getEndDate();

            // Use PlaidTransactionRunner - it handles the complexity
            List<Transaction> transactions = plaidTransactionRunner.getTransactionsResponse(userId, startDate, endDate);

            return CompletableFuture.completedFuture(transactions);
        } catch (Exception e) {
            log.error("Error importing monthly transactions for subBudget: {}", subBudget.getId(), e);
            return CompletableFuture.failedFuture(e);
        }
    }

    @Async("taskExecutor")
    public CompletableFuture<Void> combineAndSaveTransactionsAsync(final List<Transaction> weeklyTransactions, final List<Transaction> monthlyTransactions)
    {
        try
        {
            log.info("Combining {} weekly and {} monthly transactions",
                    weeklyTransactions.size(), monthlyTransactions.size());

            // Combine all transactions
            List<Transaction> allTransactions = new ArrayList<>();
            allTransactions.addAll(weeklyTransactions);
            allTransactions.addAll(monthlyTransactions);

            // Remove duplicates if necessary (based on transaction ID)
            List<Transaction> uniqueTransactions = allTransactions.stream()
                    .collect(Collectors.toMap(
                            Transaction::getTransactionId, // assuming you have this method
                            Function.identity(),
                            (existing, replacement) -> existing)) // keep first occurrence
                    .values()
                    .stream()
                    .toList();

            // Save to database using PlaidTransactionRunner
            plaidTransactionRunner.saveTransactions(uniqueTransactions);

            log.info("Successfully saved {} unique transactions", uniqueTransactions.size());
            return CompletableFuture.completedFuture(null);

        } catch (Exception e) {
            log.error("Error combining and saving transactions", e);
            return CompletableFuture.failedFuture(e);
        }
    }
}
