package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.InvalidAccessTokenException;
import com.app.budgetbuddy.exceptions.TransactionRunnerException;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.services.TransactionService;
import com.app.budgetbuddy.workbench.RecurringTransactionUtil;
import com.app.budgetbuddy.workbench.converter.PlaidTransactionToTransactionConverter;
import com.app.budgetbuddy.workbench.converter.TransactionConverter;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.plaid.client.model.TransactionStream;
import com.plaid.client.model.TransactionsGetResponse;
import com.plaid.client.model.TransactionsRecurringGetResponse;
import com.plaid.client.model.TransactionsSyncResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlaidTransactionRunnerTest
{
    @Mock
    private PlaidTransactionManager plaidTransactionManager;

    @Mock
    private PlaidLinkService plaidLinkService;

    @Mock
    private RecurringTransactionUtil recurringTransactionUtil;

    @Mock
    private TransactionConverter transactionConverter;

    @Mock
    private TransactionService transactionService;

    @Mock
    private RecurringTransactionService recurringTransactionService;

    @Mock
    private PlaidTransactionToTransactionConverter pConverter;

    private PlaidTransactionRunner plaidTransactionRunner;

    @BeforeEach
    void setUp() {
        plaidTransactionRunner = new PlaidTransactionRunner(plaidTransactionManager, pConverter, plaidLinkService, transactionService, recurringTransactionService, recurringTransactionUtil, transactionConverter);
    }

    @Test
    public void testGetTransactionsResponse_whenResponseIsNull_thenThrowException() throws IOException {
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2026, 2, 1);
        LocalDate endDate = LocalDate.of(2026, 2, 5);

        when(plaidTransactionManager.getAsyncTransactionsResponse(anyLong(), any(), any()))
                .thenReturn(CompletableFuture.completedFuture(null))
                .thenThrow(new TransactionRunnerException("There was an error fetching the transaction response"));

        assertThrows(TransactionRunnerException.class, () -> {
            plaidTransactionRunner.getTransactionsResponse(userId, startDate, endDate);
        });
    }

    @Test
    void testGetTransactionsResponse_whenTransactionsIsEmpty_thenReturnEmptyList() throws IOException{
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2026, 2, 1);
        LocalDate endDate = LocalDate.of(2026, 2, 5);

        TransactionsGetResponse transactionsGetResponse = new TransactionsGetResponse();
        transactionsGetResponse.setTransactions(null);

        when(plaidTransactionManager.getAsyncTransactionsResponse(anyLong(), any(), any()))
                .thenReturn(CompletableFuture.completedFuture(transactionsGetResponse));

        List<Transaction> actual = plaidTransactionRunner.getTransactionsResponse(userId, startDate, endDate);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGetRecurringTransactionResponse_whenSuccessful_thenReturnRecurring() throws IOException{
        Long userId = 1L;
        List<TransactionStream> outflowStreams = Arrays.asList(mock(TransactionStream.class));
        List<TransactionStream> inflowStreams = Arrays.asList(mock(TransactionStream.class));

        TransactionsRecurringGetResponse response = mock(TransactionsRecurringGetResponse.class);
        when(response.getOutflowStreams()).thenReturn(outflowStreams);
        when(response.getInflowStreams()).thenReturn(inflowStreams);

        List<RecurringTransaction> expectedTransactions = Arrays.asList(new RecurringTransaction());
        when(plaidTransactionManager.getAsyncRecurringResponse(userId))
                .thenReturn(CompletableFuture.completedFuture(response));
        when(recurringTransactionUtil.convertTransactionStreams(outflowStreams, inflowStreams))
                .thenReturn(expectedTransactions);

        List<RecurringTransaction> result = plaidTransactionRunner.getRecurringTransactionsResponse(userId);

        assertEquals(expectedTransactions, result);
        verify(recurringTransactionUtil).convertTransactionStreams(outflowStreams, inflowStreams);

    }

    @Test
    void testGetRecurringTransactionsResponse_whenResponseIsNull_thenThrowException() throws IOException {
        Long userId = 1L;
        when(plaidTransactionManager.getAsyncRecurringResponse(anyLong()))
                .thenReturn(CompletableFuture.completedFuture(null))
                .thenThrow(new TransactionRunnerException("There was an error fetching the recurring transactions."));

        assertThrows(TransactionRunnerException.class, () -> {
            plaidTransactionRunner.getRecurringTransactionsResponse(userId);
        });
    }

    @Test
    void testGetRecurringTransactionsResponse_whenResponseThrowsException_thenCatchException() throws IOException{
        Long userId = 1L;
        when(plaidTransactionManager.getAsyncRecurringResponse(userId))
                .thenThrow(new IOException("There was an error fetching the recurring transactions."));
        assertThrows(TransactionRunnerException.class, () -> {
            plaidTransactionRunner.getRecurringTransactionsResponse(userId);
        });
        verify(recurringTransactionUtil, never()).convertTransactionStreams(any(), any());
    }

    @Test
    void testGetRecurringTransactionsResponse_whenStreamsAreNull_thenThrowException() throws IOException{
        Long userId = 1L;
        TransactionsRecurringGetResponse transactionsRecurringGetResponse = mock(TransactionsRecurringGetResponse.class);
        when(transactionsRecurringGetResponse.getInflowStreams()).thenReturn(null);
        when(transactionsRecurringGetResponse.getOutflowStreams()).thenReturn(null);

        when(plaidTransactionManager.getAsyncRecurringResponse(userId))
                .thenReturn(CompletableFuture.completedFuture(transactionsRecurringGetResponse));

        assertThrows(TransactionRunnerException.class, () -> {
            plaidTransactionRunner.getRecurringTransactionsResponse(userId);
        });
    }

    @Test
    void testGetRecurringTransactionsResponse_whenInflowingStreamIsNullAndOutflowStreamsNotNull_thenReturnRecurring() throws IOException{
        Long userId = 1L;
        List<TransactionStream> outflowStreams = Arrays.asList(mock(TransactionStream.class));
        TransactionsRecurringGetResponse response = mock(TransactionsRecurringGetResponse.class);
        when(response.getOutflowStreams()).thenReturn(outflowStreams);
        when(response.getInflowStreams()).thenReturn(null);

        when(plaidTransactionManager.getAsyncRecurringResponse(userId))
                .thenReturn(CompletableFuture.completedFuture(response));
        when(recurringTransactionUtil.convertTransactionStreams(outflowStreams, Collections.emptyList()))
                .thenReturn(Arrays.asList(new RecurringTransaction()));
        List<RecurringTransaction> actual = plaidTransactionRunner.getRecurringTransactionsResponse(userId);
        assertNotNull(actual);
        assertFalse(actual.isEmpty());
        assertEquals(1, actual.size());
        verify(recurringTransactionUtil).convertTransactionStreams(outflowStreams,Collections.emptyList());
    }

    @Test
    void testGetRecurringTransactionResponse_whenOutflowingStreamsIsNullAndInflowStreamsNotNull_thenReturnRecurring() throws IOException{
        Long userId = 1L;
        List<TransactionStream> inflowStreams = Arrays.asList(mock(TransactionStream.class));
        TransactionsRecurringGetResponse response = mock(TransactionsRecurringGetResponse.class);
        when(response.getInflowStreams()).thenReturn(inflowStreams);
        when(response.getOutflowStreams()).thenReturn(null);
        when(plaidTransactionManager.getAsyncRecurringResponse(userId))
            .thenReturn(CompletableFuture.completedFuture(response));
        when(recurringTransactionUtil.convertTransactionStreams(Collections.emptyList(), inflowStreams))
            .thenReturn(Arrays.asList(new RecurringTransaction()));
        List<RecurringTransaction> actual = plaidTransactionRunner.getRecurringTransactionsResponse(userId);
        assertNotNull(actual);
        assertFalse(actual.isEmpty());
        assertEquals(1, actual.size());
        verify(recurringTransactionUtil).convertTransactionStreams(Collections.emptyList(),inflowStreams);
    }

    @Test
    void testGetRecurringTransactionResponse_whenOutflowingStreamsIsEmpty_thenReturnRecurring() throws IOException{
        Long userId = 1L;
        List<TransactionStream> inflowStreams = Arrays.asList(mock(TransactionStream.class));
        TransactionsRecurringGetResponse response = mock(TransactionsRecurringGetResponse.class);
        when(response.getInflowStreams()).thenReturn(inflowStreams);
        when(response.getOutflowStreams()).thenReturn(Collections.emptyList());
        when(plaidTransactionManager.getAsyncRecurringResponse(userId))
                .thenReturn(CompletableFuture.completedFuture(response));
        when(recurringTransactionUtil.convertTransactionStreams(Collections.emptyList(), inflowStreams))
            .thenReturn(Arrays.asList(new RecurringTransaction()));
        List<RecurringTransaction> actual = plaidTransactionRunner.getRecurringTransactionsResponse(userId);
        assertNotNull(actual);
        assertFalse(actual.isEmpty());
        assertEquals(1, actual.size());
    }

    @Test
    void testGetRecurringTransactionResponse_whenInflowingStreamsIsEmpty_thenReturnRecurring() throws IOException{
        Long userId = 1L;
        List<TransactionStream> outflowStreams = Arrays.asList(mock(TransactionStream.class));
        TransactionsRecurringGetResponse response = mock(TransactionsRecurringGetResponse.class);
        when(response.getOutflowStreams()).thenReturn(outflowStreams);
        when(response.getInflowStreams()).thenReturn(Collections.emptyList());
        when(plaidTransactionManager.getAsyncRecurringResponse(userId))
                .thenReturn(CompletableFuture.completedFuture(response));
        when(recurringTransactionUtil.convertTransactionStreams(outflowStreams, Collections.emptyList()))
                .thenReturn(Arrays.asList(new RecurringTransaction()));
        List<RecurringTransaction> actual = plaidTransactionRunner.getRecurringTransactionsResponse(userId);
        assertNotNull(actual);
        assertFalse(actual.isEmpty());
        assertEquals(1, actual.size());
    }

    @Test
    void testSyncTransactions_whenPlaidLinkNotFound_thenReturnEmptyList() throws IOException{
        Long userId = 1L;
        when(plaidLinkService.findPlaidLinkByUserID(userId))
                .thenReturn(Optional.empty());
        List<Transaction> actual = plaidTransactionRunner.syncTransactions(userId);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testSyncTransactions_whenAccessTokenIsEmpty_thenThrowInvalidAccessTokenException() throws IOException{
        Long userId = 1L;
        PlaidLinkEntity plaidLinkEntity = new PlaidLinkEntity();
        plaidLinkEntity.setAccessToken("");
        plaidLinkEntity.setItemId("");
        plaidLinkEntity.setUser(UserEntity.builder().id(userId).build());
        when(plaidLinkService.findPlaidLinkByUserID(userId))
                .thenReturn(Optional.of(plaidLinkEntity));
        assertThrows(InvalidAccessTokenException.class, () -> {
            plaidTransactionRunner.syncTransactions(userId);
        });
        verify(plaidLinkService, times(1)).findPlaidLinkByUserID(userId);
    }

    @Test
    void testSyncTransactions_whenItemIdIsEmpty_thenThrowIllegalArgumentException() throws IOException{
        Long userId = 1L;
        PlaidLinkEntity plaidLinkEntity = new PlaidLinkEntity();
        plaidLinkEntity.setItemId("");
        plaidLinkEntity.setUser(UserEntity.builder().id(userId).build());
        plaidLinkEntity.setAccessToken("e2323232");
        when(plaidLinkService.findPlaidLinkByUserID(userId))
                .thenReturn(Optional.of(plaidLinkEntity));
        assertThrows(IllegalArgumentException.class, () -> {
            plaidTransactionRunner.syncTransactions(userId);
        });
        verify(plaidLinkService, times(1)).findPlaidLinkByUserID(userId);
    }

    @Test
    void testSyncTransactions_whenSuccessful_thenReturnSyncedTransactions() throws IOException{
        Long userId = 1L;
        PlaidLinkEntity plaidLinkEntity = new PlaidLinkEntity();
        plaidLinkEntity.setItemId("item1-232");
        plaidLinkEntity.setUser(UserEntity.builder().id(userId).build());
        plaidLinkEntity.setAccessToken("e2323232");
        // Set the secret field value using reflection
        ReflectionTestUtils.setField(plaidTransactionRunner, "secret", "test-secret-key");

        Transaction convertedTransaction = mock(Transaction.class);
        TransactionsSyncResponse response = mock(TransactionsSyncResponse.class);
        com.plaid.client.model.Transaction mockAddedTransaction =  mock(com.plaid.client.model.Transaction.class);
        com.plaid.client.model.Transaction mockUpdatedTransaction = mock(com.plaid.client.model.Transaction.class);

        when(response.getAdded()).thenReturn(List.of(mockAddedTransaction));
        when(response.getModified()).thenReturn(List.of(mockUpdatedTransaction));

        when(plaidLinkService.findPlaidLinkByUserID(userId))
            .thenReturn(Optional.of(plaidLinkEntity));
        when(plaidTransactionManager.syncTransactionsForUser(
                eq("test-secret-key"),  // or isNull()
                eq("e2323232"),
                eq("item1-232"),
                eq(userId)))
                .thenReturn(CompletableFuture.completedFuture(response));

        when(pConverter.convert(any(com.plaid.client.model.Transaction.class)))
                .thenReturn(convertedTransaction);

        List<Transaction> actual = plaidTransactionRunner.syncTransactions(userId);
        assertNotNull(actual);
        assertFalse(actual.isEmpty());
        assertEquals(2,  actual.size());
        verify(plaidLinkService, times(1)).findPlaidLinkByUserID(userId);
        verify(plaidTransactionManager, times(1)).syncTransactionsForUser(anyString(), anyString(), anyString(), anyLong());
        verify(pConverter, times(2)).convert(any(com.plaid.client.model.Transaction.class));
    }

    @Test
    void testSyncTransactions_whenSyncResponseIsNull_thenThrowException() throws IOException{
        Long userId = 1L;
        PlaidLinkEntity plaidLinkEntity = new PlaidLinkEntity();
        plaidLinkEntity.setItemId("item1-232");
        plaidLinkEntity.setUser(UserEntity.builder().id(userId).build());
        plaidLinkEntity.setAccessToken("e2323232");
        ReflectionTestUtils.setField(plaidTransactionRunner, "secret", "test-secret-key");
        when(plaidLinkService.findPlaidLinkByUserID(userId))
                .thenReturn(Optional.of(plaidLinkEntity));
        when(plaidTransactionManager.syncTransactionsForUser(
                eq("test-secret-key"),  // or isNull()
                eq("e2323232"),
                eq("item1-232"),
                eq(userId)))
                .thenReturn(CompletableFuture.completedFuture(null));
        assertThrows(TransactionRunnerException.class, () -> {
            plaidTransactionRunner.syncTransactions(userId);
        });
    }

    @Test
    void testSaveTransactions_whenTransactionsListIsEmpty_thenReturnEmptyList(){
        List<TransactionsEntity> actual = plaidTransactionRunner.saveTransactions(new ArrayList<>());
        assertTrue(actual.isEmpty());
    }


    @AfterEach
    void tearDown() {
    }
}