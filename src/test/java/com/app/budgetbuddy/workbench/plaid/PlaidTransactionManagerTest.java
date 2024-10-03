package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.domain.AccountType;
import com.app.budgetbuddy.entities.*;
import com.app.budgetbuddy.exceptions.*;
import com.app.budgetbuddy.services.AccountService;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.services.TransactionService;
import com.app.budgetbuddy.workbench.converter.RecurringTransactionConverter;
import com.app.budgetbuddy.workbench.converter.TransactionConverter;
import com.plaid.client.model.*;
import com.plaid.client.request.PlaidApi;
import okhttp3.MediaType;
import okhttp3.ResponseBody;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.testcontainers.shaded.org.apache.commons.lang3.ObjectUtils;
import retrofit2.Call;
import retrofit2.Response;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlaidTransactionManagerTest {

    @InjectMocks
    private PlaidTransactionManager transactionManager;

    @Mock
    private PlaidLinkService plaidLinkService;

    @Mock
    private PlaidApi plaidApi;

    @Mock
    private TransactionService transactionService;

    @Mock
    private TransactionConverter transactionConverter;

    @Mock
    private RecurringTransactionConverter recurringTransactionConverter;

    @Mock
    private RecurringTransactionService recurringTransactionService;

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
        List<PlaidTransaction> transactions = new ArrayList<>();
        transactions.add(createTransaction());
        transactions.add(createTransaction());
        LocalDate startDate = LocalDate.of(2024, 6, 1);
        LocalDate endDate = LocalDate.of(2024, 6, 5);
        Long userId = 1L;

        TransactionsGetRequest transactionsGetRequest = new TransactionsGetRequest().accessToken(accessToken)
                .startDate(startDate)
                .endDate(endDate);

        TransactionsGetResponse expectedResponse = new TransactionsGetResponse();

        when(plaidLinkService.findPlaidLinkByUserID(userId)).thenReturn(Optional.of(createPlaidLinkEntity()));

        Call<TransactionsGetResponse> callSuccessful = mock(Call.class);
        when(callSuccessful.execute()).thenReturn(Response.success(expectedResponse));
        when(plaidApi.transactionsGet(transactionsGetRequest)).thenReturn(callSuccessful);

        TransactionsGetResponse actualResponse = transactionManager.getTransactionsForUser(userId, startDate, endDate);
        assertNotNull(actualResponse);
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
        List<PlaidTransaction> transactions = new ArrayList<>();
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

    @Test
    void testSaveTransactionToDatabase_whenTransactionListIsEmpty(){
        List<PlaidTransaction> transactions = new ArrayList<>();
        assertThrows(TransactionsNotFoundException.class, () -> {
            transactionManager.saveTransactionsToDatabase(transactions);
        });
    }

    @Test
    void testSaveTransactionToDatabase_whenTransactionElementNullThenSkipAndSaveTransaction() {
        List<PlaidTransaction> transactions = new ArrayList<>();
        transactions.add(null);
        transactions.add(createTransaction());

        List<TransactionsEntity> expected = Arrays.asList(createTransactionEntity());
        when(transactionConverter.convert(createTransaction())).thenReturn(createTransactionEntity());
        doNothing().when(transactionService).save(createTransactionEntity());
        List<TransactionsEntity> actual = transactionManager.saveTransactionsToDatabase(transactions);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for(int i = 0; i < actual.size(); i++){
            assertEquals(expected.get(i).getId(), actual.get(i).getId());
            assertEquals(expected.get(i).getAccount().getId(), actual.get(i).getAccount().getId());
//            assertEquals(expected.get(i).getCategoryId(), actual.get(i).getCategoryId());
            assertEquals(expected.get(i).getAuthorizedDate(), actual.get(i).getAuthorizedDate());
            assertEquals(expected.get(i).isPending(), actual.get(i).isPending());
            assertEquals(expected.get(i).getDescription(), actual.get(i).getDescription());
            assertEquals(expected.get(i).getAmount(), actual.get(i).getAmount());
//            assertEquals(expected.get(i).getCategories(), actual.get(i).getCategories());
            assertEquals(expected.get(i).getPosted(), actual.get(i).getPosted());
        }

    }

    @ParameterizedTest
    @MethodSource("provideNullParameters")
    void testSaveTransactionToDatabase_whenTransactionParametersAreNull(String transactionId, AccountEntity account, String description,
                                                                        BigDecimal amount, Boolean isPending, List<String> categories, String categoryId, LocalDate authorizedDate, Class<? extends Exception> expectedException){
        List<PlaidTransaction> transactions = new ArrayList<>();
        transactions.add(createTransaction());
        transactions.add(createTransaction());

        List<TransactionsEntity> transactionsEntities = new ArrayList<>();
        TransactionsEntity transactionsEntity = createTransaction(transactionId, account, description, amount, isPending, categories, categoryId, authorizedDate);
        transactionsEntities.add(transactionsEntity);
        assertThrows(expectedException, () -> {
            transactionManager.saveTransactionsToDatabase(transactions);
        });

    }

    @Test
    void testGetRecurringTransactionsForUser_whenUserIdNotValid_thenThrowException(){
        Long userId = -1L;
        assertThrows(InvalidUserIDException.class, () -> {
            transactionManager.getRecurringTransactionsForUser(userId);
        });
    }

    @Test
    void testGetRecurringTransactionsForUser_whenUserIdValid() throws IOException {
        Long userId = 1L;
        when(plaidLinkService.findPlaidLinkByUserID(userId)).thenReturn(Optional.of(createPlaidLinkEntity()));
        TransactionsRecurringGetRequestOptions options = new TransactionsRecurringGetRequestOptions()
                .includePersonalFinanceCategory(true);

        TransactionsRecurringGetRequest transactionsRecurringGetRequest = new TransactionsRecurringGetRequest()
                .accessToken("access_token")
                .options(options);

        TransactionsRecurringGetResponse expectedResponse = new TransactionsRecurringGetResponse();
        expectedResponse.setInflowStreams(Collections.singletonList(createTransactionStream()));
        expectedResponse.setOutflowStreams(Collections.singletonList(createTransactionStream()));

        Call<TransactionsRecurringGetResponse> callSuccessful = mock(Call.class);
        Response<TransactionsRecurringGetResponse> response = Response.success(expectedResponse);

        when(plaidApi.transactionsRecurringGet(transactionsRecurringGetRequest)).thenReturn(callSuccessful);
        when(callSuccessful.execute()).thenReturn(response);

        TransactionsRecurringGetResponse actual = transactionManager.getRecurringTransactionsForUser(userId);
        assertNotNull(actual);
        assertEquals(expectedResponse.getInflowStreams(), actual.getInflowStreams());
        assertEquals(expectedResponse.getOutflowStreams(), actual.getOutflowStreams());
        verify(plaidLinkService, times(1)).findPlaidLinkByUserID(userId);
        verify(plaidApi).transactionsRecurringGet(transactionsRecurringGetRequest);
    }

    @Test
    void testSaveRecurringTransactions_whenRecurringTransactionsListIsEmpty_thenReturnEmptyList() throws IOException {
        List<RecurringTransactionDTO> transactions = new ArrayList<>();
        List<RecurringTransactionEntity> actual = transactionManager.saveRecurringTransactions(transactions);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testSaveRecurringTransactions_whenRecurringTransactionsListIsNull_thenReturnEmptyList() throws IOException {
        List<RecurringTransactionDTO> transactions = null;
        List<RecurringTransactionEntity> actual = transactionManager.saveRecurringTransactions(transactions);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testSaveRecurringTransactions_whenRecurringTransactionsListIsValid_thenReturnEntityList() throws IOException {
        List<RecurringTransactionDTO> transactions = new ArrayList<>();
        transactions.add(createRecurringTransaction());

        List<RecurringTransactionEntity> expectedEntityList = new ArrayList<>();
        expectedEntityList.add(createRecurringTransactionEntity());

        when(recurringTransactionConverter.convert(createRecurringTransaction())).thenReturn(createRecurringTransactionEntity());
        lenient().doNothing().when(recurringTransactionService).save(createRecurringTransactionEntity());
        List<RecurringTransactionEntity> actual = transactionManager.saveRecurringTransactions(transactions);
        assertNotNull(actual);
        assertEquals(expectedEntityList.size(), actual.size());

    }

    private RecurringTransactionEntity createRecurringTransactionEntity(){
        RecurringTransactionEntity recurringTransaction = new RecurringTransactionEntity();
        recurringTransaction.setAccount(AccountEntity.builder().id("ACC123").build());
        recurringTransaction.setActive(true);
        recurringTransaction.setStreamId("STREAM456");
        recurringTransaction.setType(RecurringTransactionType.INFLOW_STREAM);
        recurringTransaction.setAverageAmount(BigDecimal.ONE);
        recurringTransaction.setMerchantName("Netflix");
        recurringTransaction.setFrequency("MONTHLY");
        recurringTransaction.setDescription("Monthly Subscription");
        recurringTransaction.setFirstDate(LocalDate.parse("2023-01-01"));
        recurringTransaction.setLastDate(LocalDate.parse("2024-01-01"));
        recurringTransaction.setCategory(CategoryEntity.builder().id("CAT123").build());
        recurringTransaction.setUser(UserEntity.builder().id(1L).build());
        recurringTransaction.setAccount(AccountEntity.builder().id("ACC123").build());
        return recurringTransaction;
    }

    private RecurringTransactionDTO createRecurringTransaction() {
        return new RecurringTransactionDTO(
                1L,                     // userId
                "ACC123",               // accountId
                "STREAM456",            // streamId
                "CAT789",               // categoryId
                "Monthly Subscription", // description
                "Netflix",              // merchantName
                "2023-01-01",           // firstDate
                "2024-01-01",           // lastDate
                "MONTHLY",              // frequency
                new AmountDTO(new BigDecimal("9.99"), "", ""),
                new AmountDTO(new BigDecimal("9.99"), "", ""),
                true,                   // active
                "SUBSCRIPTION"          // type
        );
    }

    private TransactionStream createTransactionStream() {
        TransactionStream transactionStream = new TransactionStream();
        transactionStream.setAccountId("accountId");
        transactionStream.setCategoryId("categoryId");
        transactionStream.setDescription("description");
        transactionStream.setAverageAmount(new TransactionStreamAmount().amount(100.0).isoCurrencyCode("USD"));
        return transactionStream;
    }

    @AfterEach
    void tearDown() {
    }

    private static Stream<Arguments> provideNullParameters() {
        return Stream.of(
                Arguments.of("e232323", null, "description", BigDecimal.ONE, true, Arrays.asList("category"), "cat1", LocalDate.now(), NullPointerException.class),
                Arguments.of(null, createAccountEntity(), "description", BigDecimal.ONE, true, Arrays.asList("category"), "cat1", LocalDate.now(), NullPointerException.class),
                Arguments.of("e232323", createAccountEntity(), null, BigDecimal.ONE, true, Arrays.asList("category"), "cat1", LocalDate.now(), NullPointerException.class),
                Arguments.of("e232323", createAccountEntity(), "description", null, true, Arrays.asList("category"), "cat1", LocalDate.now(), NullPointerException.class),
                Arguments.of("e232323", createAccountEntity(), "description", BigDecimal.ONE, true, null, "cat1", LocalDate.now(), NullPointerException.class),
                Arguments.of("e232323", createAccountEntity(), "description", BigDecimal.ONE, true, Arrays.asList("category"), null, LocalDate.now(), NullPointerException.class),
                Arguments.of("e232323", createAccountEntity(), "description", BigDecimal.ONE, true, Arrays.asList("category"), "cat1", null, NullPointerException.class)
        );
    }

    private TransactionsEntity createTransaction(String transactionId, AccountEntity account, String description, BigDecimal amount, boolean isPending, List<String> categories, String categoryId, LocalDate authorizedDate){
        return TransactionsEntity.builder()
                .id(transactionId)
                .pending(isPending)
                .authorizedDate(authorizedDate)
//                .categories(categories)
                .account(account)
                .amount(amount)
                .description(description)
//                .categoryId(categoryId)
                .build();
    }

    private TransactionsEntity createTransactionEntity(){
        TransactionsEntity transactionsEntity = new TransactionsEntity();
        transactionsEntity.setAccount(createAccountEntity());
        transactionsEntity.setDescription("description");
        transactionsEntity.setAmount(BigDecimal.ONE);
        transactionsEntity.setId("TRX3001");
        transactionsEntity.setPending(false);
        return transactionsEntity;
    }

    private static AccountEntity createAccountEntity(){
        AccountEntity accountEntity = new AccountEntity();
        accountEntity.setId("A234242");
        accountEntity.setAccountName("Test Checking");
        accountEntity.setMask("0000");
        accountEntity.setSubtype(AccountSubType.CHECKING);
        accountEntity.setType(AccountType.DEPOSITORY);
        accountEntity.setBalance(BigDecimal.valueOf(120));
        accountEntity.setUser(createUserEntity());
        return accountEntity;
    }

    private UserEntity createUser(){
        UserEntity userEntity = new UserEntity();
        userEntity.setId(1L);
        userEntity.setUsername("testUser");
        return userEntity;
    }

    private PlaidTransaction createTransaction(){
        PlaidTransaction transaction = new PlaidTransaction();
        transaction.setName("Test Transaction");
        transaction.setMerchantName("Test Merchant Name");
        transaction.setTransactionId("transactionId");
        transaction.setPending(false);
        transaction.setDate(LocalDate.now());
        transaction.setAccountId("accountId");
        transaction.setTransactionCode(TransactionCode.CASH);
        transaction.setAmount(BigDecimal.valueOf(120));
        return transaction;
    }

    private PlaidLinkEntity createPlaidLinkEntity(){
        PlaidLinkEntity plaidLinkEntity = new PlaidLinkEntity();
        plaidLinkEntity.setId(1L);
        plaidLinkEntity.setAccessToken("access_token");
        plaidLinkEntity.setUser(createUserEntity());
        return plaidLinkEntity;
    }

    private static UserEntity createUserEntity(){
        UserEntity userEntity = new UserEntity();
        userEntity.setEmail("email@email.com");
        userEntity.setPassword("password");
        userEntity.setFirstName("firstName");
        userEntity.setLastName("lastName");
        return userEntity;
    }

}