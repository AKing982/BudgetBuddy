package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.domain.AccountType;
import com.app.budgetbuddy.entities.*;
import com.app.budgetbuddy.exceptions.*;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.converter.RecurringTransactionConverter;
import com.app.budgetbuddy.workbench.converter.TransactionConverter;
import com.plaid.client.model.*;
import com.plaid.client.model.Transaction;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.testcontainers.shaded.org.apache.commons.lang3.ObjectUtils;
import retrofit2.Call;
import retrofit2.Response;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlaidTransactionManagerTest
{

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

    @Mock
    private PlaidCursorService plaidCursorService;

    @Mock
    private UserService userService;

    private Long userId = 1L;
    private LocalDate startDate = LocalDate.of(2024, 6, 1);
    private LocalDate endDate = LocalDate.of(2024, 6, 5);
    private UserEntity userEntity;
    private PlaidLinkEntity plaidLinkEntity;
    private String itemId = "123456789";

    @BeforeEach
    void setUp() {
        userEntity = new UserEntity();
        userEntity.setId(userId);

        plaidLinkEntity = new PlaidLinkEntity();
        plaidLinkEntity.setUser(userEntity);

        transactionManager = new PlaidTransactionManager(
                plaidLinkService,
                plaidApi,
                transactionConverter,
                recurringTransactionService,
                transactionService,
                recurringTransactionConverter,
                plaidCursorService,
                userService
        );

    }

    @Test
    void testGetAsyncTransactionsResponse_whenUserIdDoesNotExist_thenThrowUserNotFoundException() throws IOException
    {
        when(userService.findById(userId)).thenReturn(Optional.empty());
        assertThrows(UserNotFoundException.class, () -> {
            transactionManager.getAsyncTransactionsResponse(userId, startDate, endDate);
        });
    }

    @Test
    void testGetAsyncTransactionsResponse_whenAccessTokenIsEmpty_thenThrowAccessTokenNotFoundException() throws IOException
    {
        plaidLinkEntity.setAccessToken("");
        when(userService.findById(userId)).thenReturn(Optional.of(userEntity));
        when(plaidLinkService.findPlaidLinkByUserID(userId)).thenReturn(Optional.of(plaidLinkEntity));
        assertThrows(InvalidAccessTokenException.class, () -> {
            transactionManager.getAsyncTransactionsResponse(userId, startDate, endDate);
        });
        verify(userService, times(1)).findById(userId);
        verify(plaidLinkService, times(1)).findPlaidLinkByUserID(userId);
    }

    @Test
    void testGetAsyncTransactionsResponse_whenUserIdIsValid() throws IOException {
        List<PlaidTransaction> transactions = new ArrayList<>();
        transactions.add(createTransaction());
        transactions.add(createTransaction());

        TransactionsGetResponse expectedResponse = new TransactionsGetResponse();

        when(userService.findById(userId)).thenReturn(Optional.of(userEntity));
        when(plaidLinkService.findPlaidLinkByUserID(userId)).thenReturn(Optional.of(createPlaidLinkEntity()));
        Call<TransactionsGetResponse> callSuccessful = mock(Call.class);
        when(callSuccessful.execute()).thenReturn(Response.success(expectedResponse));

        when(plaidApi.transactionsGet(any(TransactionsGetRequest.class))).thenReturn(callSuccessful);

        TransactionsGetResponse actualResponse = transactionManager.getAsyncTransactionsResponse(userId, startDate, endDate).join();
        assertNotNull(actualResponse);
        assertEquals(expectedResponse.getTotalTransactions(), actualResponse.getTotalTransactions());
    }

    @Test
    void testGetAsyncTransactionsResponse_whenTransactionResponseCallFailsTwoAttempts_thenReturnSuccess() throws IOException
    {
        List<PlaidTransaction> transactions = new ArrayList<>();
        transactions.add(createTransaction());
        transactions.add(createTransaction());
        TransactionsGetResponse expectedResponse = new TransactionsGetResponse();
        expectedResponse.setTotalTransactions(transactions.size());

        plaidLinkEntity.setAccessToken("32323232");

        when(userService.findById(userId)).thenReturn(Optional.of(userEntity));
        when(plaidLinkService.findPlaidLinkByUserID(userId)).thenReturn(Optional.of(plaidLinkEntity));
        Call<TransactionsGetResponse> firstCall = mock(Call.class);
        Response<TransactionsGetResponse> failedResponse = Response.error(500, ResponseBody.create(MediaType.get("application/json"), "{}"));
        when(firstCall.execute()).thenReturn(failedResponse);

        Call<TransactionsGetResponse> retryCall1 = mock(Call.class);
        Call<TransactionsGetResponse> retryCall2 = mock(Call.class);
        Call<TransactionsGetResponse> retryCall3 = mock(Call.class);
        when(retryCall1.execute()).thenReturn(failedResponse);
        when(retryCall2.execute()).thenReturn(failedResponse);
        when(retryCall3.execute()).thenReturn(Response.success(expectedResponse));

        when(plaidApi.transactionsGet(any(TransactionsGetRequest.class)))
                .thenReturn(firstCall)
                .thenReturn(retryCall1)
                .thenReturn(retryCall2)
                .thenReturn(retryCall3);

        TransactionsGetResponse actualResponse = transactionManager.getAsyncTransactionsResponse(userId, startDate, endDate).join();
        assertNotNull(actualResponse);
        assertEquals(expectedResponse.getTotalTransactions(), actualResponse.getTotalTransactions());
        verify(plaidApi, times(4)).transactionsGet(any(TransactionsGetRequest.class));
    }

    @Test
    void testGetAsyncTransactionResponse_whenMaxAttemptsReached_thenReturnRuntimeException() throws IOException
    {
        TransactionsGetResponse expectedResponse = new TransactionsGetResponse();

        plaidLinkEntity.setAccessToken("32323232");
        when(userService.findById(userId)).thenReturn(Optional.of(userEntity));
        when(plaidLinkService.findPlaidLinkByUserID(userId)).thenReturn(Optional.of(plaidLinkEntity));
        Call<TransactionsGetResponse> firstCall = mock(Call.class);
        Response<TransactionsGetResponse> failedResponse = Response.error(500, ResponseBody.create(MediaType.get("application/json"), "{}"));
        when(firstCall.execute()).thenReturn(failedResponse);

        Call<TransactionsGetResponse> retryCall1 = mock(Call.class);
        Call<TransactionsGetResponse> retryCall2 = mock(Call.class);
        Call<TransactionsGetResponse> retryCall3 = mock(Call.class);
        Call<TransactionsGetResponse> retryCall4 = mock(Call.class);
        Call<TransactionsGetResponse> retryCall5 = mock(Call.class);
        when(retryCall1.execute()).thenReturn(failedResponse);
        when(retryCall2.execute()).thenReturn(failedResponse);
        when(retryCall3.execute()).thenReturn(failedResponse);
        when(retryCall4.execute()).thenReturn(failedResponse);
        when(retryCall5.execute()).thenReturn(failedResponse);

        when(plaidApi.transactionsGet(any(TransactionsGetRequest.class)))
                .thenReturn(firstCall)
                .thenReturn(retryCall1)
                .thenReturn(retryCall2)
                .thenReturn(retryCall3)
                .thenReturn(retryCall4)
                .thenReturn(retryCall5);
        assertThrows(RuntimeException.class, () -> {
            transactionManager.getAsyncTransactionsResponse(userId, startDate, endDate).join();
        });
    }

    @Test
    void testSaveTransactionToDatabase_whenTransactionListIsEmpty(){
        List<PlaidTransaction> transactions = new ArrayList<>();
        assertThrows(TransactionsNotFoundException.class, () -> {
            transactionManager.saveTransactionsToDatabase(transactions);
        });
    }

    @Test
    void testSaveTransactionsToDatabase_whenTransactionsValid(){
        List<PlaidTransaction> transactions = new ArrayList<>();
        transactions.add(createTransaction());

        TransactionsEntity mockedTransactionsEntity = new TransactionsEntity();

        when(transactionConverter.convert(any(PlaidTransaction.class)))
                .thenReturn(mockedTransactionsEntity);

        List<TransactionsEntity> actual = transactionManager.saveTransactionsToDatabase(transactions).join();
        assertNotNull(actual);
        assertEquals(1, actual.size());

        verify(transactionService, times(1)).save(any(TransactionsEntity.class));
    }

    @Test
    void testSaveTransactionsToDatabase_whenNullPlaidTransactionFound_thenSkipAndReturn(){
        List<PlaidTransaction> transactions = new ArrayList<>();
        PlaidTransaction transaction = new PlaidTransaction();
        transaction.setAccountId("23232");
        transaction.setAmount(BigDecimal.valueOf(50));
        transaction.setMerchantName("WINCO");
        transaction.setName("WINCO");
        transaction.setPending(false);

        transactions.add(createTransaction());
        transactions.add(null);
        transactions.add(transaction);
        TransactionsEntity mockedTransactionsEntity = new TransactionsEntity();
        TransactionsEntity mockTransactionsEntity2 = new TransactionsEntity();

        when(transactionConverter.convert(any(PlaidTransaction.class)))
                .thenReturn(mockedTransactionsEntity)
                .thenReturn(mockTransactionsEntity2);

        List<TransactionsEntity> actual = transactionManager.saveTransactionsToDatabase(transactions).join();
        assertNotNull(actual);
        assertTrue(!actual.isEmpty());
        assertEquals(2, actual.size());

        verify(transactionService, times(2)).save(any(TransactionsEntity.class));
    }

    @Test
    void testSaveTransactionsToDatabase_whenDuplicateTransactions_thenReturn(){
        List<PlaidTransaction> transactions = new ArrayList<>();
        transactions.add(createTransaction());
        transactions.add(createTransaction());

        TransactionsEntity mockedTransactionsEntity = new TransactionsEntity();

        when(transactionConverter.convert(any(PlaidTransaction.class)))
                .thenReturn(mockedTransactionsEntity);

        List<TransactionsEntity> actual = transactionManager.saveTransactionsToDatabase(transactions).join();
        assertNotNull(actual);
        assertTrue(!actual.isEmpty());
        assertEquals(1, actual.size());
    }

    @Test
    void testSaveTransactionsToDatabase_whenConvertedTransactionIsNull_thenSkipAndReturn(){
        List<PlaidTransaction> transactions = new ArrayList<>();
        transactions.add(createTransaction());

        PlaidTransaction transaction = new PlaidTransaction();
        transaction.setAccountId("23232");
        transaction.setAmount(BigDecimal.valueOf(50));
        transaction.setMerchantName("WINCO");
        transaction.setName("WINCO");
        transaction.setPending(false);
        transactions.add(transaction);

        TransactionsEntity mockTransactionsEntity = new TransactionsEntity();

        when(transactionConverter.convert(any(PlaidTransaction.class)))
                .thenReturn(null)
                .thenReturn(mockTransactionsEntity);

        List<TransactionsEntity> actual = transactionManager.saveTransactionsToDatabase(transactions).join();
        assertNotNull(actual);
        assertTrue(!actual.isEmpty());
        assertEquals(1, actual.size());
        verify(transactionService, times(1)).save(any(TransactionsEntity.class));
    }

    @Test
    void testSaveTransactions_whenExceptionThrown_thenReturnDataException(){
        List<PlaidTransaction> transactions = new ArrayList<>();
        transactions.add(createTransaction());

        when(transactionConverter.convert(any(PlaidTransaction.class)))
                .thenReturn(new TransactionsEntity());

        doThrow(new DataException("There was an error saving the transactions to the database"))
                .when(transactionService).save(any(TransactionsEntity.class));

        CompletableFuture<List<TransactionsEntity>> resultFuture = transactionManager.saveTransactionsToDatabase(transactions);
        assertTrue(resultFuture.isCompletedExceptionally());
        CompletionException ex = assertThrows(CompletionException.class, resultFuture::join);
        assertTrue(ex.getCause() instanceof DataException);
        assertEquals("There was an error saving the transactions to the database", ex.getCause().getMessage());
    }

    @Test
    void testSyncTransactionsForUser_whenUserNotFound_thenReturnFailedFutureWithException()throws IOException{
        String accessToken = "2323232";
        String cursor = "cursor1";
        String secret = "e223234234";

        when(userService.findById(userId)).thenReturn(Optional.empty());
        CompletableFuture<TransactionsSyncResponse> actual = transactionManager.syncTransactionsForUser(secret, itemId, accessToken, userId);
        assertTrue(actual.isCompletedExceptionally());
        CompletionException ex = assertThrows(CompletionException.class, actual::join);
        assertTrue(ex.getCause() instanceof UserNotFoundException);
        assertEquals("User with id " + userId + " was not found", ex.getCause().getMessage());
    }


    @Test
    void testSyncTransactionsForUser_whenAccessTokenIsEmpty_thenReturnFailedFutureWithInvalidAccessToken() throws IOException {

        when(userService.findById(userId)).thenReturn(Optional.of(userEntity));
        String accessToken = "";
        String cursor = "cursor1";
        String secret = "e223234234";
        CompletableFuture<TransactionsSyncResponse> actual = transactionManager.syncTransactionsForUser(secret, itemId, accessToken, userId);
        assertTrue(actual.isCompletedExceptionally());
        CompletionException ex = assertThrows(CompletionException.class, actual::join);
        assertTrue(ex.getCause() instanceof InvalidAccessTokenException);
        assertEquals("Invalid access token was found. Unable to sync user transactions.", ex.getCause().getMessage());
    }

    @Test
    void testSyncTransactionsForUser_whenCursorIsEmpty_thenReturnFailedFutureWithInvalidSyncCursorException() throws IOException{
        when(userService.findById(userId)).thenReturn(Optional.of(userEntity));

        String accessToken = "323232";
        String cursor = "";
        String secret = "e223234234";
        CompletableFuture<TransactionsSyncResponse> actual = transactionManager.syncTransactionsForUser(secret, itemId, accessToken, userId);
        assertTrue(actual.isCompletedExceptionally());

        CompletionException ex = assertThrows(CompletionException.class, actual::join);
        assertTrue(ex.getCause() instanceof SyncCursorException);
        assertEquals("Invalid Sync Cursor found. Unable to sync user transactions from plaid.", ex.getCause().getMessage());
    }

    @Test
    void testSyncTransactionsForUser_whenSuccessfulResponse_thenReturnTransactionSyncResponse() throws IOException
    {
        String accessToken = "232323";
        String cursor = "next-cursor-123";
        String secret = "e223234234";

        TransactionsSyncResponse syncResponse = new TransactionsSyncResponse();
        syncResponse.setNextCursor("next-cursor-123");

        com.plaid.client.model.Transaction mockTransaction = new Transaction();
        syncResponse.added(List.of(mockTransaction));
        syncResponse.hasMore(false);

        when(userService.findById(userId)).thenReturn(Optional.of(userEntity));
        Call<TransactionsSyncResponse> callSuccessful = mock(Call.class);
        Response<TransactionsSyncResponse> responseSuccess = Response.success(syncResponse);
        when(callSuccessful.execute()).thenReturn(responseSuccess);

        when(plaidApi.transactionsSync(any(TransactionsSyncRequest.class)))
                .thenReturn(callSuccessful);

        CompletableFuture<TransactionsSyncResponse> actualFuture = transactionManager.syncTransactionsForUser(secret, itemId, accessToken, userId);
        TransactionsSyncResponse actual = actualFuture.join();
        assertNotNull(actual);
        assertEquals("next-cursor-123", actual.getNextCursor());

        verify(plaidApi).transactionsSync(any(TransactionsSyncRequest.class));
    }

    @Test
    void testSyncTransactionsForUser_whenInitialResponseFails_thenSuccessAfterTwoRetries() throws IOException
    {
        when(userService.findById(userId)).thenReturn(Optional.of(userEntity));
        String accessToken = "2323232";
        String cursor = "cursor1";
        String secret = "e223234234";
        TransactionsSyncResponse syncResponse = new TransactionsSyncResponse();
        syncResponse.setNextCursor("next-cursor-123");
        com.plaid.client.model.Transaction mockTransaction = new Transaction();
        com.plaid.client.model.Transaction mockTransaction2 = new com.plaid.client.model.Transaction();
        syncResponse.added(List.of(mockTransaction, mockTransaction2));
        syncResponse.hasMore(false);

        Response<TransactionsSyncResponse> failedResponse = mock(Response.class);
        Response<TransactionsSyncResponse> successResponse = mock(Response.class);
        when(successResponse.isSuccessful()).thenReturn(true);
        when(successResponse.body()).thenReturn(syncResponse);

        Call<TransactionsSyncResponse> failedCall1 = mock(Call.class);
        Call<TransactionsSyncResponse> failedCall2 = mock(Call.class);
        Call<TransactionsSyncResponse> successfulCall = mock(Call.class);
        when(failedCall1.execute()).thenReturn(failedResponse);
        when(failedCall2.execute()).thenReturn(failedResponse);
        when(successfulCall.execute()).thenReturn(successResponse);

        when(plaidApi.transactionsSync(any(TransactionsSyncRequest.class)))
                .thenReturn(failedCall1)
                .thenReturn(failedCall2)
                .thenReturn(successfulCall);

        CompletableFuture<TransactionsSyncResponse> actualFuture = transactionManager.syncTransactionsForUser(secret, itemId, accessToken, userId);
        TransactionsSyncResponse actual = actualFuture.join();
        assertNotNull(actual);
        assertEquals("next-cursor-123", actual.getNextCursor());
        assertFalse(actual.getHasMore());
        assertFalse(actual.getAdded().isEmpty());

        verify(plaidApi, times(3)).transactionsSync(any(TransactionsSyncRequest.class));
    }



//
//    @Test
//    void testSaveTransactionToDatabase_whenTransactionElementNullThenSkipAndSaveTransaction() {
//        List<PlaidTransaction> transactions = new ArrayList<>();
//        transactions.add(null);
//        transactions.add(createTransaction());
//
//        List<TransactionsEntity> expected = Arrays.asList(createTransactionEntity());
//        when(transactionConverter.convert(createTransaction())).thenReturn(createTransactionEntity());
//        doNothing().when(transactionService).save(createTransactionEntity());
//        List<TransactionsEntity> actual = transactionManager.saveTransactionsToDatabase(transactions);
//        assertNotNull(actual);
//        assertEquals(expected.size(), actual.size());
//        for(int i = 0; i < actual.size(); i++){
//            assertEquals(expected.get(i).getId(), actual.get(i).getId());
//            assertEquals(expected.get(i).getAccount().getId(), actual.get(i).getAccount().getId());
////            assertEquals(expected.get(i).getCategoryId(), actual.get(i).getCategoryId());
//            assertEquals(expected.get(i).getAuthorizedDate(), actual.get(i).getAuthorizedDate());
//            assertEquals(expected.get(i).isPending(), actual.get(i).isPending());
//            assertEquals(expected.get(i).getDescription(), actual.get(i).getDescription());
//            assertEquals(expected.get(i).getAmount(), actual.get(i).getAmount());
////            assertEquals(expected.get(i).getCategories(), actual.get(i).getCategories());
//            assertEquals(expected.get(i).getPosted(), actual.get(i).getPosted());
//        }
//
//    }
//
//    @ParameterizedTest
//    @MethodSource("provideNullParameters")
//    void testSaveTransactionToDatabase_whenTransactionParametersAreNull(String transactionId, AccountEntity account, String description,
//                                                                        BigDecimal amount, Boolean isPending, List<String> categories, String categoryId, LocalDate authorizedDate, Class<? extends Exception> expectedException){
//        List<PlaidTransaction> transactions = new ArrayList<>();
//        transactions.add(createTransaction());
//        transactions.add(createTransaction());
//
//        List<TransactionsEntity> transactionsEntities = new ArrayList<>();
//        TransactionsEntity transactionsEntity = createTransaction(transactionId, account, description, amount, isPending, categories, categoryId, authorizedDate);
//        transactionsEntities.add(transactionsEntity);
//        assertThrows(expectedException, () -> {
//            transactionManager.saveTransactionsToDatabase(transactions);
//        });
//
//    }
//
//    @Test
//    void testGetRecurringTransactionsForUser_whenUserIdNotValid_thenThrowException(){
//        Long userId = -1L;
//        assertThrows(InvalidUserIDException.class, () -> {
//            transactionManager.getRecurringTransactionsForUser(userId);
//        });
//    }
//
//    @Test
//    void testGetRecurringTransactionsForUser_whenUserIdValid() throws IOException {
//        Long userId = 1L;
//        when(plaidLinkService.findPlaidLinkByUserID(userId)).thenReturn(Optional.of(createPlaidLinkEntity()));
//        TransactionsRecurringGetRequestOptions options = new TransactionsRecurringGetRequestOptions()
//                .includePersonalFinanceCategory(true);
//
//        TransactionsRecurringGetRequest transactionsRecurringGetRequest = new TransactionsRecurringGetRequest()
//                .accessToken("access_token")
//                .options(options);
//
//        TransactionsRecurringGetResponse expectedResponse = new TransactionsRecurringGetResponse();
//        expectedResponse.setInflowStreams(Collections.singletonList(createTransactionStream()));
//        expectedResponse.setOutflowStreams(Collections.singletonList(createTransactionStream()));
//
//        Call<TransactionsRecurringGetResponse> callSuccessful = mock(Call.class);
//        Response<TransactionsRecurringGetResponse> response = Response.success(expectedResponse);
//
//        when(plaidApi.transactionsRecurringGet(transactionsRecurringGetRequest)).thenReturn(callSuccessful);
//        when(callSuccessful.execute()).thenReturn(response);
//
//        TransactionsRecurringGetResponse actual = transactionManager.getRecurringTransactionsForUser(userId);
//        assertNotNull(actual);
//        assertEquals(expectedResponse.getInflowStreams(), actual.getInflowStreams());
//        assertEquals(expectedResponse.getOutflowStreams(), actual.getOutflowStreams());
//        verify(plaidLinkService, times(1)).findPlaidLinkByUserID(userId);
//        verify(plaidApi).transactionsRecurringGet(transactionsRecurringGetRequest);
//    }
//
//    @Test
//    void testSaveRecurringTransactions_whenRecurringTransactionsListIsEmpty_thenReturnEmptyList() throws IOException {
//        List<RecurringTransactionDTO> transactions = new ArrayList<>();
//        List<RecurringTransactionEntity> actual = transactionManager.saveRecurringTransactions(transactions);
//        assertNotNull(actual);
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testSaveRecurringTransactions_whenRecurringTransactionsListIsNull_thenReturnEmptyList() throws IOException {
//        List<RecurringTransactionDTO> transactions = null;
//        List<RecurringTransactionEntity> actual = transactionManager.saveRecurringTransactions(transactions);
//        assertNotNull(actual);
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testSaveRecurringTransactions_whenRecurringTransactionsListIsValid_thenReturnEntityList() throws IOException {
//        List<RecurringTransactionDTO> transactions = new ArrayList<>();
//        transactions.add(createRecurringTransaction());
//
//        List<RecurringTransactionEntity> expectedEntityList = new ArrayList<>();
//        expectedEntityList.add(createRecurringTransactionEntity());
//
//        when(recurringTransactionConverter.convert(createRecurringTransaction())).thenReturn(createRecurringTransactionEntity());
//        lenient().doNothing().when(recurringTransactionService).save(createRecurringTransactionEntity());
//        List<RecurringTransactionEntity> actual = transactionManager.saveRecurringTransactions(transactions);
//        assertNotNull(actual);
//        assertEquals(expectedEntityList.size(), actual.size());
//
//    }

    private RecurringTransactionEntity createRecurringTransactionEntity(){
        RecurringTransactionEntity recurringTransaction = new RecurringTransactionEntity();
        recurringTransaction.setAccount(AccountEntity.builder().id("ACC123").build());
        recurringTransaction.setActive(true);
        recurringTransaction.setStreamId("STREAM456");
        recurringTransaction.setType(RecurringTransactionType.INFLOW_STREAM.getValue());
        recurringTransaction.setAverageAmount(BigDecimal.ONE);
        recurringTransaction.setMerchantName("Netflix");
        recurringTransaction.setFrequency("MONTHLY");
        recurringTransaction.setDescription("Monthly Subscription");
        recurringTransaction.setFirstDate(LocalDate.parse("2023-01-01"));
        recurringTransaction.setLastDate(LocalDate.parse("2024-01-01"));
//        recurringTransaction.setCategory(CategoryEntity.builder().id("CAT123").build());
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
//                LocalDate.of(2023, 1, 1),           // firstDate
//                LocalDate.of(2024, 1,1),
                "2023-01-01",
                "2024-01-01",
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