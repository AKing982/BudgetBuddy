package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.services.TransactionService;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.app.budgetbuddy.workbench.runner.TransactionRunner;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
    void testFetchPlaidTransactionsByDate_whenStartDateIsNull_returnFalse() {

    }


    @AfterEach
    void tearDown() {
    }
}