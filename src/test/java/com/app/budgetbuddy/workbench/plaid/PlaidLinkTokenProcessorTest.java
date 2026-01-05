package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.exceptions.PlaidApiException;
import com.app.budgetbuddy.services.PlaidLinkService;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlaidLinkTokenProcessorTest {

    @InjectMocks
    private PlaidLinkTokenProcessor plaidLinkTokenProcessor;

    @Mock
    private PlaidLinkService plaidLinkService;

    @Mock
    private PlaidApi plaidApi;

    @BeforeEach
    void setUp() {
        plaidLinkTokenProcessor = new PlaidLinkTokenProcessor(plaidLinkService, plaidApi);
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
        assertTrue(actualRequest.getProducts().containsAll(Arrays.asList(Products.AUTH, Products.TRANSACTIONS)));
        assertEquals(Arrays.asList(CountryCode.US), actualRequest.getCountryCodes());
    }

    @Test
    void testCreateLinkToken_whenClientUserIdIsEmpty(){
        String clientUserId = "";
        assertThrows(IllegalArgumentException.class, () -> plaidLinkTokenProcessor.createLinkToken(clientUserId));
    }

    @Test
    void testCreateLinkToken_whenClientUserIdIsValid() throws IOException {
        LinkTokenCreateRequest expectedRequest = buildLinkTokenRequest("1");
        LinkTokenCreateResponse expectedResponse = new LinkTokenCreateResponse().linkToken("test-link-token");

        Call<LinkTokenCreateResponse> mockCall = mock(Call.class);
        when(plaidApi.linkTokenCreate(any(LinkTokenCreateRequest.class))).thenReturn(mockCall);

        Response<LinkTokenCreateResponse> mockResponse = Response.success(expectedResponse);
        when(mockCall.execute()).thenReturn(mockResponse);

        LinkTokenCreateResponse actualResponse = plaidLinkTokenProcessor.createLinkToken("1");
        assertNotNull(actualResponse);
        assertEquals("test-link-token", actualResponse.getLinkToken());

    }

    @Test
    void testCreateLinkTokenWithRetry_whenLinkTokenCreateRequestIsNull_thenThrowException(){
        assertThrows(PlaidApiException.class, () -> plaidLinkTokenProcessor.createLinkTokenWithRetry(null));
    }

    @Test
    void testCreateLinkTokenWithRetry_whenRequestIsValid_thenReturnResponse() throws IOException {
        LinkTokenCreateRequest linkTokenCreateRequest = buildLinkTokenRequest("1");
        LinkTokenCreateResponse expectedResponse = new LinkTokenCreateResponse().linkToken("test-link-token");
        Call<LinkTokenCreateResponse> mockCall = mock(Call.class);
        when(mockCall.execute()).thenReturn(Response.success(expectedResponse));
        when(plaidApi.linkTokenCreate(linkTokenCreateRequest)).thenReturn(mockCall);

        Response<LinkTokenCreateResponse> actualResponse = plaidLinkTokenProcessor.createLinkTokenWithRetry(linkTokenCreateRequest);
        assertNotNull(actualResponse);
        assertEquals(expectedResponse.getLinkToken(), actualResponse.body().getLinkToken());
    }

    @Test
    void testCreateLinkTokenWithRetry_whenRetryTwoAttempts_ThenReturnResponseBody() throws IOException
    {
        LinkTokenCreateRequest linkTokenCreateRequest = buildLinkTokenRequest("1");
        LinkTokenCreateResponse expectedResponse = new LinkTokenCreateResponse().linkToken("test-link-token");

        Call<LinkTokenCreateResponse> callUnsuccessful = mock(Call.class);
        when(callUnsuccessful.execute()).thenReturn(Response.error(500, ResponseBody.create(MediaType.parse("application/json"), "Internal Server Error")));

        Call<LinkTokenCreateResponse> callSuccessful = mock(Call.class);
        when(callSuccessful.execute()).thenReturn(Response.success(expectedResponse));

        when(plaidApi.linkTokenCreate(linkTokenCreateRequest)).thenReturn(callUnsuccessful, callSuccessful);
        Response<LinkTokenCreateResponse> actualResponse = plaidLinkTokenProcessor.createLinkTokenWithRetry(linkTokenCreateRequest);
        assertNotNull(actualResponse);
        assertEquals(expectedResponse.getLinkToken(), actualResponse.body().getLinkToken());
    }

    @Test
    void testItemPublicExchangeTokenRequest_whenPublicTokenIsEmpty(){
        String publicToken = "";
        assertThrows(IllegalArgumentException.class, () -> plaidLinkTokenProcessor.createPublicTokenExchangeRequest(publicToken));
    }

    @Test
    void testItemPublicExchangeTokenRequest_whenPublicTokenIsValid(){
        String publicToken = "1";
        ItemPublicTokenExchangeRequest itemPublicTokenExchangeRequest = new ItemPublicTokenExchangeRequest().publicToken(publicToken);
        ItemPublicTokenExchangeRequest actual = plaidLinkTokenProcessor.createPublicTokenExchangeRequest(publicToken);
        assertNotNull(actual);
        assertEquals(publicToken, actual.getPublicToken());
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

        ItemPublicTokenExchangeResponse actual = plaidLinkTokenProcessor.exchangePublicToken(publicToken);
        assertNotNull(actual);
        assertEquals("test-access-token", actual.getAccessToken());
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