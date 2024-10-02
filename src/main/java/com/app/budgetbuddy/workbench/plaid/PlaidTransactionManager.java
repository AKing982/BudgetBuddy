package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.domain.PlaidTransaction;
import com.app.budgetbuddy.domain.RecurringTransactionDTO;
import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.entities.RecurringTransactionEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.exceptions.*;
import com.app.budgetbuddy.repositories.AccountRepository;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.services.TransactionService;
import com.app.budgetbuddy.workbench.converter.RecurringTransactionConverter;
import com.app.budgetbuddy.workbench.converter.TransactionConverter;
import com.plaid.client.model.*;
import com.plaid.client.request.PlaidApi;
import jakarta.transaction.InvalidTransactionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import retrofit2.Call;
import retrofit2.Response;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class PlaidTransactionManager extends AbstractPlaidManager
{
    private Logger LOGGER = LoggerFactory.getLogger(PlaidTransactionManager.class);
    private final TransactionService transactionService;
    private final RecurringTransactionService recurringTransactionService;
    private final TransactionConverter transactionConverter;
    private final RecurringTransactionConverter recurringTransactionConverter;

    @Autowired
    public PlaidTransactionManager(PlaidLinkService plaidLinkService, PlaidApi plaidApi,
                                   TransactionService transactionService,
                                   TransactionConverter transactionConverter,
                                   RecurringTransactionService recurringTransactionService,
                                   RecurringTransactionConverter recurringTransactionConverter) {
        super(plaidLinkService, plaidApi);
        this.transactionService = transactionService;
        this.transactionConverter = transactionConverter;
        this.recurringTransactionService = recurringTransactionService;
        this.recurringTransactionConverter = recurringTransactionConverter;
    }

    public TransactionsGetRequest createTransactionRequest(String accessToken, LocalDate startDate, LocalDate endDate){
        LOGGER.info("Retrieving Transactions with access token: {}", accessToken);
        LOGGER.info("Creating Transaction Request for date range: " + startDate + " - " + endDate);
        if(accessToken.isEmpty()){
            throw new InvalidAccessTokenException("Invalid access token");
        }
        if(startDate == null || endDate == null){
            throw new IllegalDateException("Start date cannot be null");
        }

        if(startDate.isAfter(endDate)){
            return createTransactionRequest(accessToken, endDate, startDate);
        }
        return createRequest(accessToken, startDate, endDate);
    }

    public TransactionsGetResponse getTransactionsForUser(Long userId, LocalDate startDate, LocalDate endDate) throws IOException {
        PlaidLinkEntity plaidLink = findPlaidLinkByUserId(userId);
        String accessToken = getPlaidAccessToken(plaidLink);
        LOGGER.info("Retrieving Transactions with access token: {}", accessToken);
        TransactionsGetRequest transactionsGetRequest = createTransactionRequest(accessToken, startDate, endDate);
        Response<TransactionsGetResponse> transactionsGetResponseResponse = getTransactionsResponseWithRetry(transactionsGetRequest);
        LOGGER.info("Transaction Response: {}", transactionsGetResponseResponse.body());
        return transactionsGetResponseResponse.body();
    }

    public Response<TransactionsGetResponse> getTransactionsResponseWithRetry(TransactionsGetRequest transactionsGetRequest) throws IOException {
        if(transactionsGetRequest == null){
            throw new IllegalArgumentException("TransactionsGetRequest cannot be null");
        }
        int attempts = 0;
        int MAX_ATTEMPTS = 3;
        Response<TransactionsGetResponse> transactionsGetResponse = null;
        do
        {
            LOGGER.info("Transaction Request: {}", transactionsGetRequest.toString());
            Call<TransactionsGetResponse> transactionsGetResponseCall = plaidApi.transactionsGet(transactionsGetRequest);
            transactionsGetResponse = transactionsGetResponseCall.execute();
            try
            {
                if(transactionsGetResponse.isSuccessful()){
                   break;
                }else{
                    attempts++;
                    Thread.sleep(500);
                }
            }catch(InterruptedException e)
            {
                LOGGER.error("There was an error while getting the transactions response", e);
            }

        }while(attempts < MAX_ATTEMPTS);
        return transactionsGetResponse;
    }

    public TransactionsRecurringGetResponse getRecurringTransactionsForUser(Long userId) throws IOException {
        if(userId < 1){
            throw new InvalidUserIDException("Invalid user ID");
        }
        PlaidLinkEntity plaidLink = findPlaidLinkByUserId(userId);
        String accessToken = getPlaidAccessToken(plaidLink);
        LOGGER.info("Retrieving Access Token for recurring transactions: {}", accessToken);
        TransactionsRecurringGetRequestOptions options = new TransactionsRecurringGetRequestOptions()
                .includePersonalFinanceCategory(true);

        TransactionsRecurringGetRequest request = new TransactionsRecurringGetRequest()
                .accessToken(accessToken)
                .options(options);

        Call<TransactionsRecurringGetResponse> callResponse = plaidApi.transactionsRecurringGet(request);
        return callResponse.execute().body();
    }

    private TransactionsRecurringGetResponse getRecurringTransactionsResponseWithRetry(TransactionsRecurringGetRequest request) throws IOException {
        if (request == null) {
            throw new IllegalArgumentException("TransactionsRecurringGetRequest cannot be null");
        }

        int attempts = 0;
        int MAX_ATTEMPTS = 3;
        Response<TransactionsRecurringGetResponse> response = null;

        do {
            Call<TransactionsRecurringGetResponse> call = plaidApi.transactionsRecurringGet(request);
            response = call.execute();

            if (response.isSuccessful()) {
                return response.body();
            } else {
                attempts++;
                LOGGER.warn("Attempt {} failed to get recurring transactions. Status code: {}",
                        attempts, response.code());
                try {
                    Thread.sleep(500);
                } catch (InterruptedException e) {
                    LOGGER.error("Sleep interrupted while retrying to get recurring transactions", e);
                    Thread.currentThread().interrupt();
                }
            }
        } while (attempts < MAX_ATTEMPTS);

        throw new IOException("Failed to get recurring transactions after " + MAX_ATTEMPTS + " attempts. Last status code: " +
                (response != null ? response.code() : "N/A"));
    }

    public List<RecurringTransactionEntity> saveRecurringTransactions(final List<RecurringTransactionDTO> recurringTransactions) throws IOException {
        List<RecurringTransactionEntity> recurringTransactionEntities = new ArrayList<>();
        if(recurringTransactions == null){
            return new ArrayList<>();
        }
        if(recurringTransactions.isEmpty()){
            return new ArrayList<>();
        }
        for(RecurringTransactionDTO recurringTransaction : recurringTransactions) {
            RecurringTransactionEntity recurringTransactionEntity = recurringTransactionConverter.convert(recurringTransaction);
            recurringTransactionService.save(recurringTransactionEntity);
            recurringTransactionEntities.add(recurringTransactionEntity);
        }
        return recurringTransactionEntities;
    }

    private TransactionsRefreshRequest createTransactionRefreshRequest(String accessToken){
        return new TransactionsRefreshRequest()
                .accessToken(accessToken);
    }

    public TransactionsRefreshResponse getTransactionRefreshResponse(TransactionsRefreshRequest request) throws IOException {
        return null;
    }

    private TransactionsSyncRequest createSyncRequest(String accessToken, String cursor, TransactionsSyncRequestOptions options){
        return new TransactionsSyncRequest()
                .accessToken(accessToken)
                .cursor(cursor)
                .options(options);
    }

    public TransactionsSyncResponse getResyncedTransactionsResponseWithRetry(TransactionsSyncRequest transactionsSyncRequest) throws IOException {
        return null;
    }

    public List<TransactionsEntity> saveTransactionsToDatabase(final List<PlaidTransaction> transactionList){
        List<TransactionsEntity> transactionsEntities = new ArrayList<>();
        if(transactionList.isEmpty()){
            throw new TransactionsNotFoundException("Transactions not found.");
        }

        for(PlaidTransaction transaction : transactionList){
            if(transaction != null){
                TransactionsEntity transactionsEntity = transactionConverter.convert(transaction);
                validateTransactionParameterForNulls(transactionsEntity);
                transactionService.save(transactionsEntity);
                transactionsEntities.add(transactionsEntity);
            }
        }
        return transactionsEntities;
    }

    public void validateTransactionParameterForNulls(TransactionsEntity transactionsEntity){
        if(transactionsEntity.getId() == null
                || transactionsEntity.getAccount() == null
                || transactionsEntity.getAmount() == null
                || transactionsEntity.getDescription() == null
//                || transactionsEntity.getCategories() == null
                || transactionsEntity.getAuthorizedDate() == null){
                LOGGER.error("TransactionEntity Parameter found null: {}", transactionsEntity.toString());
        }
    }

    private TransactionsGetRequest createRequest(String accessToken, LocalDate startDate, LocalDate endDate){
        return new TransactionsGetRequest()
                .accessToken(accessToken)
                .startDate(startDate)
                .endDate(endDate);
    }
}
