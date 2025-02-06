package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.exceptions.PlaidApiException;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.plaid.client.model.*;
import com.plaid.client.request.PlaidApi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import retrofit2.Call;
import retrofit2.Response;

import java.io.IOException;
import java.util.Arrays;

@Service
public class PlaidLinkTokenProcessor extends AbstractPlaidManager
{
    @Value("{plaid.client-id}")
    private String clientId;

    @Value("{plaid.secret}")
    private String secret;

    private Logger LOGGER = LoggerFactory.getLogger(PlaidLinkTokenProcessor.class);

    @Autowired
    public PlaidLinkTokenProcessor(PlaidLinkService plaidLinkService, @Qualifier("plaid") PlaidApi plaidApi) {
        super(plaidLinkService, plaidApi);
        if(plaidApi == null){
            throw new RuntimeException("Plaid Api is null");
        }
        this.plaidApi = plaidApi;

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
                .clientName("BudgetBuddy")
                .products(Arrays.asList(Products.TRANSACTIONS))
                .countryCodes(Arrays.asList(CountryCode.US))
                .language("en");

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
        Response<LinkTokenCreateResponse> response = createLinkTokenWithRetry(linkTokenCreateRequest);
        return response.body();
    }

    public Response<LinkTokenCreateResponse> createLinkTokenWithRetry(LinkTokenCreateRequest linkTokenCreateRequest) throws IOException {
        if(linkTokenCreateRequest == null){
            throw new PlaidApiException("Link token create request is null");
        }
        Response<LinkTokenCreateResponse> response = null;
        int MAX_ATTEMPTS = 3;
        int attempts = 0;
        do
        {
            attempts++;
            Call<LinkTokenCreateResponse> linkTokenResponse = plaidApi.linkTokenCreate(linkTokenCreateRequest);
            response = linkTokenResponse.execute();
            if(!response.isSuccessful()){
                try
                {
                    Thread.sleep(1000);
                }catch(InterruptedException e)
                {
                    throw new PlaidApiException("Error while waiting for the next attempt: ", e);
                }
            }

        }while(attempts < MAX_ATTEMPTS && !response.isSuccessful());

        if(response.isSuccessful()){
            return response;
        }else{
            throw new PlaidApiException("Failed to create link token after " + attempts + " attempts");
        }
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

    public LinkTokenCreateResponse createUpdateLinkToken(Long userId, String accessToken) throws IOException
    {
        if (userId == null || userId < 1 || accessToken == null || accessToken.isEmpty())
        {
            throw new IllegalArgumentException("Invalid userId or accessToken for Plaid update link.");
        }

        LinkTokenCreateRequest request = new LinkTokenCreateRequest()
                .clientName("BudgetBuddy")
                .user(new LinkTokenCreateRequestUser().clientUserId(userId.toString()))
                .countryCodes(Arrays.asList(CountryCode.US))
                .language("en")
                .products(Arrays.asList(Products.TRANSACTIONS))
                .accessToken(accessToken);

        Call<LinkTokenCreateResponse> linkTokenCall = plaidApi.linkTokenCreate(request);
        Response<LinkTokenCreateResponse> response = linkTokenCall.execute();

        if (!response.isSuccessful() || response.body() == null) {
            throw new PlaidApiException("Failed to create update link token: " + response.errorBody().string());
        }

        return response.body();
    }
}
