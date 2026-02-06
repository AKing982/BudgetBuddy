package com.app.budgetbuddy.workbench.runner;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Autowired;
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
    private final RecurringTransactionUtil recurringTransactionUtil;
    private final PlaidTransactionToTransactionConverter plaidTransactionToTransactionConverter;

    @Autowired
    public PlaidTransactionRunner(PlaidTransactionManager plaidTransactionManager,
                                  PlaidTransactionToTransactionConverter pConverter,
                                  PlaidLinkService plaidLinkService,
                                  RecurringTransactionUtil recurringTransactionUtil,
                                  TransactionConverter transactionConverter)
    {
        this.plaidTransactionManager = plaidTransactionManager;
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
            log.error("There was an error fetching the transactions from the response: ", e.getMessage());
            return Collections.emptyList();
        }catch(TransactionRunnerException ex){
            throw ex;
        }
    }

    public List<RecurringTransaction> getRecurringTransactionsResponse(Long userId) throws IOException
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

            // Convert the outflowing and inflowing streams to a RecurringTransaction object
            return recurringTransactionUtil.convertTransactionStreams(outflowingStreams, inflowingStreams);
        }catch(IOException e){
            log.error("There was an error fetching recurring transaction from the response: {}", e.getMessage());
            return Collections.emptyList();
        }catch(TransactionRunnerException ex){
            throw ex;
        }
    }

    public List<Transaction> syncTransactions(Long userId)
    {
        return null;
    }

    public List<TransactionsEntity> saveTransactions(List<Transaction> transactions)
    {
        return null;
    }

    public List<RecurringTransactionEntity> saveRecurringTransactions(List<RecurringTransaction> recurringTransactions)
    {
        return null;
    }
}