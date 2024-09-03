package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.domain.PlaidAccount;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.*;
import com.app.budgetbuddy.repositories.UserRepository;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.app.budgetbuddy.workbench.converter.AccountBaseConverter;
import com.plaid.client.model.AccountBase;
import com.plaid.client.model.AccountsGetRequest;
import com.plaid.client.model.AccountsGetResponse;
import com.plaid.client.request.PlaidApi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.annotation.AccessType;
import org.springframework.stereotype.Service;
import retrofit2.Call;
import retrofit2.Response;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class PlaidAccountManager extends AbstractPlaidManager
{
    private Logger LOGGER = LoggerFactory.getLogger(PlaidAccountManager.class);
    private AccountBaseConverter accountBaseConverter;
    private UserRepository userRepository;

    @Autowired
    public PlaidAccountManager(PlaidLinkService plaidLinkService, @Qualifier("plaid") PlaidApi plaidApi,
                               AccountBaseConverter accountBaseConverter,
                               UserRepository userRepository) {
        super(plaidLinkService, plaidApi);
        this.accountBaseConverter = accountBaseConverter;
        this.userRepository = userRepository;
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

    public List<AccountEntity> savePlaidAccountsToDatabase(List<AccountBase> accounts, Long userId) throws PlaidApiException {
        if(accounts.isEmpty()){
            throw new AccountsNotFoundException("No accounts found.");
        }
        Optional<UserEntity> user = userRepository.findById(userId);
        if(user.isEmpty()){
            throw new UserNotFoundException("User not found.");
        }
        UserEntity userEntity = user.get();
        List<AccountEntity> accountEntities = new ArrayList<>();
        for(AccountBase account : accounts){
            if(account != null){
                AccountEntity accountEntity = accountBaseConverter.convert(account, userEntity);
                accountEntities.add(accountEntity);
            }
        }
        return accountEntities;
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
