package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.config.JpaConfig;
import com.app.budgetbuddy.domain.PlaidExchangeRequest;
import com.app.budgetbuddy.domain.PlaidLinkRequest;
import com.app.budgetbuddy.domain.TransactionDTO;
import com.app.budgetbuddy.domain.TransactionRequest;
import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.app.budgetbuddy.services.PlaidService;
import com.app.budgetbuddy.services.PlaidTransactionService;
import com.app.budgetbuddy.services.TransactionService;
import com.app.budgetbuddy.workbench.converter.TransactionDTOConverter;
import com.app.budgetbuddy.workbench.plaid.PlaidAccountManager;
import com.app.budgetbuddy.workbench.plaid.PlaidLinkTokenProcessor;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.plaid.client.model.*;
import com.plaid.client.request.PlaidApi;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.devtools.autoconfigure.OptionalLiveReloadServer;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

import static org.junit.jupiter.api.Assertions.*;


@WebMvcTest(value=PlaidController.class, excludeAutoConfiguration= SecurityAutoConfiguration.class)
@Testcontainers
class PlaidControllerTest {

    @Container
    static PostgreSQLContainer<?> postgreSQLContainer = new PostgreSQLContainer<>("postgres:13.2")
            .withDatabaseName("buddy")
            .withUsername("buddy")
            .withPassword("buddy");

    @MockBean
    private PlaidApi plaid;

    @MockBean
    private PlaidAccountManager plaidAccountManager;

    @MockBean
    private PlaidTransactionManager plaidTransactionManager;

    @MockBean
    private TransactionDTOConverter transactionDTOConverter;

    private ObjectMapper objectMapper = new ObjectMapper();

    @DynamicPropertySource
    static void registerPgProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgreSQLContainer::getJdbcUrl);
        registry.add("spring.datasource.password", postgreSQLContainer::getPassword);
        registry.add("spring.datasource.username", postgreSQLContainer::getUsername);
    }

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PlaidLinkTokenProcessor plaidLinkTokenProcessor;

    @MockBean
    private PlaidLinkService plaidLinkService;


    @BeforeEach
    void setUp() {
    }

    @Test
    void testCreateLinkTokenWithEmptyUserId_thenReturnBadRequest() throws Exception {

        String jsonString = objectMapper.writeValueAsString("");
        mockMvc.perform(post("/api/plaid/create_link_token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(""))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testCreateLinkTokenWithValidUserId_thenReturnCreated() throws Exception {

        LinkTokenCreateResponse linkTokenCreateResponse = new LinkTokenCreateResponse().linkToken("e2e2e2");
        when(plaidLinkTokenProcessor.createLinkToken("1")).thenReturn(linkTokenCreateResponse);

        mockMvc.perform(post("/api/plaid/create_link_token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("1"))
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
        when(plaidLinkTokenProcessor.exchangePublicToken("public_token")).thenReturn(itemPublicTokenExchangeResponse);

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
        when(plaidLinkTokenProcessor.exchangePublicToken("public_token")).thenReturn(itemPublicTokenExchangeResponse);

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
        when(plaidLinkTokenProcessor.exchangePublicToken("public_token")).thenReturn(itemPublicTokenExchangeResponse);

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
        when(plaidLinkService.createPlaidLink(anyString(), anyString(), anyLong())).thenReturn(Optional.of(new PlaidLinkEntity()));

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
    void testGetAllAccounts_whenUserIsIsInvalid_thenReturnBadRequest() throws Exception {
        Long userId = -1L;

        mockMvc.perform(get("/api/plaid/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .param("userId", String.valueOf(userId)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetAllAccounts_whenUserIdIsValid_thenReturnOk() throws Exception {
        List<AccountBase> accountBaseList = new ArrayList<>();
        accountBaseList.add(testAccount());
        accountBaseList.add(testAccount());
        Long userId = 1L;

        AccountsGetResponse expectedResponse = new AccountsGetResponse();
        expectedResponse.setAccounts(accountBaseList);

        when(plaidAccountManager.getAccountsForUser(userId)).thenReturn(expectedResponse);

        mockMvc.perform(get("/api/plaid/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .param("userId", String.valueOf(userId)))
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

        TransactionsGetResponse transactionsGetResponse = new TransactionsGetResponse();

        when(plaidTransactionManager.getTransactionsForUser(userId, startDate, endDate)).thenReturn(transactionsGetResponse);

        mockMvc.perform(get("/api/plaid/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .param("userId", String.valueOf(userId))
                .param("startDate", String.valueOf(startDate))
                .param("endDate", String.valueOf(endDate)))
                .andExpect(status().isOk());
    }

    @Test
    void testSaveTransactions_whenTransactionRequestIsNull_thenReturnBadRequest() throws Exception {

        String jsonString = objectMapper.writeValueAsString(null);
        mockMvc.perform(post("/api/plaid/save-transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonString))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSaveTransactions_whenTransactionRequestIsValid_thenReturnOk() throws Exception {
        List<TransactionDTO> transactionList = new ArrayList<>();
        transactionList.add(createTransactionDTO());
        transactionList.add(createTransactionDTO());

        TransactionRequest transactionRequest = new TransactionRequest(transactionList);
        String jsonString = objectMapper.writeValueAsString(transactionRequest);
        mockMvc.perform(post("/api/plaid/save-transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonString))
                .andExpect(status().isOk());
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
                "Weekly grocery shopping",         // description
                "Grocery Purchase",                // name
                false,                             // pending
                "txn987654321",                    // transactionId
                LocalDate.now().minusDays(1).toString(),      // authorizedDate
                TransactionCode.PURCHASE           // transactionCode
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