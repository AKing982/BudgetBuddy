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

@Service
@Slf4j
public class TransactionRunner
{
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
        // Get transactions from Plaid
        List<Transaction> plaidTransactions = transactionService.getConvertedPlaidTransactions(userId, startDate, endDate);

        // Return true if we now have transactions for this period
        return !plaidTransactions.isEmpty();
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
            return !recurringTransactionEntities.isEmpty();

        }catch(RuntimeException e){
            log.error("There was a problem saving the recurring transaction batch.", e);
            return false;
        }
    }

    private List<TransactionsEntity> getConvertedTransactionEntityList(final List<Transaction> transactions)
    {
        if(transactions == null || transactions.isEmpty()){
            return Collections.emptyList();
        }
        try
        {
            return transactionService.createAndSaveTransactions(transactions);

        }catch(DataAccessException e){
            log.error("There was an error creating and saving the transactions: ", e);
            return Collections.emptyList();
        }
    }

    public Boolean saveTransactionBatch(final List<Transaction> plaidTransactions)
    {
        if(plaidTransactions == null || plaidTransactions.isEmpty())
        {
            return false;
        }
        try
        {
            return !getConvertedTransactionEntityList(plaidTransactions).isEmpty();
        }catch(RuntimeException ex)
        {
            log.error("There was an error creating and saving the transactions: ", ex);
            return false;
        }
    }

    private List<String> filterPlaidTransactionIds(final List<? extends Transaction> transactions){
        return transactions.stream()
                .map(Transaction::getTransactionId)
                .collect(Collectors.toList());
    }

    private List<String> getExistingTransactionIds(final List<String> plaidTransactionIds, final String type)
    {
        if(plaidTransactionIds == null){
            return Collections.emptyList();
        }
        return switch (type) {
            case "TRANSACTION" -> transactionService.findTransactionIdsByIds(plaidTransactionIds);
            case "RECURRING_TRANSACTION" ->
                    recurringTransactionService.findRecurringTransactionIds(plaidTransactionIds);
            default -> throw new IllegalArgumentException("Unsupported transaction type: " + type);
        };
    }


    public boolean syncUserTransactions(final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        if(userId == null || startDate == null || endDate == null)
        {
            return false;
        }
        try
        {
            List<Transaction> transactionsFromPlaid = fetchPlaidTransactionsByUserDate(userId, startDate, endDate);
            if(transactionsFromPlaid == null || transactionsFromPlaid.isEmpty())
            {
                log.error("Unable to fetch Transactions - Plaid link may need to be updated for user: {}", userId);
                return false;
            }

            // Get transaction IDs from Plaid transactions
            List<String> plaidTransactionIds = filterPlaidTransactionIds(transactionsFromPlaid);

            // Check which transactions already exist in database
            List<String> existingTransactionIds = getExistingTransactionIds(plaidTransactionIds, "TRANSACTION");

            // Filter out transactions that don't exist in database
            List<Transaction> transactionsToSave = transactionsFromPlaid.stream()
                    .filter(transaction -> !existingTransactionIds.contains(transaction.getTransactionId()))
                    .collect(Collectors.toList());

            if(transactionsToSave.isEmpty())
            {
                log.info("No New Transactions to save for user: {}", userId);
                return false;
            }
            return saveTransactionBatch(transactionsToSave);
        }catch(TransactionRunnerException ex)
        {
            log.error("There was an error saving the transactions: ", ex);
            return false;
        }
    }

    private List<TransactionStream> getTransactionOutflowStream(TransactionsRecurringGetResponse recurringGetResponse)
    {
        return recurringGetResponse.getOutflowStreams();
    }

    private List<TransactionStream> getTransactionInflowStream(TransactionsRecurringGetResponse recurringGetResponse)
    {
        return recurringGetResponse.getInflowStreams();
    }

    private List<RecurringTransaction> getConvertedRecurringTransactions(final TransactionsRecurringGetResponse recurringGetResponse, final Long userId)
    {
        List<TransactionStream> outflowingStream = getTransactionOutflowStream(recurringGetResponse);
        if(outflowingStream == null || outflowingStream.isEmpty())
        {
            return Collections.emptyList();
        }
        List<TransactionStream> inflowingStream = getTransactionInflowStream(recurringGetResponse);
        if(inflowingStream == null || inflowingStream.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            List<RecurringTransactionEntity> recurringTransactionEntities = recurringTransactionService.createRecurringTransactionEntitiesFromStream(outflowingStream, inflowingStream, userId);
            return recurringTransactionService.convertRecurringTransactionEntities(recurringTransactionEntities);
        }catch(DataConversionException e)
        {
            log.error("There was an error retrieving the converted transactions for user {}: ", userId, e);
            return Collections.emptyList();
        }
    }

    private List<RecurringTransaction> filterRecurringTransactionsByDateRange(LocalDate startDate, LocalDate endDate, List<RecurringTransaction> recurringTransactions){
        return recurringTransactions.stream()
                .filter(rt -> isTransactionInDateRange(rt, startDate, endDate))
                .collect(Collectors.toList());
    }

    public List<RecurringTransaction> fetchRecurringPlaidTransactions(final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        if(startDate == null || endDate == null || userId == null)
        {
            return Collections.emptyList();
        }
        try
        {
            TransactionsRecurringGetResponse recurringGetResponse = plaidTransactionManager.getRecurringTransactionsForUser(userId);
            List<RecurringTransaction> recurringTransactions = getConvertedRecurringTransactions(recurringGetResponse, userId);

            // Filter transactions that fall within date range
            return filterRecurringTransactionsByDateRange(startDate, endDate, recurringTransactions);

        }catch(IOException e)
        {
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

    public List<Transaction> fetchPlaidTransactionsByUserDate(Long userId, LocalDate startDate, LocalDate endDate)
    {
        if(startDate == null || endDate == null || userId == null)
        {
            return Collections.emptyList();
        }
        try
        {
            TransactionsGetResponse response = plaidTransactionManager.getTransactionsForUser(userId, startDate, endDate);
            if(response == null)
            {
                log.error("Null response from Plaid for user: {} - link may need update", userId);
                return Collections.emptyList();
            }
            return transactionService.convertPlaidTransactions(response.getTransactions());
        } catch (IOException e)
        {
            log.error("Error fetching Plaid transactions for user {} between {} and {}: ",
                    userId, startDate, endDate, e);
            return Collections.emptyList();
        }
    }

    public boolean syncRecurringTransactions(final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        if(userId == null || startDate == null || endDate == null)
        {
            return false;
        }
        try
        {
            List<RecurringTransaction> recurringTransactionsFromPlaid = fetchRecurringPlaidTransactions(userId, startDate, endDate);
            if(recurringTransactionsFromPlaid == null || recurringTransactionsFromPlaid.isEmpty())
            {
                log.warn("Unable to fetch Plaid Recurring Transactions - Plaid link may need update");
                return false;
            }
            List<String> recurringTransactionIds = filterPlaidTransactionIds(recurringTransactionsFromPlaid);
            recurringTransactionIds.forEach((transactionId) -> {
                log.info("Recurring TransactionId: " + transactionId);
            });
            List<String> existingRecurringTransactionIds = getExistingTransactionIds(recurringTransactionIds, "RECURRING_TRANSACTION");
            // Filter out transactions that don't exist in database
            List<RecurringTransaction> transactionsToSave = recurringTransactionsFromPlaid.stream()
                    .filter(transaction -> !existingRecurringTransactionIds.contains(transaction.getTransactionId()))
                    .collect(Collectors.toList());

            if(transactionsToSave.isEmpty())
            {
                log.info("No New Transactions to save for user: {}", userId);
                return false;
            }
            return saveRecurringTransactionBatch(transactionsToSave);

        }catch(RuntimeException ex){
            log.error("There was an error syncing the recurring transactions: ", ex);
            return false;
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
