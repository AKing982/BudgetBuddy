package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.exceptions.TransactionRunnerException;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.app.budgetbuddy.workbench.RecurringTransactionUtil;
import com.app.budgetbuddy.workbench.converter.PlaidTransactionToTransactionConverter;
import com.app.budgetbuddy.workbench.converter.TransactionConverter;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.plaid.client.model.TransactionsGetResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

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
    private PlaidTransactionToTransactionConverter pConverter;

    private PlaidTransactionRunner plaidTransactionRunner;

    @BeforeEach
    void setUp() {
        plaidTransactionRunner = new PlaidTransactionRunner(plaidTransactionManager, pConverter, plaidLinkService, recurringTransactionUtil, transactionConverter);
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
    void testGetRecurringTransactionsResponse_whenResponseIsNull_thenThrowException() throws IOException {
        Long userId = 1L;
        when(plaidTransactionManager.getAsyncTransactionsResponse(anyLong(), any(), any()))
                .thenReturn(CompletableFuture.completedFuture(null))
                .thenThrow(new TransactionRunnerException("There was an error fetching the recurring transactions."));

        assertThrows(TransactionRunnerException.class, () -> {
            plaidTransactionRunner.getRecurringTransactionsResponse(userId);
        });
    }

    @AfterEach
    void tearDown() {
    }
}