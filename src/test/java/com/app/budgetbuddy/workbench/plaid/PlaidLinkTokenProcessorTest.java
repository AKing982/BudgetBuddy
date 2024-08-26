package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.services.PlaidLinkService;
import com.plaid.client.model.*;
import com.plaid.client.request.PlaidApi;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

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
    }

    @Test
    void testCreateLinkTokenRequest_whenClientUserIdIsEmpty(){
        String clientUserId = "";
        assertThrows(IllegalArgumentException.class, () -> plaidLinkTokenProcessor.createLinkTokenRequest(clientUserId));
    }

    @Test
    void testCreateLinkTokenRequest_whenClientUserIdIsValid(){
        String clientUserId = "1";
        LinkTokenCreateRequest request = new LinkTokenCreateRequest();
        request.setUser(new LinkTokenCreateRequestUser().clientUserId(clientUserId));

        LinkTokenCreateRequest actualRequest = plaidLinkTokenProcessor.createLinkTokenRequest(clientUserId);
        assertNotNull(actualRequest);
    }

    @Test
    void testCreateLinkToken_whenClientUserIdIsEmpty(){
        String clientUserId = "";
        assertThrows(IllegalArgumentException.class, () -> plaidLinkTokenProcessor.createLinkToken(clientUserId));
    }

    @Test
    void testCreateLinkToken_whenClientUserIdIsValid(){
        LinkTokenCreateRequest request = buildLinkTokenRequest("1");

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