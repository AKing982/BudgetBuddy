package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.domain.PlaidCursor;
import com.app.budgetbuddy.domain.PlaidTransaction;
import com.app.budgetbuddy.domain.RecurringTransactionDTO;
import com.app.budgetbuddy.entities.*;
import com.app.budgetbuddy.exceptions.*;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.converter.RecurringTransactionConverter;
import com.app.budgetbuddy.workbench.converter.TransactionConverter;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.plaid.client.model.*;
import com.plaid.client.request.PlaidApi;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import retrofit2.Call;
import retrofit2.Response;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class PlaidTransactionManager extends AbstractPlaidManager
{
    private final RecurringTransactionService recurringTransactionService;
    private final TransactionService transactionService;
    private final TransactionConverter transactionConverter;
    private final RecurringTransactionConverter recurringTransactionConverter;
    private final String clientId = "BudgetBuddy";
    private final PlaidCursorService plaidCursorService;
    private List<com.plaid.client.model.Transaction> addedSyncedTransactions = new ArrayList<>();
    private List<com.plaid.client.model.Transaction> modifiedSyncedTransactions = new ArrayList<>();

    @Autowired
    public PlaidTransactionManager(PlaidLinkService plaidLinkService, PlaidApi plaidApi,
                                   TransactionConverter transactionConverter,
                                   RecurringTransactionService recurringTransactionService,
                                   TransactionService transactionService,
                                   RecurringTransactionConverter recurringTransactionConverter,
                                   PlaidCursorService plaidCursorService,
                                   UserService userService)
    {
        super(plaidLinkService, userService, plaidApi);
        this.transactionConverter = transactionConverter;
        this.recurringTransactionService = recurringTransactionService;
        this.transactionService = transactionService;
        this.recurringTransactionConverter = recurringTransactionConverter;
        this.userService = userService;
        this.plaidCursorService = plaidCursorService;
    }

    private TransactionsGetRequest createTransactionRequest(String accessToken, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            if(accessToken.isEmpty())
            {
                throw new InvalidAccessTokenException("Invalid access token");
            }
            return new TransactionsGetRequest()
                    .accessToken(accessToken)
                    .clientId("BudgetBuddy")
                    .startDate(startDate)
                    .endDate(endDate);
        }catch(InvalidAccessTokenException ex){
            log.error("There was an error creating the transaction request: {}", ex.getMessage());
            throw ex;
        }
    }

    @Async("taskExecutor")
    public CompletableFuture<TransactionsGetResponse> getAsyncTransactionsResponse(Long userId, LocalDate startDate, LocalDate endDate) throws IOException
    {
        Optional<UserEntity> user = userService.findById(userId);
        if(user.isEmpty())
        {
            throw new UserNotFoundException("User with id " + userId + " not found");
        }
        PlaidLinkEntity plaidLink = findPlaidLinkByUserId(userId);
        String accessToken = plaidLink.getAccessToken();
        if(accessToken.isEmpty())
        {
            throw new InvalidAccessTokenException("Invalid access token");
        }
        TransactionsGetRequest transactionGetRequest = createTransactionRequest(accessToken, startDate, endDate);
        Call<TransactionsGetResponse> transactionsGetResponseCall = plaidApi.transactionsGet(transactionGetRequest);
        Response<TransactionsGetResponse> transactionResponse = transactionsGetResponseCall.execute();
        if(transactionResponse.isSuccessful())
        {
            return CompletableFuture.completedFuture(transactionResponse.body());
        }
        else
        {
            int attempts = 0;
            while(attempts < MAX_ATTEMPTS)
            {
                try
                {
                    Response<TransactionsGetResponse> transactionsResponse = plaidApi.transactionsGet(transactionGetRequest).execute();
                    if(transactionsResponse.isSuccessful())
                    {
                        return CompletableFuture.completedFuture(transactionsResponse.body());
                    }
                    else
                    {
                        attempts++;
                        if(attempts == MAX_ATTEMPTS)
                        {
                            showPlaidResponseErrors(transactionsResponse, attempts);
                        }
                    }
                }catch(IOException e){
                    log.error("There was an error fetching the plaid transactions from transactions get call: {}", e.getMessage());
                    return CompletableFuture.failedFuture(e);
                }
            }
            return CompletableFuture.failedFuture(new RuntimeException("There was an error getting the transactions response"));
        }
    }

    private void showPlaidResponseErrors(Response<TransactionsGetResponse> transactionsGetResponse, int attempts) throws IOException
    {
        if(transactionsGetResponse.errorBody() == null)
        {
            log.error("No Transaction Get Response found");
        }
        try
        {
            String errorBody = transactionsGetResponse.errorBody().string();
            JsonObject jsonError = JsonParser.parseString(errorBody).getAsJsonObject();
            String errorType = jsonError.has("error_type") ? jsonError.get("error_type").getAsString() : "Unknown";
            String errorCode = jsonError.has("error_code") ? jsonError.get("error_code").getAsString() : "Unknown";
            String errorMessage = jsonError.has("error_message") ? jsonError.get("error_message").getAsString() : "No Error Message";
            if("PRODUCT_NOT_READY".equals(errorCode))
            {
                log.info("Product Not Ready, implementing backoff strategy...");
                long delay = Math.min(5000 * (long) Math.pow(2, attempts - 1), 300000);
                Thread.sleep(delay);
            }
            log.error("Plaid API Error - Type: {}, Code: {}, Message: {}", errorType, errorCode, errorMessage);
            if(jsonError.has("display_message"))
            {
                String displayMessage = jsonError.get("display_message").getAsString();
                log.error("Display Message: {}", displayMessage);
            }
        }catch(InterruptedException e){
            log.error("The response was interrupted: {}", e.getMessage());
        }catch(IOException ex){
            log.error("There was an error while fetching the transaction response errors: {}", ex.getMessage());
        }
    }

    private TransactionsRecurringGetRequest createRecurringTransactionRequest(String accessToken)
    {
        if(accessToken.isEmpty())
        {
            throw new InvalidAccessTokenException("No Access token was provided");
        }
        try
        {
            return new TransactionsRecurringGetRequest()
                    .accessToken(accessToken)
                    .clientId("BudgetBuddy");
        } catch (InvalidAccessTokenException e)
        {
            log.error("There was an error creating the recurring transaction request: {}", e.getMessage());
            throw e;
        }
    }

    @Async("taskExecutor")
    public CompletableFuture<TransactionsRecurringGetResponse> getAsyncRecurringResponse(Long userId) throws IOException
    {
        Optional<UserEntity> userEntityOptional = userService.findById(userId);
        if(userEntityOptional.isEmpty())
        {
            return CompletableFuture.failedFuture(new UserNotFoundException("User with id "+ userId + " was not found."));
        }

        PlaidLinkEntity plaidLinkEntity = findPlaidLinkByUserId(userId);
        String accessToken = plaidLinkEntity.getAccessToken();
        TransactionsRecurringGetRequest request = createRecurringTransactionRequest(accessToken);
        Response<TransactionsRecurringGetResponse> transactionRecurringResponse = plaidApi.transactionsRecurringGet(request).execute();
        if(transactionRecurringResponse.isSuccessful())
        {
            return CompletableFuture.completedFuture(transactionRecurringResponse.body());
        }
        else
        {
            int attempts = 0;
            while(attempts < MAX_ATTEMPTS)
            {
                Response<TransactionsRecurringGetResponse> recurringRetryResponse = plaidApi.transactionsRecurringGet(request).execute();
                if(recurringRetryResponse.isSuccessful())
                {
                    return CompletableFuture.completedFuture(recurringRetryResponse.body());
                }
                else
                {
                    attempts++;
                }
            }
        }
        return CompletableFuture.failedFuture(new RuntimeException("There was an error fetching recurring transactions."));
    }

    private TransactionsSyncRequest createTransactionSyncRequest(String secret, String accessToken, String cursor, TransactionsSyncRequestOptions options)
    {
        return new TransactionsSyncRequest()
                .secret(secret)
                .cursor(cursor)
                .count(500)
                .options(options)
                .accessToken(accessToken);
    }

    @Async("taskExecutor")
    public CompletableFuture<TransactionsSyncResponse> syncTransactionsForUser(final String secret, final String itemId, final String accessToken, final Long userId) throws IOException
    {
        Optional<UserEntity> userEntityOptional = userService.findById(userId);
        if(userEntityOptional.isEmpty())
        {
            log.info("No user found with userId {}. Unable to sync transactions", userId);
            return CompletableFuture.failedFuture(new UserNotFoundException("User with id " + userId + " was not found"));
        }
        if(accessToken.isEmpty())
        {
            return CompletableFuture.failedFuture(new InvalidAccessTokenException("Invalid access token was found. Unable to sync user transactions."));
        }
        TransactionsSyncRequestOptions options = new TransactionsSyncRequestOptions()
                .includePersonalFinanceCategory(true);
        boolean hasMore = true;
        String nextCursor;
        while(hasMore)
        {
            PlaidCursorEntity plaidCursorEntity = plaidCursorService.findByUserAndItemId(userId, itemId);
            String cursor = plaidCursorEntity.getCursor();
            TransactionsSyncRequest transactionsSyncRequest = createTransactionSyncRequest(secret, accessToken, cursor, options);
            Response<TransactionsSyncResponse> response = plaidApi.transactionsSync(transactionsSyncRequest).execute();
            if(response.isSuccessful())
            {
                TransactionsSyncResponse body = response.body();
                List<com.plaid.client.model.Transaction> addedTransactions = body.getAdded();
                List<com.plaid.client.model.Transaction> modifiedTransactions = body.getModified();
                addedSyncedTransactions.addAll(addedTransactions);
                modifiedSyncedTransactions.addAll(modifiedTransactions);
                hasMore = body.getHasMore();
                nextCursor = body.getNextCursor();
                if(nextCursor == null)
                {
                    PlaidCursor plaidCursor = PlaidCursor.builder()
                            .addedCursor(cursor)
                            .userId(userId)
                            .lastSyncTimestamp(LocalDateTime.now())
                            .cursorSyncSuccessful(true)
                            .build();
                    plaidCursorService.savePlaidCursor(plaidCursor);
                }
                else
                {
                    plaidCursorService.updateNextPlaidCursor(nextCursor, userId, itemId);
                }
                return CompletableFuture.completedFuture(body);
            }
            else
            {
                int attempts = 0;
                while(attempts < MAX_ATTEMPTS)
                {
                    Response<TransactionsSyncResponse> response2 = plaidApi.transactionsSync(transactionsSyncRequest).execute();
                    if(response2.isSuccessful())
                    {
                        TransactionsSyncResponse body = response2.body();
                        List<com.plaid.client.model.Transaction> addedTransactions = body.getAdded();
                        List<com.plaid.client.model.Transaction> modifiedTransactions = body.getModified();
                        addedSyncedTransactions.addAll(addedTransactions);
                        modifiedSyncedTransactions.addAll(modifiedTransactions);
                        hasMore = body.getHasMore();
                        nextCursor = body.getNextCursor();
                        if(nextCursor == null)
                        {
                            PlaidCursor plaidCursor = PlaidCursor.builder()
                                    .addedCursor(nextCursor)
                                    .userId(userId)
                                    .lastSyncTimestamp(LocalDateTime.now())
                                    .cursorSyncSuccessful(true)
                                    .build();
                            plaidCursorService.savePlaidCursor(plaidCursor);
                        }
                        else
                        {
                            plaidCursorService.updateNextPlaidCursor(nextCursor, userId, itemId);
                        }
                        return CompletableFuture.completedFuture(body);
                    }
                    else
                    {
                        attempts++;
                    }
                }
                hasMore = false;
            }
        }
        return CompletableFuture.failedFuture(new SyncCursorException("There was an error syncing transactions."));
    }

}
