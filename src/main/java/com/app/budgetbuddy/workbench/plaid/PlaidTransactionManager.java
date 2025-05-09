package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.domain.PlaidTransaction;
import com.app.budgetbuddy.domain.RecurringTransactionDTO;
import com.app.budgetbuddy.domain.Transaction;
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
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
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
import java.util.Collections;
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
                                   RecurringTransactionConverter recurringTransactionConverter)
    {
        super(plaidLinkService, plaidApi);
        this.transactionService = transactionService;
        this.transactionConverter = transactionConverter;
        this.recurringTransactionService = recurringTransactionService;
        this.recurringTransactionConverter = recurringTransactionConverter;
    }

    public TransactionsGetRequest createTransactionRequest(String accessToken, LocalDate startDate, LocalDate endDate)
    {
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
        LOGGER.info("TransactionGetRequest: {}", transactionsGetRequest);
        Response<TransactionsGetResponse> transactionsGetResponseResponse = getTransactionsResponseWithRetry(transactionsGetRequest);
        return transactionsGetResponseResponse.body();
    }

    public Response<TransactionsGetResponse> getTransactionsResponseWithRetry(TransactionsGetRequest transactionsGetRequest) throws IOException {
        if(transactionsGetRequest == null){
            throw new IllegalArgumentException("TransactionsGetRequest cannot be null");
        }
        int attempts = 0;
        int MAX_ATTEMPTS = 3;
        final long INITIAL_DELAY_MS = 5000;
        final long MAX_DELAY_MS = 300000;
        Response<TransactionsGetResponse> transactionsGetResponse = null;
        do
        {
            Call<TransactionsGetResponse> transactionsGetResponseCall = plaidApi.transactionsGet(transactionsGetRequest);
            LOGGER.info("Transaction Response Call: {}", transactionsGetResponseCall);
            transactionsGetResponse = transactionsGetResponseCall.execute();
            try
            {
                if(transactionsGetResponse.isSuccessful()){
                    LOGGER.info("Transaction Response Successful");
                   break;
                }else{
                    attempts++;
                    if(transactionsGetResponse.errorBody() != null){
                        String errorBody = transactionsGetResponse.errorBody().string();
                        LOGGER.warn("Transaction Response Error: {}", transactionsGetResponse.errorBody().toString());
                        try
                        {
                            JsonObject jsonError = JsonParser.parseString(errorBody).getAsJsonObject();
                            String errorType = jsonError.has("error_type") ? jsonError.get("error_type").getAsString() : "Unknown";
                            String errorCode = jsonError.has("error_code") ? jsonError.get("error_code").getAsString() : "Unknown";
                            String errorMessage = jsonError.has("error_message") ? jsonError.get("error_message").getAsString() : "No error message provided";

                            if("PRODUCT_NOT_READY".equals(errorCode)){
                                LOGGER.info("Product not ready, implementing backoff strategy");
                                long delay = Math.min(INITIAL_DELAY_MS * (long) Math.pow(2, attempts - 1), MAX_DELAY_MS);
                                LOGGER.info("Waiting {} ms before next attempt", delay);
                                Thread.sleep(delay);
                                continue;
                            }
                            LOGGER.error("Plaid API Error - Type: {}, Code: {}, Message: {}", errorType, errorCode, errorMessage);

                            // If there's a display_message, log it as well
                            if (jsonError.has("display_message")) {
                                String displayMessage = jsonError.get("display_message").getAsString();
                                LOGGER.error("Display Message: {}", displayMessage);
                            }

                            // Log any additional details if present
                            if (jsonError.has("request_id")) {
                                LOGGER.error("Request ID: {}", jsonError.get("request_id").getAsString());
                            }

                        }catch(Exception e){
                            LOGGER.error("Failed to parse error response: ", e);
                        }
                    }
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

    public TransactionsSyncResponse syncTransactionsForUser(final Long userId, final String cursor) throws IOException
    {
        Optional<PlaidLinkEntity> plaidLinkEntityOptional = plaidLinkService.findPlaidLinkByUserID(userId);
        if(plaidLinkEntityOptional.isEmpty())
        {
            throw new PlaidLinkException("Plaid link not found");
        }
        PlaidLinkEntity plaidLinkEntity = plaidLinkEntityOptional.get();
        String accessToken = getPlaidAccessToken(plaidLinkEntity);
        TransactionsSyncRequest transactionsSyncRequest = new TransactionsSyncRequest()
                .accessToken(accessToken)
                .cursor(cursor);
        Call<TransactionsSyncResponse> transactionsSyncResponseCall = plaidApi.transactionsSync(transactionsSyncRequest);
        Response<TransactionsSyncResponse> response = transactionsSyncResponseCall.execute();
        if(response.isSuccessful() && response.body() != null)
        {
            return response.body();
        }
        else
        {
            throw new IOException("Failed to sync transactions for user ID " + userId);
        }
    }

    public List<Transaction> saveTransactions(List<Transaction> transactions)
    {
        if(transactions == null || transactions.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            transactionService.saveAll(transactions);
            return transactions;
        }catch(Exception e)
        {
            return Collections.emptyList();
        }
    }

    public List<TransactionsEntity> saveTransactionsToDatabase(final List<PlaidTransaction> transactionList)
    {
        List<TransactionsEntity> transactionsEntities = new ArrayList<>();
        if(transactionList.isEmpty())
        {
            throw new TransactionsNotFoundException("Transactions not found.");
        }
        for(PlaidTransaction transaction : transactionList)
        {
            if(transaction != null)
            {
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
