package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.services.PlaidLinkService;
import com.plaid.client.model.*;
import com.plaid.client.request.PlaidApi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import retrofit2.Call;

import java.io.IOException;
import java.util.Arrays;

@Service
public class PlaidLinkTokenProcessor extends AbstractPlaidManager
{
    private Logger LOGGER = LoggerFactory.getLogger(PlaidLinkTokenProcessor.class);

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
        return linkTokenResponse.execute().body();
    }

    /**
     * Method to create an item public token exchange request.
     *
     * @param publicToken the public token to be exchanged for an access token
     * @return the item public token exchange request
     */
    public ItemPublicTokenExchangeRequest itemPublicTokenExchangeRequest(String publicToken){
        return null;
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
        return null;
    }
}
