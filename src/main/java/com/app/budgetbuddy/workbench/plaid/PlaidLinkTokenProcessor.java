package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.services.PlaidLinkService;
import com.plaid.client.model.ItemPublicTokenExchangeRequest;
import com.plaid.client.model.ItemPublicTokenExchangeResponse;
import com.plaid.client.model.LinkTokenCreateRequest;
import com.plaid.client.model.LinkTokenCreateResponse;
import com.plaid.client.request.PlaidApi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;

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
        return null;
    }

    /**
     * Creates a link token.
     *
     * @param clientUserId the ID of the client user
     * @return the created link token response
     */
    public LinkTokenCreateResponse createLinkToken(String clientUserId){
        return null;
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
