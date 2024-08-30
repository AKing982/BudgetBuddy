package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.exceptions.InvalidAccessTokenException;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.plaid.client.model.AccountsGetRequest;
import com.plaid.client.model.Transaction;
import com.plaid.client.model.TransactionsGetRequest;
import com.plaid.client.model.TransactionsGetResponse;
import com.plaid.client.request.PlaidApi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import retrofit2.Call;
import retrofit2.Response;

import java.io.IOException;
import java.time.LocalDate;

@Service
public class PlaidTransactionManager extends AbstractPlaidManager
{
    private Logger LOGGER = LoggerFactory.getLogger(PlaidTransactionManager.class);

    @Autowired
    public PlaidTransactionManager(PlaidLinkService plaidLinkService, PlaidApi plaidApi) {
        super(plaidLinkService, plaidApi);
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
        String accessToken = plaidLink.getAccessToken();
        TransactionsGetRequest transactionsGetRequest = createTransactionRequest(accessToken, startDate, endDate);
        Call<TransactionsGetResponse> transactionsGetResponse = plaidApi.transactionsGet(transactionsGetRequest);
        Response<TransactionsGetResponse> transactionsGetResponseResponse = transactionsGetResponse.execute();
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

    private TransactionsGetRequest createRequest(String accessToken, LocalDate startDate, LocalDate endDate){
        return new TransactionsGetRequest()
                .accessToken(accessToken)
                .startDate(startDate)
                .endDate(endDate);
    }
}
