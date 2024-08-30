package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.exceptions.InvalidAccessTokenException;
import com.app.budgetbuddy.exceptions.InvalidStartDateException;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.plaid.client.model.Transaction;
import com.plaid.client.model.TransactionCode;
import com.plaid.client.model.TransactionsGetRequest;
import com.plaid.client.model.TransactionsGetResponse;
import com.plaid.client.request.PlaidApi;
import okhttp3.MediaType;
import okhttp3.ResponseBody;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import retrofit2.Call;
import retrofit2.Response;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlaidTransactionManagerTest {

    @InjectMocks
    private PlaidTransactionManager transactionManager;

    @Mock
    private PlaidLinkService plaidLinkService;

    @Mock
    private PlaidApi plaidApi;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testCreateTransactionRequest_whenAccessTokenIsEmpty(){
        String accessToken = "";
        LocalDate startDate = LocalDate.of(2024, 6, 1);
        LocalDate endDate = LocalDate.of(2024, 6, 2);
        assertThrows(InvalidAccessTokenException.class, () -> {
            transactionManager.createTransactionRequest(accessToken, startDate, endDate);
        });
    }

    @Test
    void testCreateTransactionRequest_whenStartDateIsNull(){
        String accessToken = "access_token";
        LocalDate startDate = null;
        LocalDate endDate = LocalDate.of(2024, 6, 5);

        assertThrows(IllegalDateException.class, () -> {
            transactionManager.createTransactionRequest(accessToken, startDate, endDate);
        });
    }

    @Test
    void testCreateTransactionRequest_whenEndDateIsNull(){
        String accessToken = "access_token";
        LocalDate startDate = LocalDate.of(2024, 6, 1);
        LocalDate endDate = null;

        assertThrows(IllegalDateException.class, () -> {
            transactionManager.createTransactionRequest(accessToken, startDate, endDate);
        });
    }

    @Test
    void testCreateTransactionRequest_whenEndDateIsBeforeStartDate(){
        LocalDate startDate = LocalDate.of(2024, 6, 5);
        LocalDate endDate = LocalDate.of(2024, 6, 1);
        String accessToken = "access_token";

        TransactionsGetRequest expectedRequest = new TransactionsGetRequest().accessToken(accessToken)
                .startDate(LocalDate.of(2024, 6,1))
                .endDate(LocalDate.of(2024, 6,5));

        TransactionsGetRequest actual = transactionManager.createTransactionRequest(accessToken, startDate, endDate);
        assertNotNull(actual);
        assertEquals(expectedRequest.getAccessToken(), actual.getAccessToken());
        assertEquals(expectedRequest.getStartDate(), actual.getStartDate());
        assertEquals(expectedRequest.getEndDate(), actual.getEndDate());

    }

    @Test
    void testCreateTransactionRequest_whenAccessTokenIsValid() throws IOException {
        String accessToken = "access_token";
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2024, 6, 1);
        LocalDate endDate = LocalDate.of(2024, 6, 6);
        TransactionsGetRequest transactionsGetRequest = new TransactionsGetRequest().accessToken(accessToken)
                .startDate(startDate)
                .endDate(endDate);

        TransactionsGetRequest actual = transactionManager.createTransactionRequest(accessToken, startDate, endDate);
        assertNotNull(actual);
        assertEquals(transactionsGetRequest.getAccessToken(), actual.getAccessToken());
        assertEquals(transactionsGetRequest.getStartDate(), actual.getStartDate());
        assertEquals(transactionsGetRequest.getEndDate(), actual.getEndDate());
    }

    @Test
    void testGetTransactionsForUser_whenUserIdIsValid() throws IOException {
        String accessToken = "access_token";
        List<Transaction> transactions = new ArrayList<>();
        transactions.add(createTransaction());
        transactions.add(createTransaction());
        LocalDate startDate = LocalDate.of(2024, 6, 1);
        LocalDate endDate = LocalDate.of(2024, 6, 5);
        Long userId = 1L;

        TransactionsGetRequest transactionsGetRequest = new TransactionsGetRequest().accessToken(accessToken)
                .startDate(startDate)
                .endDate(endDate);

        TransactionsGetResponse expectedResponse = new TransactionsGetResponse();
        expectedResponse.setTransactions(transactions);

        when(plaidLinkService.findPlaidLinkByUserID(userId)).thenReturn(Optional.of(createPlaidLinkEntity()));

        Call<TransactionsGetResponse> callSuccessful = mock(Call.class);
        when(callSuccessful.execute()).thenReturn(Response.success(expectedResponse));
        when(plaidApi.transactionsGet(transactionsGetRequest)).thenReturn(callSuccessful);

        TransactionsGetResponse actualResponse = transactionManager.getTransactionsForUser(userId, startDate, endDate);
        assertNotNull(actualResponse);
        assertEquals(expectedResponse.getTransactions(), actualResponse.getTransactions());
        assertEquals(expectedResponse.getTotalTransactions(), actualResponse.getTotalTransactions());
    }

    @Test
    void testGetTransactionsResponseWithRetry_whenTransactionGetRequestIsNull(){
        assertThrows(IllegalArgumentException.class, () -> {
            transactionManager.getTransactionsResponseWithRetry(null);
        });
    }

    @Test
    void testGetTransactionsResponseWithRetry_whenResponseFailsThenSuccessful_ThenReturnResponse() throws IOException {
        String accessToken = "access_token";
        List<Transaction> transactions = new ArrayList<>();
        transactions.add(createTransaction());
        transactions.add(createTransaction());
        LocalDate startDate = LocalDate.of(2024, 6, 1);
        LocalDate endDate = LocalDate.of(2024, 6, 5);
        Long userId = 1L;

        TransactionsGetRequest transactionsGetRequest = new TransactionsGetRequest().accessToken(accessToken)
                .startDate(startDate)
                .endDate(endDate);

        Call<TransactionsGetResponse> callUnsuccessful = mock(Call.class);
        when(callUnsuccessful.execute()).thenReturn(Response.error(500, ResponseBody.create(MediaType.parse("application/json"), "Error")));

        TransactionsGetResponse expectedResponse = new TransactionsGetResponse();
        Call<TransactionsGetResponse> callSuccessful = mock(Call.class);
        when(callSuccessful.execute()).thenReturn(Response.success(expectedResponse));

        when(plaidApi.transactionsGet(transactionsGetRequest)).thenReturn(callUnsuccessful, callSuccessful);
        Response<TransactionsGetResponse> actualResponse = transactionManager.getTransactionsResponseWithRetry(transactionsGetRequest);
        assertNotNull(actualResponse);
        assertEquals(expectedResponse.getTransactions(), actualResponse.body().getTransactions());
        assertEquals(expectedResponse.getTotalTransactions(), actualResponse.body().getTotalTransactions());
    }



    @AfterEach
    void tearDown() {
    }

    private Transaction createTransaction(){
        Transaction transaction = new Transaction();
        transaction.setName("Test Transaction");
        transaction.setMerchantName("Test Merchant Name");
        transaction.setTransactionId("transactionId");
        transaction.setPending(false);
        transaction.setDate(LocalDate.now());
        transaction.setAccountId("accountId");
        transaction.setTransactionCode(TransactionCode.CASH);
        transaction.setAmount(Double.valueOf(120));
        return transaction;
    }

    private PlaidLinkEntity createPlaidLinkEntity(){
        PlaidLinkEntity plaidLinkEntity = new PlaidLinkEntity();
        plaidLinkEntity.setId(1L);
        plaidLinkEntity.setAccessToken("access_token");
        plaidLinkEntity.setUser(createUserEntity());
        return plaidLinkEntity;
    }

    private UserEntity createUserEntity(){
        UserEntity userEntity = new UserEntity();
        userEntity.setEmail("email@email.com");
        userEntity.setPassword("password");
        userEntity.setFirstName("firstName");
        userEntity.setLastName("lastName");
        return userEntity;
    }

}