package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.exceptions.PlaidApiException;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.services.TransactionService;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.app.budgetbuddy.workbench.runner.TransactionRunner;
import com.plaid.client.model.TransactionsGetResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionRunnerTest {

    @Mock
    private PlaidTransactionManager transactionManager;

    @Mock
    private TransactionService transactionService;

    @Mock
    private RecurringTransactionService recurringTransactionService;

    @InjectMocks
    private TransactionRunner transactionRunner;

    @BeforeEach
    void setUp() {
        transactionRunner = new TransactionRunner(transactionManager, transactionService, recurringTransactionService);
    }

    @Test
    void testCheckTransactionsExistInDateRange_whenStartDateIsNull_returnFalse(){
        LocalDate endDate = LocalDate.of(2024, 10, 31);
        Long userId = 1L;

        Boolean result = transactionRunner.checkTransactionsExistInDateRange(null, endDate, userId);
        assertFalse(result);
    }

    @Test
    void testCheckTransactionsExistInDateRange_whenEndDateIsNull_returnFalse(){
        LocalDate startDate = LocalDate.of(2024, 10, 1);
        Long userId = 1L;
        Boolean result = transactionRunner.checkTransactionsExistInDateRange(startDate, null, userId);
        assertFalse(result);
    }

    @Test
    void testCheckTransactionsExistInDateRange_whenTransactionsExistInDateRange_returnTrue() {
        // Arrange
        LocalDate startDate = LocalDate.of(2024, 10, 1);
        LocalDate endDate = LocalDate.of(2024, 10, 31);
        Long userId = 1L;

        List<Transaction> sampleTransactions = Arrays.asList(
                new Transaction(
                        "z7XDJ8overCDrVGDBpJAsAka43JxZJFld58EJ",  // accountId
                        new BigDecimal("82.02"),                    // amount
                        "USD",                                      // isoCurrencyCode
                        Arrays.asList("Food and Drink", "Restaurants"), // categories
                        "13005000",                                // categoryId (Restaurant category)
                        LocalDate.of(2024, 10, 15),                // date
                        "UBER EATS",                               // description
                        "Uber Eats",                               // merchantName
                        "UBER EATS PURCHASE",                      // name
                        false,                                     // pending
                        "E9rwpNQ8mbSvz8KAJyRPUO4YN89QyMFn9vddK",  // transactionId
                        LocalDate.of(2024, 10, 15),                // authorizedDate
                        "https://logo.url",                        // logoUrl
                        LocalDate.of(2024, 10, 16)                 // posted
                ),
                new Transaction(
                        "z7XDJ8overCDrVGDBpJAsAka43JxZJFld58EJ",  // accountId
                        new BigDecimal("156.78"),                  // amount
                        "USD",                                     // isoCurrencyCode
                        Arrays.asList("Shopping", "Groceries"),    // categories
                        "19047000",                               // categoryId (Grocery category)
                        LocalDate.of(2024, 10, 20),               // date
                        "WHOLE FOODS",                            // description
                        "Whole Foods",                            // merchantName
                        "WHOLE FOODS MARKET",                     // name
                        false,                                    // pending
                        "K7mxvLR2nePwq5BDKzSNHj6XL34RtWGh4pccM", // transactionId
                        LocalDate.of(2024, 10, 20),               // authorizedDate
                        "https://wholefoods.logo.url",            // logoUrl
                        LocalDate.of(2024, 10, 21)                // posted
                )
        );

        // Mock
        when(transactionService.getConvertedPlaidTransactions(userId, startDate, endDate))
                .thenReturn(sampleTransactions);

        // Act
        Boolean result = transactionRunner.checkTransactionsExistInDateRange(startDate, endDate, userId);

        // Assert
        assertTrue(result);
        verify(transactionService).getConvertedPlaidTransactions(userId, startDate, endDate);
    }

    @Test
    void testCheckTransactionsExistInDateRange_whenNoTransactionsInDateRange_returnFalse() {
        // Arrange
        LocalDate startDate = LocalDate.of(2024, 10, 1);
        LocalDate endDate = LocalDate.of(2024, 10, 31);
        Long userId = 1L;

        // Mock empty transaction list
        when(transactionService.getConvertedPlaidTransactions(userId, startDate, endDate))
                .thenReturn(Collections.emptyList());

        // Act
        Boolean result = transactionRunner.checkTransactionsExistInDateRange(startDate, endDate, userId);

        // Assert
        assertFalse(result);
        verify(transactionService).getConvertedPlaidTransactions(userId, startDate, endDate);
    }

    @Test
    void testSyncUserTransactions_whenPlaidTransactionsEmpty_thenReturn() throws IOException {
        final Long userId = 1L;
        final LocalDate startDate = LocalDate.of(2024, 10, 1);
        final LocalDate endDate = LocalDate.of(2024, 10, 31);
        List<Transaction> sampleTransactions = Collections.emptyList();

        when(transactionManager.getTransactionsForUser(userId, startDate, endDate))
                .thenReturn(null);

        boolean result = transactionRunner.syncUserTransactions(userId, startDate, endDate);
        assertFalse(result);
        verify(transactionManager).getTransactionsForUser(eq(userId), eq(startDate), eq(endDate));
        verify(transactionService, never()).findTransactionIdsByIds(anyList());
    }

    @Test
    void testSyncUserTransactions_whenPlaidTransactionsAlreadyExist_thenReturnFalse() throws IOException {
        final Long userId = 1L;
        final LocalDate startDate = LocalDate.of(2024, 10, 1);
        final LocalDate endDate = LocalDate.of(2024, 10, 31);

        // Create sample Plaid transaction
        com.plaid.client.model.Transaction plaidTransaction = new com.plaid.client.model.Transaction()
                .accountId("acc123")
                .amount(50.00)
                .isoCurrencyCode("USD")
                .category(Arrays.asList("Food", "Restaurants"))
                .categoryId("cat123")
                .date(LocalDate.of(2024, 10, 15))
                .name("SBUX")
                .merchantName("Starbucks")
                .pending(false)
                .transactionId("txn123");

        // Create TransactionsGetResponse
        TransactionsGetResponse mockResponse = new TransactionsGetResponse()
                .transactions(Collections.singletonList(plaidTransaction));

        when(transactionManager.getTransactionsForUser(eq(userId), eq(startDate), eq(endDate)))
                .thenReturn(mockResponse);

        // Create converted transaction
        Transaction convertedTransaction = new Transaction(
                "acc123",
                new BigDecimal("50.00"),
                "USD",
                Arrays.asList("Food", "Restaurants"),
                "cat123",
                LocalDate.of(2024, 10, 15),
                "Coffee Shop",
                "Starbucks",
                "SBUX",
                false,
                "txn123",
                LocalDate.of(2024, 10, 15),
                "logo.png",
                LocalDate.of(2024, 10, 15)
        );

        // Mock the conversion
        when(transactionService.convertPlaidTransactions(anyList()))
                .thenReturn(Collections.singletonList(convertedTransaction));

        // Mock service to return existing transaction IDs
        when(transactionService.findTransactionIdsByIds(anyList()))
                .thenReturn(Collections.singletonList("txn123"));

        boolean result = transactionRunner.syncUserTransactions(userId, startDate, endDate);

        assertFalse(result); // Current implementation returns true
        verify(transactionManager).getTransactionsForUser(eq(userId), eq(startDate), eq(endDate));
        verify(transactionService).findTransactionIdsByIds(anyList());
    }

    @Test
    void testSyncUserTransactions_whenPlaidTransactionsDontExist_thenReturnTrue() throws IOException {
        final Long userId = 1L;
        final LocalDate startDate = LocalDate.of(2024, 10, 1);
        final LocalDate endDate = LocalDate.of(2024, 10, 31);
        // Create sample Plaid transaction
        // Create sample Plaid transaction
        com.plaid.client.model.Transaction plaidTransaction = new com.plaid.client.model.Transaction()
                .accountId("acc123")
                .amount(50.00)
                .isoCurrencyCode("USD")
                .category(Arrays.asList("Food", "Restaurants"))
                .categoryId("cat123")
                .date(LocalDate.of(2024, 10, 15))
                .name("SBUX")
                .merchantName("Starbucks")
                .pending(false)
                .transactionId("txn123");

        // Create TransactionsGetResponse
        TransactionsGetResponse mockResponse = new TransactionsGetResponse()
                .transactions(Collections.singletonList(plaidTransaction));

        // Mock Plaid transaction manager
        when(transactionManager.getTransactionsForUser(eq(userId), eq(startDate), eq(endDate)))
                .thenReturn(mockResponse);

        // Create converted transaction
        Transaction convertedTransaction = new Transaction(
                "acc123",
                new BigDecimal("50.00"),
                "USD",
                Arrays.asList("Food", "Restaurants"),
                "cat123",
                LocalDate.of(2024, 10, 15),
                "Coffee Shop",
                "Starbucks",
                "SBUX",
                false,
                "txn123",
                LocalDate.of(2024, 10, 15),
                "logo.png",
                LocalDate.of(2024, 10, 15)
        );

        // Mock the conversion
        when(transactionService.convertPlaidTransactions(anyList()))
                .thenReturn(Collections.singletonList(convertedTransaction));

        // Mock finding existing transactions - return empty list to simulate no existing transactions
        when(transactionService.findTransactionIdsByIds(anyList()))
                .thenReturn(Collections.emptyList());

        // Mock successful save of transactions
        when(transactionService.createAndSaveTransactions(anyList()))
                .thenReturn(Collections.singletonList(new TransactionsEntity()));

        // Act
        boolean result = transactionRunner.syncUserTransactions(userId, startDate, endDate);

        // Assert
        assertTrue(result);
        verify(transactionManager).getTransactionsForUser(eq(userId), eq(startDate), eq(endDate));
        verify(transactionService).convertPlaidTransactions(anyList());
        verify(transactionService).findTransactionIdsByIds(anyList());
        verify(transactionService).createAndSaveTransactions(anyList());
    }

    @Test
    void testSaveTransactionBatch_whenTransactionsEmpty_thenReturnFalse(){
        assertFalse(transactionRunner.saveTransactionBatch(Collections.emptyList()));
        assertFalse(transactionRunner.saveTransactionBatch(null));
    }

    @Test
    void testSaveTransactionBatch_whenTransactionsNotEmpty_thenReturnTrue() {
        // Arrange
        List<Transaction> transactions = Arrays.asList(
                new Transaction(
                        "acc123",                              // accountId
                        new BigDecimal("50.00"),              // amount
                        "USD",                                // isoCurrencyCode
                        Arrays.asList("Food", "Restaurants"), // categories
                        "cat123",                            // categoryId
                        LocalDate.of(2024, 3, 15),           // date
                        "Coffee Shop",                       // description
                        "Starbucks",                        // merchantName
                        "SBUX",                             // name
                        false,                              // pending
                        "txn123",                           // transactionId
                        LocalDate.of(2024, 3, 15),          // authorizedDate
                        "logo.png",                         // logoUrl
                        LocalDate.of(2024, 3, 15)           // posted
                )
        );

        // Create expected TransactionsEntity
        TransactionsEntity expectedEntity = TransactionsEntity.builder()
                .id("txn123")
                .amount(new BigDecimal("50.00"))
                .description("Coffee Shop")
                .posted(LocalDate.of(2024, 3, 15))
                .isoCurrencyCode("USD")
                .merchantName("Starbucks")
                .pending(false)
                .logoUrl("logo.png")
                .authorizedDate(LocalDate.of(2024, 3, 15))
                .createDate(LocalDate.now())
                .build();

        // Mock the service to return our expected entity
        when(transactionService.createAndSaveTransactions(transactions))
                .thenReturn(Collections.singletonList(expectedEntity));

        // Act
        Boolean result = transactionRunner.saveTransactionBatch(transactions);

        // Assert
        assertTrue(result);
        verify(transactionService).createAndSaveTransactions(transactions);
    }

    @Test
    void testSaveTransactionBatch_whenServiceThrowsException_thenReturnFalse() {
        // Arrange
        List<Transaction> transactions = Collections.singletonList(
                new Transaction(
                        "acc123", new BigDecimal("50.00"), "USD",
                        Arrays.asList("Food", "Restaurants"), "cat123",
                        LocalDate.of(2024, 3, 15), "Coffee Shop",
                        "Starbucks", "SBUX", false, "txn123",
                        LocalDate.of(2024, 3, 15), "logo.png",
                        LocalDate.of(2024, 3, 15)
                )
        );

        when(transactionService.createAndSaveTransactions(any()))
                .thenThrow(new RuntimeException("Database error"));

        // Act
        Boolean result = transactionRunner.saveTransactionBatch(transactions);

        // Assert
        assertFalse(result);
        verify(transactionService).createAndSaveTransactions(transactions);
    }

    @Test
    void testSyncUserTransactions_whenExceptionThrown_thenReturnFalse() throws IOException {
        // Arrange
        final Long userId = 1L;
        final LocalDate startDate = LocalDate.of(2024, 10, 1);
        final LocalDate endDate = LocalDate.of(2024, 10, 31);

        // Create sample Plaid transaction
        com.plaid.client.model.Transaction plaidTransaction = new com.plaid.client.model.Transaction()
                .accountId("acc123")
                .amount(50.00)
                .isoCurrencyCode("USD")
                .category(Arrays.asList("Food", "Restaurants"))
                .categoryId("cat123")
                .date(LocalDate.of(2024, 10, 15))
                .name("SBUX")
                .merchantName("Starbucks")
                .pending(false)
                .transactionId("txn123");

        // Create TransactionsGetResponse
        TransactionsGetResponse mockResponse = new TransactionsGetResponse()
                .transactions(Collections.singletonList(plaidTransaction));

        // Mock Plaid transaction manager to throw exception
        when(transactionManager.getTransactionsForUser(eq(userId), eq(startDate), eq(endDate)))
                .thenThrow(new RuntimeException("Simulated Plaid API error"));

        // Act
        boolean result = transactionRunner.syncUserTransactions(userId, startDate, endDate);

        // Assert
        assertFalse(result);
        verify(transactionManager).getTransactionsForUser(eq(userId), eq(startDate), eq(endDate));
        // Verify no other service methods were called after the exception
        verifyNoInteractions(transactionService);
    }

    @Test
    void testSyncUserTransactions_whenTransactionServiceThrowsException_thenReturnFalse() throws IOException {
        // Arrange
        final Long userId = 1L;
        final LocalDate startDate = LocalDate.of(2024, 10, 1);
        final LocalDate endDate = LocalDate.of(2024, 10, 31);

        // Create sample Plaid transaction
        com.plaid.client.model.Transaction plaidTransaction = new com.plaid.client.model.Transaction()
                .accountId("acc123")
                .amount(50.00)
                .isoCurrencyCode("USD")
                .category(Arrays.asList("Food", "Restaurants"))
                .categoryId("cat123")
                .date(LocalDate.of(2024, 10, 15))
                .name("SBUX")
                .merchantName("Starbucks")
                .pending(false)
                .transactionId("txn123");

        // Create TransactionsGetResponse
        TransactionsGetResponse mockResponse = new TransactionsGetResponse()
                .transactions(Collections.singletonList(plaidTransaction));

        // Mock successful Plaid transaction fetch
        when(transactionManager.getTransactionsForUser(eq(userId), eq(startDate), eq(endDate)))
                .thenReturn(mockResponse);

        // Create converted transaction
        Transaction convertedTransaction = new Transaction(
                "acc123",
                new BigDecimal("50.00"),
                "USD",
                Arrays.asList("Food", "Restaurants"),
                "cat123",
                LocalDate.of(2024, 10, 15),
                "Coffee Shop",
                "Starbucks",
                "SBUX",
                false,
                "txn123",
                LocalDate.of(2024, 10, 15),
                "logo.png",
                LocalDate.of(2024, 10, 15)
        );

        // Mock the conversion
        when(transactionService.convertPlaidTransactions(anyList()))
                .thenReturn(Collections.singletonList(convertedTransaction));

        // Mock finding existing transactions to throw exception
        when(transactionService.findTransactionIdsByIds(anyList()))
                .thenThrow(new RuntimeException("Database error"));

        // Act
        boolean result = transactionRunner.syncUserTransactions(userId, startDate, endDate);

        // Assert
        assertFalse(result);
        verify(transactionManager).getTransactionsForUser(eq(userId), eq(startDate), eq(endDate));
        verify(transactionService).convertPlaidTransactions(anyList());
        verify(transactionService).findTransactionIdsByIds(anyList());
        // Verify save was never called after the exception
        verify(transactionService, never()).createAndSaveTransactions(anyList());
    }


    @AfterEach
    void tearDown() {
    }
}