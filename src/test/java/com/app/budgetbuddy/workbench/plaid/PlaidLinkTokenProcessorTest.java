package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.PlaidApiException;
import com.app.budgetbuddy.exceptions.UserNotFoundException;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.app.budgetbuddy.services.UserService;
import com.plaid.client.model.*;
import com.plaid.client.request.PlaidApi;
import okhttp3.MediaType;
import okhttp3.ResponseBody;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import retrofit2.Call;
import retrofit2.Response;

import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlaidLinkTokenProcessorTest
{
    private PlaidLinkTokenProcessor plaidLinkTokenProcessor;

    @Mock
    private PlaidLinkService plaidLinkService;

    @Mock
    private UserService userService;

    @Mock
    private PlaidApi plaidApi;

    private Long userId = 1L;
    private UserEntity userEntity = UserEntity.builder()
            .id(userId)
            .build();


    @BeforeEach
    void setUp() {
        plaidLinkTokenProcessor = new PlaidLinkTokenProcessor(plaidLinkService, userService, plaidApi);
    }

    @Test
    void testCreateLinkTokenRequest_whenClientUserIdIsEmpty(){
        String clientUserId = "";
        assertThrows(IllegalArgumentException.class, () -> plaidLinkTokenProcessor.createLinkTokenRequest(clientUserId));
    }

    @Test
    void testCreateLinkTokenRequest_whenClientUserIdIsValid() throws IOException {
        String clientUserId = "1";
        LinkTokenCreateRequest request = new LinkTokenCreateRequest();
        request.setUser(new LinkTokenCreateRequestUser().clientUserId(clientUserId));

        LinkTokenCreateRequest actualRequest = plaidLinkTokenProcessor.createLinkTokenRequest(clientUserId);
        assertNotNull(actualRequest);
        assertEquals(clientUserId, actualRequest.getUser().getClientUserId());
        assertTrue(actualRequest.getProducts().containsAll(Arrays.asList(Products.TRANSACTIONS)));
        assertEquals(Arrays.asList(CountryCode.US), actualRequest.getCountryCodes());
    }

    @Test
    void testCreateLinkToken_whenClientUserIdIsEmpty(){
        String clientUserId = "";
        assertThrows(IllegalArgumentException.class, () -> plaidLinkTokenProcessor.createLinkToken(clientUserId));
    }

    @Test
    void testCreateLinkToken_whenUserIdNotFound_thenReturnNotFoundException() throws IOException
    {
        Long userId = 1L;
        String userIdStr = String.valueOf(userId);
        when(userService.findById(userId)).thenReturn(Optional.empty());
        CompletableFuture<LinkTokenCreateResponse> future = plaidLinkTokenProcessor.createLinkToken(userIdStr);

        CompletionException ex = assertThrows(CompletionException.class, () -> {
            future.join();
        });
        assertTrue(ex.getCause() instanceof UserNotFoundException);
        assertEquals("User with id " + userId + " not found.", ex.getCause().getMessage());
    }

    @Test
    void testCreateLinkToken_whenClientUserIdIsValid() throws IOException {

        when(userService.findById(userId)).thenReturn(Optional.of(userEntity));

        LinkTokenCreateRequest expectedRequest = buildLinkTokenRequest("1");
        LinkTokenCreateResponse expectedResponse = new LinkTokenCreateResponse().linkToken("test-link-token");

        Call<LinkTokenCreateResponse> mockCall = mock(Call.class);
        when(plaidApi.linkTokenCreate(any(LinkTokenCreateRequest.class))).thenReturn(mockCall);

        Response<LinkTokenCreateResponse> mockResponse = Response.success(expectedResponse);
        when(mockCall.execute()).thenReturn(mockResponse);

        CompletableFuture<LinkTokenCreateResponse> future = plaidLinkTokenProcessor.createLinkToken("1");
        LinkTokenCreateResponse linkTokenResponse = future.join();
        assertNotNull(linkTokenResponse);
        assertTrue(!future.isCompletedExceptionally());
        assertEquals("test-link-token", linkTokenResponse.getLinkToken());
    }

    @Test
    void testCreateLinkToken_whenInitialResponseFails_retryTwice_thenReturnLinkTokenResponse() throws IOException{
        when(userService.findById(userId)).thenReturn(Optional.of(userEntity));

        Call<LinkTokenCreateResponse> callFailed1 = mock(Call.class);
        Call<LinkTokenCreateResponse> callFailed2 = mock(Call.class);
        Call<LinkTokenCreateResponse> callSuccess = mock(Call.class);
        Response<LinkTokenCreateResponse> failResponse = mock(Response.class);
        Response<LinkTokenCreateResponse> successResponse = mock(Response.class);
        when(callFailed1.execute()).thenReturn(failResponse);
        when(callFailed2.execute()).thenReturn(failResponse);
        when(callSuccess.execute()).thenReturn(successResponse);

        LinkTokenCreateResponse expectedResponse = new LinkTokenCreateResponse()
                .linkToken("test-link-token");

        when(failResponse.isSuccessful()).thenReturn(false);
        when(successResponse.isSuccessful()).thenReturn(true);
        when(successResponse.body()).thenReturn(expectedResponse);

        when(plaidApi.linkTokenCreate(any(LinkTokenCreateRequest.class)))
                .thenReturn(callFailed1)
                .thenReturn(callFailed2)
                .thenReturn(callSuccess);

        CompletableFuture<LinkTokenCreateResponse> future = plaidLinkTokenProcessor.createLinkToken("1");
        LinkTokenCreateResponse linkTokenResponse = future.join();
        assertNotNull(linkTokenResponse);
        assertEquals("test-link-token", linkTokenResponse.getLinkToken());
        assertTrue(!future.isCompletedExceptionally());
        assertTrue(future.isDone());
    }

    @Test
    void testExchangePublicToken_whenPublicTokenIsEmpty(){
        String publicToken = "";
        assertThrows(IllegalArgumentException.class, () -> plaidLinkTokenProcessor.exchangePublicToken(publicToken));
    }


    @Test
    void testExchangePublicToken_whenPublicTokenIsValid() throws IOException, InterruptedException {
        String publicToken = "1";

        ItemPublicTokenExchangeResponse exchangeResponse = new ItemPublicTokenExchangeResponse().accessToken("test-access-token");
        Call<ItemPublicTokenExchangeResponse> mockCall = mock(Call.class);

        when(plaidApi.itemPublicTokenExchange(any(ItemPublicTokenExchangeRequest.class))).thenReturn(mockCall);
        Response<ItemPublicTokenExchangeResponse> mockResponse = Response.success(exchangeResponse);
        when(mockCall.execute()).thenReturn(mockResponse);

        CompletableFuture<ItemPublicTokenExchangeResponse> actual = plaidLinkTokenProcessor.exchangePublicToken(publicToken);
        ItemPublicTokenExchangeResponse aExchangeResponse = actual.join();
        assertNotNull(actual);
        assertTrue(!actual.isCompletedExceptionally());
        assertTrue(actual.isDone());
        assertEquals("test-access-token", aExchangeResponse.getAccessToken());
    }

    public LinkTokenCreateRequest buildLinkTokenRequest(String clientUserId)
    {
        return new LinkTokenCreateRequest()
                .user(new LinkTokenCreateRequestUser().clientUserId(clientUserId))
                .products(Arrays.asList(Products.AUTH, Products.TRANSACTIONS, Products.STATEMENTS, Products.RECURRING_TRANSACTIONS))
                .countryCodes(Arrays.asList(CountryCode.US))
                .language("en");
    }

    @AfterEach
    void tearDown() {
    }
}