package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.exceptions.PlaidApiException;
import com.app.budgetbuddy.exceptions.PlaidLinkException;
import com.app.budgetbuddy.exceptions.UserNotFoundException;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.app.budgetbuddy.services.UserService;
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
import java.util.Optional;
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
    public PlaidLinkTokenProcessor(PlaidLinkService plaidLinkService, UserService userService, @Qualifier("plaid") PlaidApi plaidApi)
    {
        super(plaidLinkService, userService, plaidApi);
    }

    private DepositoryFilter createDepositoryFilter()
    {
        return new DepositoryFilter()
                .accountSubtypes(Arrays.asList(
                        DepositoryAccountSubtype.CHECKING,
                        DepositoryAccountSubtype.SAVINGS,
                        DepositoryAccountSubtype.MONEY_MARKET
                ));
    }

    private LinkTokenTransactions createLinkTokenTransactions()
    {
        return new LinkTokenTransactions()
                .daysRequested(730);
    }

    private LinkTokenAccountFilters createAccountFilters(DepositoryFilter depositoryFilter)
    {
        return new LinkTokenAccountFilters()
                .depository(depositoryFilter);
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
        DepositoryFilter depository = createDepositoryFilter();
        LinkTokenTransactions transactions = createLinkTokenTransactions();
        LinkTokenAccountFilters accountFilters = createAccountFilters(depository);
        return new LinkTokenCreateRequest()
                .user(new LinkTokenCreateRequestUser().clientUserId(clientUserId))
                .clientName("BudgetBuddy")
                .products(Arrays.asList(Products.TRANSACTIONS))
                .countryCodes(Arrays.asList(CountryCode.US))
                .transactions(transactions)
                .accountFilters(accountFilters)
                .redirectUri(redirectUri)
                .language("en");
    }

    /**
     * Fetches institution information using the access token
     */
    @Async("taskExecutor")
    public CompletableFuture<String> getInstitutionName(String accessToken) throws IOException {
        if (accessToken == null || accessToken.isEmpty()) {
            throw new IllegalArgumentException("Access token cannot be empty");
        }

        try {
            // First, get the item to retrieve institution_id
            ItemGetRequest itemGetRequest = new ItemGetRequest().accessToken(accessToken);
            Response<ItemGetResponse> itemResponse = plaidApi.itemGet(itemGetRequest).execute();

            if (!itemResponse.isSuccessful() || itemResponse.body() == null) {
                String errorBody = itemResponse.errorBody() != null ? itemResponse.errorBody().string() : "No error body";
                return CompletableFuture.failedFuture(new PlaidApiException("Failed to get item: " + errorBody));
            }

            String institutionId = itemResponse.body().getItem().getInstitutionId();

            // Then get institution details
            InstitutionsGetByIdRequest institutionRequest = new InstitutionsGetByIdRequest()
                    .institutionId(institutionId)
                    .countryCodes(Arrays.asList(CountryCode.US));

            Response<InstitutionsGetByIdResponse> institutionResponse = plaidApi.institutionsGetById(institutionRequest).execute();

            if (!institutionResponse.isSuccessful() || institutionResponse.body() == null) {
                String errorBody = institutionResponse.errorBody() != null ? institutionResponse.errorBody().string() : "No error body";
                return CompletableFuture.failedFuture(new PlaidApiException("Failed to get institution: " + errorBody));
            }

            String institutionName = institutionResponse.body().getInstitution().getName();
            return CompletableFuture.completedFuture(institutionName);

        } catch (Exception e) {
            return CompletableFuture.failedFuture(new PlaidApiException("Error fetching institution name: " + e.getMessage()));
        }
    }

    /**
     * Creates a link token.
     *
     * @param clientUserId the ID of the client user
     * @return the created link token response
     */
    @Async("taskExecutor")
    public CompletableFuture<LinkTokenCreateResponse> createLinkToken(String clientUserId) throws IOException
    {
        if(clientUserId.isEmpty())
        {
            throw new IllegalArgumentException("Client user id cannot be empty");
        }
        Long userId = Long.valueOf(clientUserId);
        Optional<UserEntity> userOptional = userService.findById(userId);
        if(userOptional.isEmpty())
        {
            return CompletableFuture.failedFuture(new UserNotFoundException("User with id " + userId + " not found."));
        }
        LinkTokenCreateRequest linkTokenCreateRequest = createLinkTokenRequest(clientUserId);
        Response<LinkTokenCreateResponse> linkTokenResponse = plaidApi.linkTokenCreate(linkTokenCreateRequest).execute();
        if(linkTokenResponse.isSuccessful() && linkTokenResponse.body() != null)
        {
            return CompletableFuture.completedFuture(linkTokenResponse.body());
        }
        else
        {
            String errorBody = linkTokenResponse.errorBody() != null ? linkTokenResponse.errorBody().string() : "No error body";
            return CompletableFuture.failedFuture(new PlaidLinkException("Plaid Link token creation failed: " + errorBody));
        }
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
    public CompletableFuture<ItemPublicTokenExchangeResponse> exchangePublicToken(String publicToken) throws IOException
    {
        if(publicToken.isEmpty())
        {
            throw new IllegalArgumentException("Public token cannot be empty");
        }
        ItemPublicTokenExchangeRequest itemPublicTokenExchangeRequest = createPublicTokenExchangeRequest(publicToken);
        Response<ItemPublicTokenExchangeResponse> response = plaidApi.itemPublicTokenExchange(itemPublicTokenExchangeRequest).execute();
        if(response.isSuccessful())
        {
            return CompletableFuture.completedFuture(response.body());
        }
        return CompletableFuture.failedFuture(new RuntimeException("There was an error exchanging the public token."));
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
