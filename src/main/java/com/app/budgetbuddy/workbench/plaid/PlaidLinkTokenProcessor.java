package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.exceptions.PlaidApiException;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.plaid.client.model.*;
import com.plaid.client.request.PlaidApi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import retrofit2.Call;
import retrofit2.Response;

import java.io.IOException;
import java.util.Arrays;

@Service
public class PlaidLinkTokenProcessor extends AbstractPlaidManager
{
    private Logger LOGGER = LoggerFactory.getLogger(PlaidLinkTokenProcessor.class);

    @Autowired
    public PlaidLinkTokenProcessor(PlaidLinkService plaidLinkService, PlaidApi plaidApi) {
        super(plaidLinkService, plaidApi);
    }

    /**
     * Creates a link token request.
     *
     * @param clientUserId the ID of the client user
     * @return the created link token request
     */
    public LinkTokenCreateRequest createLinkTokenRequest(String clientUserId){
        if(clientUserId.isEmpty()){
            throw new IllegalArgumentException("Client user id cannot be empty");
        }
        return new LinkTokenCreateRequest()
                .user(new LinkTokenCreateRequestUser().clientUserId(clientUserId))
                .products(Arrays.asList(Products.AUTH, Products.TRANSACTIONS))
                .countryCodes(Arrays.asList(CountryCode.US));
    }

    /**
     * Creates a link token.
     *
     * @param clientUserId the ID of the client user
     * @return the created link token response
     */
    public LinkTokenCreateResponse createLinkToken(String clientUserId) throws IOException {
        if(clientUserId.isEmpty()){
            throw new IllegalArgumentException("Client user id cannot be empty");
        }
        LinkTokenCreateRequest linkTokenCreateRequest = createLinkTokenRequest(clientUserId);
        Call<LinkTokenCreateResponse> linkTokenResponse = plaidApi.linkTokenCreate(linkTokenCreateRequest);
        LOGGER.info("Link Token: {}", linkTokenResponse.execute().body().getLinkToken());
        Response<LinkTokenCreateResponse> response = linkTokenResponse.execute();
        return response.body();
    }

    /**
     * Method to create an item public token exchange request.
     *
     * @param publicToken the public token to be exchanged for an access token
     * @return the item public token exchange request
     */
    public ItemPublicTokenExchangeRequest createPublicTokenExchangeRequest(String publicToken){
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
     * @throws InterruptedException if the current thread is interrupted while waiting
     */
    public ItemPublicTokenExchangeResponse exchangePublicToken(String publicToken) throws IOException, InterruptedException
    {
        if(publicToken.isEmpty()){
            throw new IllegalArgumentException("Public token cannot be empty");
        }
        ItemPublicTokenExchangeRequest itemPublicTokenExchangeRequest = createPublicTokenExchangeRequest(publicToken);

        Call<ItemPublicTokenExchangeResponse> publicTokenExchangeResponseCall = plaidApi.itemPublicTokenExchange(itemPublicTokenExchangeRequest);
        Response<ItemPublicTokenExchangeResponse> response = publicTokenExchangeResponseCall.execute();
        return response.body();
    }
}
