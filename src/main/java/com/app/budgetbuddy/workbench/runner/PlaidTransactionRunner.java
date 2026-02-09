package com.app.budgetbuddy.workbench.runner;

import java.io.IOException;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.exceptions.InvalidAccessTokenException;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.services.TransactionService;
import com.plaid.client.model.TransactionsSyncResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.method.P;
import org.springframework.stereotype.Service;

import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.RecurringTransactionResponse.TransactionStream;
import com.app.budgetbuddy.entities.RecurringTransactionEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.exceptions.TransactionRunnerException;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.app.budgetbuddy.workbench.RecurringTransactionUtil;
import com.app.budgetbuddy.workbench.converter.PlaidTransactionToTransactionConverter;
import com.app.budgetbuddy.workbench.converter.TransactionConverter;
import com.app.budgetbuddy.workbench.converter.TransactionToEntityConverter;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.plaid.client.model.TransactionsGetResponse;
import com.plaid.client.model.TransactionsRecurringGetResponse;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class PlaidTransactionRunner
{
    private final PlaidTransactionManager plaidTransactionManager;
    private final TransactionConverter transactionConverter;
    private final PlaidLinkService plaidLinkService;
    private final TransactionService transactionService;
    private final RecurringTransactionService recurringTransactionService;
    private final RecurringTransactionUtil recurringTransactionUtil;
    private final PlaidTransactionToTransactionConverter plaidTransactionToTransactionConverter;

    @Value("${plaid.secret}")
    private String secret;

    @Autowired
    public PlaidTransactionRunner(PlaidTransactionManager plaidTransactionManager,
                                  PlaidTransactionToTransactionConverter pConverter,
                                  PlaidLinkService plaidLinkService,
                                  TransactionService transactionService,
                                  RecurringTransactionService recurringTransactionService,
                                  RecurringTransactionUtil recurringTransactionUtil,
                                  TransactionConverter transactionConverter)
    {
        this.plaidTransactionManager = plaidTransactionManager;
        this.transactionService = transactionService;
        this.recurringTransactionService = recurringTransactionService;
        this.plaidTransactionToTransactionConverter = pConverter;
        this.recurringTransactionUtil = recurringTransactionUtil;
        this.plaidLinkService = plaidLinkService;
        this.transactionConverter = transactionConverter;
    }

    public List<Transaction> getTransactionsResponse(Long userId, LocalDate startDate, LocalDate endDate) throws IOException
    {
        try
        {
            CompletableFuture<TransactionsGetResponse> transactionFuture = plaidTransactionManager.getAsyncTransactionsResponse(userId, startDate, endDate);
            TransactionsGetResponse response = transactionFuture.join();
            if(response == null)
            {
                throw new TransactionRunnerException("There was an error fetching the transaction response");
            }
            List<com.plaid.client.model.Transaction> transactions = response.getTransactions();
            if(transactions == null)
            {
                return Collections.emptyList();
            }
            // Convert the plaid transactions to Transactions model
            return transactions.stream()
                    .filter(Objects::nonNull)
                    .map(plaidTransactionToTransactionConverter::convert)
                    .toList();
        }catch(IOException e){
            log.error("There was an error fetching the transactions from the response: {}", e.getMessage());
            return Collections.emptyList();
        }catch(TransactionRunnerException ex){
            throw ex;
        }
    }

    public List<RecurringTransaction> getRecurringTransactionsResponse(Long userId)
    {
        try
        {
            CompletableFuture<TransactionsRecurringGetResponse> future = plaidTransactionManager.getAsyncRecurringResponse(userId);
            TransactionsRecurringGetResponse recurringResponse = future.join();
            if(recurringResponse == null)
            {
                throw new TransactionRunnerException("There was an error fetching the recurring transactions.");
            }
            List<com.plaid.client.model.TransactionStream> outflowingStreams = recurringResponse.getOutflowStreams();
            List<com.plaid.client.model.TransactionStream> inflowingStreams = recurringResponse.getInflowStreams();
            if(outflowingStreams == null && inflowingStreams == null)
            {
                throw new TransactionRunnerException("Outflowing and inflowing streams are null");
            }else if(inflowingStreams == null)
            {
                inflowingStreams = Collections.emptyList();
            }else if(outflowingStreams == null)
            {
                outflowingStreams = Collections.emptyList();
            }
            // Convert the outflowing and inflowing streams to a RecurringTransaction object
            return recurringTransactionUtil.convertTransactionStreams(outflowingStreams, inflowingStreams);
        }catch(IOException e){
            log.error("There was an error fetching recurring transaction from the response: {}", e.getMessage());
            throw new TransactionRunnerException("There was an error fetching the recurring transactions.");
        }
    }

    public List<Transaction> syncTransactions(Long userId) throws IOException
    {
        Optional<PlaidLinkEntity> plaidLinkEntityOptional = plaidLinkService.findPlaidLinkByUserID(userId);
        if(plaidLinkEntityOptional.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            PlaidLinkEntity plaidLinkEntity = plaidLinkEntityOptional.get();
            String accessToken = plaidLinkEntity.getAccessToken();
            if(accessToken.isEmpty())
            {
                throw new InvalidAccessTokenException("Invalid access token found. Unable to sync transactions.");
            }
            String itemId = plaidLinkEntity.getItemId();
            if(itemId.isEmpty())
            {
                throw new IllegalArgumentException("Invalid item id found. Unable to sync transactions.");
            }
            CompletableFuture<TransactionsSyncResponse> syncFuture = plaidTransactionManager.syncTransactionsForUser(secret, accessToken, itemId, userId);
            TransactionsSyncResponse response = syncFuture.join();
            if(response == null)
            {
                throw new TransactionRunnerException("There was an error fetching the transactions from the response.");
            }
            List<com.plaid.client.model.Transaction> addedTransactions = response.getAdded();
            List<com.plaid.client.model.Transaction> modifiedTransactions = response.getModified();
            return Stream.of(addedTransactions, modifiedTransactions)
                    .flatMap(transactions -> convertPlaidTransaction(transactions).stream())
                    .collect(Collectors.toList());
        }catch(CompletionException ex){
            throw new TransactionRunnerException("There was an error fetching the transactions from the response");
        }
    }

    private List<Transaction> convertPlaidTransaction(List<com.plaid.client.model.Transaction> transactions)
    {
        return  transactions.stream()
                .map(plaidTransactionToTransactionConverter::convert)
                .toList();
    }

    public List<TransactionsEntity> saveTransactions(List<Transaction> transactions)
    {
        if(transactions.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            return transactionService.createAndSaveTransactions(transactions);
        }catch(TransactionRunnerException ex){
            log.error("There was an error saving the transactions to the database: {}", ex.getMessage());
            throw ex;
        }
    }

    public List<RecurringTransactionEntity> saveRecurringTransactions(List<RecurringTransaction> recurringTransactions)
    {
        if(recurringTransactions.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            return recurringTransactionService.createAndSaveRecurringTransactions(recurringTransactions);
        }catch(TransactionRunnerException ex){
            log.error("There was an error saving the recurring transactions to the database: {}", ex.getMessage());
            throw ex;
        }
    }
}