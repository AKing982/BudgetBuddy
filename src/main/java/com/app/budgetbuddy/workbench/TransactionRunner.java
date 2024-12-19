package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.BudgetBuddyApplication;
import com.app.budgetbuddy.domain.PlaidTransaction;
import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.RecurringTransactionDTO;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.entities.RecurringTransactionEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.services.PlaidTransactionService;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.services.TransactionService;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.plaid.client.model.TransactionStream;
import com.plaid.client.model.TransactionsGetResponse;
import com.plaid.client.model.TransactionsRecurringGetResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TransactionRunner {
    private final PlaidTransactionManager plaidTransactionManager;
    private final TransactionService transactionService;
    private final RecurringTransactionService recurringTransactionService;

    @Autowired
    public TransactionRunner(PlaidTransactionManager plaidTransactionManager,
                             TransactionService transactionService,
                             RecurringTransactionService recurringTransactionService) {
        this.plaidTransactionManager = plaidTransactionManager;
        this.transactionService = transactionService;
        this.recurringTransactionService = recurringTransactionService;
    }


    public Boolean checkTransactionsExistInDateRange(LocalDate startDate, LocalDate endDate, Long userId){
        if(startDate == null || endDate == null || userId == null){
            return false;
        }
        List<Transaction> transactions = transactionService.getConvertedPlaidTransactions(userId, startDate, endDate);
        return !transactions.isEmpty();
    }

    public Boolean checkRecurringTransactionsExistInDateRange(LocalDate startDate, LocalDate endDate, Long userId){
        if(startDate == null || endDate == null || userId == null){
            return false;
        }
        List<RecurringTransaction> recurringTransactions = recurringTransactionService.getRecurringTransactions(userId, startDate, endDate);
        return !recurringTransactions.isEmpty();
    }

    public Boolean saveRecurringTransactionBatch(final List<RecurringTransaction> recurringTransactions){
        if(recurringTransactions == null || recurringTransactions.isEmpty()){
            return false;
        }
        try
        {
            List<RecurringTransactionEntity> recurringTransactionEntities = recurringTransactionService.createAndSaveRecurringTransactions(recurringTransactions);
            if(recurringTransactionEntities == null || recurringTransactionEntities.isEmpty()){
                return false;
            }
            return true;
        }catch(RuntimeException e){
            log.error("There was a problem saving the recurring transaction batch.", e);
            return false;
        }
    }

    public Boolean saveTransactionBatch(final List<Transaction> plaidTransactions){
        if(plaidTransactions == null){
            return false;
        }
        try
        {
            List<TransactionsEntity> transactionsEntities = transactionService.createAndSaveTransactions(plaidTransactions);
            if(transactionsEntities.isEmpty()){
                return false;
            }
            return true;
        }catch(RuntimeException e){
            log.error("There was a problem saving the transactions batch", e);
            return false;
        }
    }

    public void syncUserTransactions(Long userId, LocalDate startDate, LocalDate endDate)
    {
        if(userId == null || startDate == null || endDate == null) {
            return;
        }
        try {
            Boolean transactionsExistForDateRange = checkTransactionsExistInDateRange(startDate, endDate, userId);
            if (transactionsExistForDateRange) {
                return;
            }

            List<Transaction> transactionsFromPlaid = fetchPlaidTransactionsByUserDate(userId, startDate, endDate);
            if (transactionsFromPlaid.isEmpty()) {
                log.error("Unable to fetch transactions - Plaid link may need to be updated for user: {}", userId);
                // Here you might want to:
                // 1. Mark the user's Plaid link as requiring update
                // 2. Send notification to user
                // 3. Queue for retry after link update

                return;
            }

            saveTransactionBatch(transactionsFromPlaid);

        } catch (Exception e) {
            log.error("Error syncing transactions for user: {}", userId, e);
        }
    }

    public List<RecurringTransaction> fetchRecurringPlaidTransactions(final Long userId, final LocalDate startDate, final LocalDate endDate){
        if(startDate == null || endDate == null || userId == null){
            return Collections.emptyList();
        }
        try
        {
            TransactionsRecurringGetResponse recurringGetResponse = plaidTransactionManager.getRecurringTransactionsForUser(userId);
            List<TransactionStream> outflowingStream = recurringGetResponse.getOutflowStreams();
            List<TransactionStream> inflowingStream = recurringGetResponse.getInflowStreams();
            List<RecurringTransactionEntity> recurringTransactionEntities = recurringTransactionService.createRecurringTransactionEntitiesFromStream(outflowingStream, inflowingStream, userId);
            List<RecurringTransaction> recurringTransactions = recurringTransactionService.convertRecurringTransactionEntities(recurringTransactionEntities);

            // Filter transactions that fall within date range
            return recurringTransactions.stream()
                    .filter(rt -> isTransactionInDateRange(rt, startDate, endDate))
                    .collect(Collectors.toList());

        }catch(IOException e){
            log.error("Error fetching Plaid Recurring Transactions for user {} between {} and {}", userId, startDate, endDate, e);
            return Collections.emptyList();
        }
    }

    private boolean isTransactionInDateRange(RecurringTransaction rt, LocalDate startDate, LocalDate endDate) {
        LocalDate rtStartDate = rt.getFirstDate();
        LocalDate rtEndDate = rt.getLastDate();

        return !rtStartDate.isAfter(endDate) &&
                !rtEndDate.isBefore(startDate);
    }


    public List<Transaction> fetchPlaidTransactionsByUserDate(Long userId, LocalDate startDate, LocalDate endDate){
        if(startDate == null || endDate == null || userId == null){
            return Collections.emptyList();
        }
        try
        {
            TransactionsGetResponse response = plaidTransactionManager.getTransactionsForUser(
                    userId, startDate, endDate);

            if (response == null) {
                log.error("Null response from Plaid for user: {} - link may need update", userId);
                return Collections.emptyList();
            }

            return transactionService.convertPlaidTransactions(response.getTransactions());
        } catch (IOException e) {
            log.error("Error fetching Plaid transactions for user {} between {} and {}: ",
                    userId, startDate, endDate, e);
            return Collections.emptyList();
        }
    }

    public void syncRecurringTransactions(Long userId, LocalDate startDate, LocalDate endDate){
        if(startDate == null || endDate == null || userId == null){
            return;
        }
        Boolean recurringTransactionsExistForDateRange = checkRecurringTransactionsExistInDateRange(startDate, endDate, userId);
        if(recurringTransactionsExistForDateRange)
        {
            return;
        }
        else
        {
            List<RecurringTransaction> recurringTransactions = fetchRecurringPlaidTransactions(userId, startDate, endDate);

        }

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
