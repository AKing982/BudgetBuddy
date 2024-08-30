package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.domain.PlaidAccount;
import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.exceptions.PlaidApiException;
import com.app.budgetbuddy.exceptions.PlaidLinkException;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.plaid.client.model.AccountBase;
import com.plaid.client.model.AccountsGetRequest;
import com.plaid.client.model.AccountsGetResponse;
import com.plaid.client.request.PlaidApi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import retrofit2.Call;
import retrofit2.Response;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class PlaidAccountManager extends AbstractPlaidManager
{
    private Logger LOGGER = LoggerFactory.getLogger(PlaidAccountManager.class);
    private PlaidApi plaidApi;

    public PlaidAccountManager(PlaidLinkService plaidLinkService, @Qualifier("plaid") PlaidApi plaidApi) {
        super(plaidLinkService);
        this.plaidApi = plaidApi;
    }

    /**
     * This method is used to create an instance of the AccountsGetRequest class.
     * It takes an access token as a parameter and returns an instance of AccountsGetRequest.
     *
     * @param accessToken The access token to be used for creating the accounts request.
     * @return An instance of AccountsGetRequest class.
     */
    public AccountsGetRequest createAccountRequest(String accessToken) throws PlaidApiException {
        if(accessToken.isEmpty()){
            throw new PlaidApiException("No Access token found.");
        }
        //TODO: Implement testing for case when access token doesn't match access token being passed
        return new AccountsGetRequest()
                .accessToken(accessToken);
    }

    /**
     * Retrieves the accounts associated with a given user.
     *
     * @param userId The user ID.
     * @return The response containing the accounts for the user.
     */
    public AccountsGetResponse getAccountsForUser(Long userId) throws IOException {
        if(userId == null){
            throw new InvalidUserIDException("Invalid user ID.");
        }
        PlaidLinkEntity plaidLinkEntity = findPlaidLinkByUserId(userId);
        String accessToken = plaidLinkEntity.getAccessToken();
        AccountsGetRequest request = createAccountRequest(accessToken);
        Response<AccountsGetResponse> response = getAccountsForUserWithRetryResponse(request);
        return response.body();
    }

    /**
     * Retrieves the accounts associated with a given user using the provided AccountsGetRequest,
     * with an optional retry mechanism.
     *
     * @param accountsGetRequest The request object containing the necessary information to retrieve the accounts.
     * @return The response containing the accounts for the user.
     */
    public Response<AccountsGetResponse> getAccountsForUserWithRetryResponse(AccountsGetRequest accountsGetRequest) throws IOException {
        int attempts = 0;
        int MAX_ATTEMPTS = 3;
        Response<AccountsGetResponse> accountsResponse = null;
        do
        {
           Call<AccountsGetResponse> accountsGetResponseResponse = plaidApi.accountsGet(accountsGetRequest);
           accountsResponse = accountsGetResponseResponse.execute();
           try
           {
               if(accountsResponse.isSuccessful()){
                   break;
               }else{
                   attempts++;
                   Thread.sleep(500);
               }
           }catch(InterruptedException e)
           {
               LOGGER.error("There was a problem while trying to retrieve accounts from Plaid API.", e);
           }

        }while(attempts < MAX_ATTEMPTS);
        return accountsResponse;
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


    private PlaidLinkEntity findPlaidLinkByUserId(Long userId){
        if(userId == null){
            throw new InvalidUserIDException("Invalid user ID.");
        }
        Optional<PlaidLinkEntity> plaidLinkOptional = plaidLinkService.findPlaidLinkByUserID(userId);
        if(plaidLinkOptional.isEmpty()){
            throw new PlaidLinkException("No plaid link found for userID: " + userId);
        }
        return plaidLinkOptional.get();
    }



}
