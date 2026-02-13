package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.repositories.UserRepository;
import com.app.budgetbuddy.services.PlaidCategoryManager;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.app.budgetbuddy.services.PlaidLogoService;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.workbench.converter.TransactionDTOConverter;
import com.app.budgetbuddy.workbench.plaid.PlaidAccountManager;
import com.app.budgetbuddy.workbench.plaid.PlaidLinkTokenProcessor;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.app.budgetbuddy.workbench.runner.PlaidTransactionRunner;
import com.plaid.client.model.*;
import com.plaid.client.model.AccountType;
import com.plaid.client.model.Transaction;
import com.plaid.client.request.PlaidApi;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.CompletableFuture;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;


@WebMvcTest(value=PlaidController.class, excludeAutoConfiguration= SecurityAutoConfiguration.class)
class PlaidControllerTest {

    @MockBean
    private PlaidAccountManager plaidAccountManager;

    @MockBean
    private PlaidTransactionRunner plaidTransactionRunner;

    private ObjectMapper objectMapper = new ObjectMapper();

    @MockBean
    private PlaidLinkTokenProcessor plaidLinkTokenProcessor;

    @MockBean
    private PlaidLinkService plaidLinkService;

    @MockBean
    private PlaidCategoryManager plaidCategoryManager;

    @MockBean
    private UserRepository userRepository;

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testCreateLinkTokenWithNullUserId_thenReturnBadRequest() throws Exception
    {
        mockMvc.perform(post("/api/plaid/create_link_token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("null"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testCreateLinkTokenWithValidUserId_thenReturnCreated() throws Exception {

        LinkTokenCreateResponse linkTokenCreateResponse = new LinkTokenCreateResponse().linkToken("e2e2e2");
        when(plaidLinkTokenProcessor.createLinkToken("1")).thenReturn(CompletableFuture.completedFuture(linkTokenCreateResponse));

        mockMvc.perform(post("/api/plaid/create_link_token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":  1}"))
                .andExpect(status().isCreated());
    }

    @Test
    void testExchangePublicToken_whenExchangePublicTokenDTOIsNull_thenReturnBadRequest() throws Exception {
       String jsonString = objectMapper.writeValueAsString(null);
       mockMvc.perform(post("/api/plaid/exchange_public_token")
               .contentType(MediaType.APPLICATION_JSON)
               .content(jsonString))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testExchangePublicToken_whenExchangePublicTokenDTOIsNotNull_thenReturnOk() throws Exception {
        Map<Long, String> exchangePublicTokenMap = new HashMap<>();
        exchangePublicTokenMap.put(1L, "public_token");

        Long userID = 1L;
        String publicToken = "public_token";
        PlaidExchangeRequest exchangeRequest = new PlaidExchangeRequest(userID, publicToken);

        String jsonString = objectMapper.writeValueAsString(exchangeRequest);
        ItemPublicTokenExchangeResponse itemPublicTokenExchangeResponse = new ItemPublicTokenExchangeResponse().accessToken("access_token");
        when(plaidLinkTokenProcessor.exchangePublicToken("public_token")).thenReturn(CompletableFuture.completedFuture(itemPublicTokenExchangeResponse));

        mockMvc.perform(post("/api/plaid/exchange_public_token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonString))
                .andExpect(status().isOk());
    }


    @Test
    void testExchangePublicToken_whenExchangePublicTokeMapIsEmpty_thenReturnBadRequest() throws Exception {
        Map<Long, String> exchangePublicTokenMap = new HashMap<>();

        PlaidExchangeRequest plaidExchangeRequest = new PlaidExchangeRequest();
        String jsonString = objectMapper.writeValueAsString(plaidExchangeRequest);
        mockMvc.perform(post("/api/plaid/exchange_public_token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonString))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testExchangePublicToken_WhenValueNotFound_thenReturnBadRequest() throws Exception {

        Long userID = 1L;

        PlaidExchangeRequest plaidExchangeRequest = new PlaidExchangeRequest(userID, null);

        String jsonString = objectMapper.writeValueAsString(plaidExchangeRequest);

        mockMvc.perform(post("/api/plaid/exchange_public_token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonString))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testExchangePublicToken_whenAccessTokenEmpty_thenReturnNotFound() throws Exception {

        Long userID = 1L;
        String publicToken = "public_token";
        PlaidExchangeRequest plaidExchangeRequest = new PlaidExchangeRequest(userID, publicToken);

        ItemPublicTokenExchangeResponse itemPublicTokenExchangeResponse = new ItemPublicTokenExchangeResponse().accessToken("");
        when(plaidLinkTokenProcessor.exchangePublicToken("public_token")).thenReturn(CompletableFuture.completedFuture(itemPublicTokenExchangeResponse));

        String jsonString = objectMapper.writeValueAsString(plaidExchangeRequest);

        mockMvc.perform(post("/api/plaid/exchange_public_token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonString))
                .andExpect(status().isNotFound());
    }

    @Test
    void testExchangePublicToken_whenMapIsValid_thenReturnOk() throws Exception {
        Long userId = 1L;
        String publicToken = "public_token";
        PlaidExchangeRequest plaidExchangeRequest = new PlaidExchangeRequest(userId, publicToken);

        ItemPublicTokenExchangeResponse itemPublicTokenExchangeResponse = new ItemPublicTokenExchangeResponse().accessToken("access_token");
        when(plaidLinkTokenProcessor.exchangePublicToken("public_token")).thenReturn(CompletableFuture.completedFuture(itemPublicTokenExchangeResponse));

        String jsonString = objectMapper.writeValueAsString(plaidExchangeRequest);

        mockMvc.perform(post("/api/plaid/exchange_public_token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonString))
                .andExpect(status().isOk());

    }

    @Test
    void testSaveAccessToken_whenPlaidLinkRequestIsNull_thenReturnBadRequest() throws Exception {

        String jsonString = objectMapper.writeValueAsString(null);
        mockMvc.perform(post("/api/plaid/link")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonString))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSaveAccessToken_whenAccessTokenIsNullOrEmpty_thenReturnBadRequest() throws Exception {
        PlaidLinkRequest plaidLinkRequest = new PlaidLinkRequest("", "3232323232", "1L");

        String jsonString = objectMapper.writeValueAsString(plaidLinkRequest);

        mockMvc.perform(post("/api/plaid/link")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonString))
                .andExpect(status().isBadRequest());
    }


    @Test
    void testSaveAccessToken_whenPlaidLinkRequestValid_thenReturnStatusCreated() throws Exception {
        PlaidLinkRequest plaidLinkRequest = new PlaidLinkRequest("e23232320", "chhsdfsdfasdf", "1");
        when(plaidLinkService.createPlaidLink(anyString(), anyString(), anyString(), anyLong())).thenReturn(Optional.of(new PlaidLinkEntity()));

        String jsonString = objectMapper.writeValueAsString(plaidLinkRequest);

        mockMvc.perform(post("/api/plaid/link")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonString))
                .andExpect(status().isCreated());
    }

    @Test
    void testCheckPlaidLinkStatus_whenUserIdIsValid_thenReturnOk() throws Exception {
        Long userId = 1L;

        when(plaidLinkService.findPlaidLinkByUserID(userId)).thenReturn(Optional.of(createPlaidLink()));

        mockMvc.perform(get("/api/plaid/{userId}/plaid-link", userId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }


    @Test
    void testGetAllAccounts_whenUserIsIsInvalid_thenReturnBadRequest() throws Exception
    {
        Long userId = -1L;

        mockMvc.perform(get("/api/plaid/users/{userId}/accounts", userId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("UserId is invalid")));
    }

    @Test
    void testGetAllAccounts_whenUserIdIsValid_thenReturnOk() throws Exception
    {
        List<AccountBase> accountBaseList = new ArrayList<>();
        accountBaseList.add(testAccount());
        accountBaseList.add(testAccount());
        Long userId = 1L;

        UserEntity userEntity = new UserEntity();
        userEntity.setId(userId);

        AccountsGetResponse expectedResponse = new AccountsGetResponse();
        expectedResponse.setAccounts(accountBaseList);

        when(plaidAccountManager.getAccountsForUser(userId)).thenReturn(expectedResponse);
        when(userRepository.findById(userId)).thenReturn(Optional.of(userEntity));
        mockMvc.perform(get("/api/plaid/users/{userId}/accounts", userId)
                    .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void testGetAllAccounts_whenAccountResponseIsNull_thenReturnInternalServerError() throws Exception
    {
        Long userId = 1L;
        UserEntity userEntity = new UserEntity();
        userEntity.setId(userId);
        when(plaidAccountManager.getAccountsForUser(userId)).thenReturn(null);
        when(userRepository.findById(userId)).thenReturn(Optional.of(userEntity));
        mockMvc.perform(get("/api/plaid/users/{userId}/accounts", userId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testGetAllAccounts_whenAccountsListIsEmpty_thenReturnNotFound() throws Exception
    {
        Long userId = 1L;
        UserEntity userEntity = new UserEntity();
        userEntity.setId(userId);
        List<AccountBase> accountBaseList = new ArrayList<>();

        AccountsGetResponse expectedResponse = new AccountsGetResponse();
        expectedResponse.setAccounts(accountBaseList);
        when(plaidAccountManager.getAccountsForUser(userId)).thenReturn(expectedResponse);
        when(userRepository.findById(userId)).thenReturn(Optional.of(userEntity));
        mockMvc.perform(get("/api/plaid/users/{userId}/accounts", userId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void testGetTransactions_whenUserIdIsInvalid_thenThrowBadRequest() throws Exception {
        Long userId = -1L;
        LocalDate startDate = LocalDate.of(2024, 6, 1);
        LocalDate endDate = LocalDate.of(2024, 6, 5);
        mockMvc.perform(get("/api/plaid/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("userId", String.valueOf(userId))
                        .param("startDate", String.valueOf(startDate))
                        .param("endDate",String.valueOf(endDate)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetTransactions_WhenStartDateIsNull_thenThrowBadRequest() throws Exception {
        Long userId = 1L;
        LocalDate startDate = null;
        LocalDate endDate = LocalDate.of(2024, 6, 1);
        mockMvc.perform(get("/api/plaid/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .param("userId", String.valueOf(userId))
                .param("startDate", String.valueOf(startDate))
                .param("endDate", String.valueOf(endDate)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetTransactions_whenEndDateIsNull_thenThrowBadRequest() throws Exception {
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2024, 6, 1);
        LocalDate endDate = null;

        mockMvc.perform(get("/api/plaid/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .param("userId", String.valueOf(userId))
                .param("startDate", String.valueOf(startDate))
                .param("endDate", String.valueOf(endDate)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetTransactions_whenRequestParametersValid_thenReturnResponse() throws Exception {
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2024, 6, 1);
        LocalDate endDate = LocalDate.of(2024, 6, 5);
        UserEntity userEntity = new UserEntity();
        userEntity.setId(userId);

        TransactionsGetResponse transactionsGetResponse = new TransactionsGetResponse();

        List<com.app.budgetbuddy.domain.Transaction> transactions = new ArrayList<>();
        transactions.add(new com.app.budgetbuddy.domain.Transaction());
        when(userRepository.findById(userId)).thenReturn(Optional.of(userEntity));
        when(plaidTransactionRunner.getTransactionsResponse(userId, startDate, endDate)).thenReturn(transactions);

        mockMvc.perform(get("/api/plaid/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .param("userId", String.valueOf(userId))
                .param("startDate", String.valueOf(startDate))
                .param("endDate", String.valueOf(endDate)))
                .andExpect(status().isOk());
    }

    @Test
    void testGetRecurringTransactions_whenUserIdIsInvalid_thenReturnBadRequest() throws Exception {
        Long userId = -1L;

        mockMvc.perform(get("/api/plaid/users/{userId}/recurring-transactions", userId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetRecurringTransactions_whenUserIdIsValid_thenReturnOk() throws Exception {
        Long userId = 1L;
        TransactionsRecurringGetResponse expectedResponse = new TransactionsRecurringGetResponse();

        List<RecurringTransaction> recurringTransactions = new ArrayList<>();
        recurringTransactions.add(new RecurringTransaction());

        when(plaidTransactionRunner.getRecurringTransactionsResponse(userId)).thenReturn(recurringTransactions);
        mockMvc.perform(get("/api/plaid/users/{userId}/recurring-transactions", userId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void testSaveAccounts_whenAccountRequestIsNull_thenReturnBadRequest() throws Exception {
        String jsonString = objectMapper.writeValueAsString(null);
        mockMvc.perform(post("/api/plaid/save-accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonString))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSaveAccounts_whenAccountRequestHasInvalidUserId_thenReturnBadRequest() throws Exception {
        Long userId = -1L;
        List<PlaidAccount> accounts = new ArrayList<>();
        PlaidAccountRequest plaidAccountRequest = new PlaidAccountRequest(userId, accounts);
        String jsonString = objectMapper.writeValueAsString(plaidAccountRequest);

        mockMvc.perform(post("/api/plaid/save-accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonString))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSaveAccounts_whenAccountsListIsEmpty_thenReturnNotFound() throws Exception {
        Long userId = 1L;
        List<PlaidAccount> accounts = new ArrayList<>();
        PlaidAccountRequest plaidAccountRequest = new PlaidAccountRequest(userId, accounts);
        String jsonString = objectMapper.writeValueAsString(plaidAccountRequest);

        mockMvc.perform(post("/api/plaid/save-accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonString))
                .andExpect(status().isNotFound());
    }

    @Test
    void testSaveAccounts_whenPlaidAccountRequestIsValid_thenReturnOk() throws Exception {
        Long userId = 1L;
        List<PlaidAccount> accounts = new ArrayList<>();
        accounts.add(createPlaidAccount());
        accounts.add(createPlaidAccount());
        PlaidAccountRequest plaidAccountRequest = new PlaidAccountRequest(userId, accounts);
        String jsonString = objectMapper.writeValueAsString(plaidAccountRequest);

        mockMvc.perform(post("/api/plaid/save-accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonString))
                .andExpect(status().isOk());
    }

    @Test
    void testSyncTransactions_whenUserIdIsInvalid_thenReturnBadRequest() throws Exception {
        Long userId = -1L;
        mockMvc.perform(post("/api/plaid/transactions/{userId}/sync", userId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSyncTransactions_whenUserIdNotFound_thenReturnNotFound() throws Exception {
        Long userId = 1L;

        when(userRepository.findById(userId)).thenReturn(Optional.empty());
        mockMvc.perform(post("/api/plaid/transactions/{userId}/sync", userId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void testSyncTransactions_whenUserIdValid_thenReturnSyncedTransactions() throws Exception {
        Long userId = 1L;

        List<com.app.budgetbuddy.domain.Transaction> transactions = new ArrayList<>();
        transactions.add(new com.app.budgetbuddy.domain.Transaction());

        when(userRepository.existsById(userId)).thenReturn(true);
        when(plaidTransactionRunner.syncTransactions(userId)).thenReturn(transactions);
        mockMvc.perform(post("/api/plaid/transactions/{userId}/sync", userId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void testSyncTransactions_whenExceptionThrown_thenReturnInternalServerError() throws Exception {
        Long userId = 1L;
        when(userRepository.existsById(userId)).thenReturn(true);
        when(plaidTransactionRunner.syncTransactions(userId)).thenThrow(new IOException("Error"));
        mockMvc.perform(post("/api/plaid/transactions/{userId}/sync", userId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }

    private PlaidAccount createPlaidAccount(){
        PlaidAccount account = new PlaidAccount();
        account.setAccountId("e23232");
        account.setBalance(BigDecimal.TEN);
        account.setName("Test Account");
        account.setSubtype("checking");
        account.setType("DEPOSITORY");
        return account;
    }

    private TransactionDTO createTransactionDTO() {
        TransactionDTO transactionDTO = new TransactionDTO(
                "e11212",                          // accountId
                new BigDecimal("120.00"),          // amount
                "USD",                             // isoCurrencyCode
                List.of("Food", "Groceries"),      // categories
                "cat123",                          // categoryId
                LocalDate.now().toString(),                   // date
                "Supermarket XYZ",                 // merchantName
                "Grocery Purchase",                // name
                false,                             // pending
                "txn987654321",                    // transactionId
                LocalDate.now().minusDays(1).toString(),  // authorizedDate,
                "test.png"
                // transactionCode
        );
        return transactionDTO;
    }

    private AccountBase testAccount(){
        AccountBase accountBase = new AccountBase();
        accountBase.setName("Test Checking");
        accountBase.setBalances(createAccountBalance());
        accountBase.setAccountId("e23abs2");
        accountBase.setSubtype(AccountSubtype.CHECKING);
        accountBase.setType(AccountType.DEPOSITORY);
        return accountBase;
    }

    private AccountBalance createAccountBalance(){
        AccountBalance accountBalance = new AccountBalance();
        accountBalance.setCurrent(Double.valueOf(1200));
        accountBalance.setAvailable(Double.valueOf(1050));
        return accountBalance;
    }

    private PlaidLinkEntity createPlaidLink(){
        PlaidLinkEntity plaidLinkEntity = new PlaidLinkEntity();
        plaidLinkEntity.setItemId("234234234234");
        plaidLinkEntity.setAccessToken("access_token");
        plaidLinkEntity.setUser(createUserEntity());
        return plaidLinkEntity;
    }

    private UserEntity createUserEntity(){
        UserEntity userEntity = new UserEntity();
        userEntity.setFirstName("firstName");
        userEntity.setLastName("lastName");
        userEntity.setEmail("email");
        userEntity.setPassword("password");
        userEntity.setId(1L);
        return userEntity;
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



    @AfterEach
    void tearDown() {
    }
}