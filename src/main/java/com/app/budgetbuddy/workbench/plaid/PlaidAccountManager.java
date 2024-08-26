package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.domain.PlaidAccount;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.plaid.client.model.AccountBase;
import com.plaid.client.model.AccountsGetRequest;
import com.plaid.client.model.AccountsGetResponse;
import com.plaid.client.request.PlaidApi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
public class PlaidAccountManager extends AbstractPlaidManager
{
    private Logger LOGGER = LoggerFactory.getLogger(PlaidAccountManager.class);

    public PlaidAccountManager(PlaidLinkService plaidLinkService, PlaidApi plaidApi) {
        super(plaidLinkService, plaidApi);
    }

    /**
     * This method is used to create an instance of the AccountsGetRequest class.
     * It takes an access token as a parameter and returns an instance of AccountsGetRequest.
     *
     * @param accessToken The access token to be used for creating the accounts request.
     * @return An instance of AccountsGetRequest class.
     */
    public AccountsGetRequest createAccountRequest(String accessToken){
        return null;
    }

    /**
     * Retrieves the accounts associated with a given user.
     *
     * @param accessToken The access token for the user.
     * @param userId The user ID.
     * @return The response containing the accounts for the user.
     */
    public AccountsGetResponse getAccountsForUser(String accessToken, String userId){
        return null;
    }

    /**
     * Retrieves the accounts associated with a given user using the provided AccountsGetRequest,
     * with an optional retry mechanism.
     *
     * @param accountsGetRequest The request object containing the necessary information to retrieve the accounts.
     * @return The response containing the accounts for the user.
     */
    public AccountsGetResponse getAccountsForUserWithRetryResponse(AccountsGetRequest accountsGetRequest){
        return null;
    }

    /**
     * Retrieves a set of PlaidAccount objects from a list of AccountBase objects.
     *
     * @param accounts The list of AccountBase objects to convert.
     * @return A set of PlaidAccount objects.
     */
    public Set<PlaidAccount> getPlaidAccountSetFromResponse(final List<AccountBase> accounts){
        return null;
    }





}
