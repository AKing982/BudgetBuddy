package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.exceptions.PlaidApiException;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.plaid.client.model.*;
import com.plaid.client.request.PlaidApi;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import retrofit2.Call;
import retrofit2.Response;

import java.io.IOException;
import java.util.Arrays;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class PlaidLinkTokenProcessor extends AbstractPlaidManager
{
    @Value("${plaid.client-id}")
    private String clientId;

    @Value("${plaid.secret}")
    private String secret;

    @Value("${plaid.redirect.uri}")
    private String redirectUri;

    @Autowired
    public PlaidLinkTokenProcessor(PlaidLinkService plaidLinkService, @Qualifier("plaid") PlaidApi plaidApi)
    {
        super(plaidLinkService, plaidApi);
    }

    /**
     * Creates a link token request.
     *
     * @param clientUserId the ID of the client user
     * @return the created link token request
     */
    public LinkTokenCreateRequest createLinkTokenRequest(String clientUserId)
    {
        if(clientUserId.isEmpty())
        {
            throw new IllegalArgumentException("Client user id cannot be empty");
        }
        try
        {
            LinkTokenCreateRequest linkTokenCreateRequest = new LinkTokenCreateRequest()
                    .user(new LinkTokenCreateRequestUser().clientUserId(clientUserId))
                    .clientName("BudgetBuddy")
                    .products(Arrays.asList(Products.TRANSACTIONS))
                    .countryCodes(Arrays.asList(CountryCode.US))
                    .redirectUri(redirectUri)
                    .language("en");
            log.info("Link Token Create Request: " + linkTokenCreateRequest);
            return linkTokenCreateRequest;
        }catch(DataException e){
            log.error("Error creating link token request: {}",e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Creates a link token.
     *
     * @param clientUserId the ID of the client user
     * @return the created link token response
     */
    @Async("taskExecutor")
    public LinkTokenCreateResponse createLinkToken(String clientUserId) throws IOException {
//        if(clientUserId.isEmpty()){
//            throw new IllegalArgumentException("Client user id cannot be empty");
//        }
//        LinkTokenCreateRequest linkTokenCreateRequest = createLinkTokenRequest(clientUserId);
//        Response<LinkTokenCreateResponse> response = createLinkTokenWithRetry(linkTokenCreateRequest);
//        return response.body();
        return null;
    }

    /**
     * Method to create an item public token exchange request.
     *
     * @param publicToken the public token to be exchanged for an access token
     * @return the item public token exchange request
     */
    private ItemPublicTokenExchangeRequest createPublicTokenExchangeRequest(String publicToken){
        if(publicToken.isEmpty()){
            throw new IllegalArgumentException("Public token cannot be empty");
        }
        return new ItemPublicTokenExchangeRequest()
                .publicToken(publicToken);
    }

    /**
     * Method to exchange a public token for an item public token.
     *
     * @param publicToken the public token to be exchanged for an item public token
     * @return the item public token exchange response
     * @throws IOException if an I/O error occurs
     */
    @Async("taskExecutor")
    public CompletableFuture<ItemPublicTokenExchangeResponse> exchangePublicToken(String publicToken) throws IOException {
//        if(publicToken.isEmpty()){
//            throw new IllegalArgumentException("Public token cannot be empty");
//        }
//        ItemPublicTokenExchangeRequest itemPublicTokenExchangeRequest = createPublicTokenExchangeRequest(publicToken);
//
//        Call<ItemPublicTokenExchangeResponse> publicTokenExchangeResponseCall = plaidApi.itemPublicTokenExchange(itemPublicTokenExchangeRequest);
//        Response<ItemPublicTokenExchangeResponse> response = publicTokenExchangeResponseCall.execute();
//        return response.body();
        return null;
    }

    @Async("taskExecutor")
    public CompletableFuture<LinkTokenCreateResponse> createUpdateLinkToken(Long userId, String accessToken) throws IOException
    {
//        if (userId == null || userId < 1 || accessToken == null || accessToken.isEmpty())
//        {
//            throw new IllegalArgumentException("Invalid userId or accessToken for Plaid update link.");
//        }
//
//        LinkTokenCreateRequest request = new LinkTokenCreateRequest()
//                .clientName("BudgetBuddy")
//                .user(new LinkTokenCreateRequestUser().clientUserId(userId.toString()))
//                .countryCodes(Arrays.asList(CountryCode.US))
//                .language("en")
//                .products(Arrays.asList(Products.TRANSACTIONS))
//                .accessToken(accessToken);
//
//        Call<LinkTokenCreateResponse> linkTokenCall = plaidApi.linkTokenCreate(request);
//        Response<LinkTokenCreateResponse> response = linkTokenCall.execute();
//
//        if (!response.isSuccessful() || response.body() == null) {
//            throw new PlaidApiException("Failed to create update link token: " + response.errorBody().string());
//        }
//
//        return response.body();
        return null;
    }
}
