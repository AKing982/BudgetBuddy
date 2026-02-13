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
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
@Deprecated
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
    public CompletableFuture<Void> saveRecurringTransactions(List<RecurringTransaction> recurringTransactions)
    {
        if(recurringTransactions.isEmpty())
        {
            return CompletableFuture.completedFuture(null);
        }
        try
        {
            recurringTransactionService.createAndSaveRecurringTransactions(recurringTransactions);
            return CompletableFuture.completedFuture(null);
        }catch(Exception e){
            log.error("Error saving recurring transactions", e);
            return CompletableFuture.failedFuture(e);
        }
    }

    @Async("taskExecutor")
    public CompletableFuture<Void> saveTransactions(List<Transaction> transactions)
    {
        if(transactions.isEmpty())
        {
            return CompletableFuture.completedFuture(null);
        }
        try
        {
            transactionService.createAndSaveTransactions(transactions);
            return CompletableFuture.completedFuture(null);
        }catch(Exception e){
            log.error("Error saving transactions", e);
            return CompletableFuture.failedFuture(e);
        }
    }
}
