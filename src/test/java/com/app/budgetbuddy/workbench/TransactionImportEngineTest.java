package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.services.SubBudgetService;
import com.app.budgetbuddy.workbench.runner.CategoryRunner;
import com.app.budgetbuddy.workbench.runner.PlaidTransactionRunner;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionImportEngineTest
{
    @Mock
    private TransactionImportAsyncService transactionImportAsyncService;

    @Mock
    private SubBudgetService subBudgetService;

    @Mock
    private CategoryRunner categoryRunner;

    private TransactionImportEngine transactionImportEngine;

    private Long TEST_USER_ID = 1L;
    private int currentYear = LocalDate.now().getYear();
    private final LocalDate budgetBeginDate = LocalDate.of(currentYear, 1, 1);
    private int numOfMonthsSinceCurrentDate = LocalDate.now().getMonthValue() - budgetBeginDate.getMonthValue();

    private List<SubBudget> mockSubBudgets = new ArrayList<>();
    private List<Transaction> mockTransactions = new ArrayList<>();
    private Budget mockBudget;

    @BeforeEach
    void setUp() {

        mockSubBudgets = createMockSubBudgets();

        mockBudget = new Budget();
        mockBudget.setId(1L);
        mockBudget.setUserId(TEST_USER_ID);
        mockBudget.setBudgetAmount(new BigDecimal("39000"));
        mockBudget.setSubBudgets(mockSubBudgets);
        mockBudget.setBudgetName("2025 Budget Test");
        mockBudget.setBudgetYear(2025);

        transactionImportEngine = new TransactionImportEngine(transactionImportAsyncService, categoryRunner, subBudgetService);
    }

    @AfterEach
    void tearDown() {
    }


    @Test
    @DisplayName("Should return five month ranges for test user")
    void testShouldReturnFiveMonthRanges(){

        when(subBudgetService.findSubBudgetsByUserIdAndLimit(TEST_USER_ID, numOfMonthsSinceCurrentDate, currentYear))
                .thenReturn(mockSubBudgets);

        List<DateRange> monthRanges = transactionImportEngine.getMonthDateRangesByCurrentDate(TEST_USER_ID);
        assertNotNull(monthRanges);
        assertEquals(5, monthRanges.size());
    }

    @Test
    @DisplayName("Should return empty list when no months ranges found")
    void testShouldReturnEmptyListWhenNoMonthsRangeFound(){
        when(subBudgetService.findSubBudgetsByUserIdAndLimit(TEST_USER_ID, numOfMonthsSinceCurrentDate, currentYear))
                .thenReturn(new ArrayList<>());
        List<DateRange> actual = transactionImportEngine.getMonthDateRangesByCurrentDate(TEST_USER_ID);
        assertNotNull(actual);
        assertEquals(0, actual.size());
    }

    @Test
    @DisplayName("Should import transactions for valid user")
    void testShouldImportTransactionsForValidUser() throws IOException {
        List<Transaction> transactions = transactionImportEngine.importMonthlyTransactions(TEST_USER_ID);
        assertNotNull(transactions);
        assertEquals(mockTransactions.size() * mockSubBudgets.size(), transactions.size());
        verify(subBudgetService).findSubBudgetsByUserIdAndLimit(TEST_USER_ID, numOfMonthsSinceCurrentDate, currentYear);
    }

//    @Test
//    @DisplayName("Should process multiple months concurrently")
//    void shouldProcessMultipleMonthsConcurrently() throws InterruptedException, IOException {
//        // Given - Setup multiple months of data
//        List<SubBudget> multipleMonthBudgets = createMultipleMonthSubBudgets();
//        when(subBudgetService.findSubBudgetsByUserIdAndLimit(TEST_USER_ID, numOfMonthsSinceCurrentDate, currentYear))
//                .thenReturn(multipleMonthBudgets);
//
//        // When
//        long startTime = System.currentTimeMillis();
//        List<Transaction> result = transactionImportService.importMonthlyTransactions(TEST_USER_ID);
//        long endTime = System.currentTimeMillis();
//
//        // Then
//        assertNotNull(result);
//        assertThat(endTime - startTime).isLessThan(5000); // Should complete within 5 seconds
//
//        // Verify all months were processed
//        verify(plaidTransactionManager, times(getTotalExpectedWeekCalls(multipleMonthBudgets)))
//                .fetchPlaidTransactionsByDateRange(eq(TEST_USER_ID), any(LocalDate.class), any(LocalDate.class));
//    }
//
//    @Test
//    @DisplayName("Should handle exception when month thread process fails")
//    void shouldHandleExceptionWhenMonthThreadProcessFails() throws InterruptedException, IOException {
//        // Given - Setup data that will cause an exception during processing
//        List<SubBudget> multipleMonthBudgets = createMultipleMonthSubBudgets();
//        when(subBudgetService.findSubBudgetsByUserIdAndLimit(TEST_USER_ID, numOfMonthsSinceCurrentDate, currentYear))
//                .thenReturn(multipleMonthBudgets);
//
//        // Configure plaidTransactionManager to throw an exception
//        when(plaidTransactionManager.fetchPlaidTransactionsByDateRange(any(), any(), any()))
//                .thenThrow(new RuntimeException("Simulated month processing failure"));
//
//        // When - The service should handle the exception gracefully
//        List<Transaction> result = transactionImportService.importMonthlyTransactions(TEST_USER_ID);
//
//        // Then - Should return empty list, not throw exception
//        assertThat(result).isNotNull();
//        assertThat(result).isEmpty(); // Your service handles exceptions by returning empty collections
//
//        // Verify that the service methods were still called
//        verify(subBudgetService).findSubBudgetsByUserIdAndLimit(TEST_USER_ID, numOfMonthsSinceCurrentDate, currentYear);
//        verify(plaidTransactionManager, atLeast(1)).fetchPlaidTransactionsByDateRange(any(), any(), any());
//    }

    @Test
    @DisplayName("Should handle empty month date ranges and return empty list")
    void shouldHandleEmptyMonthDateRanges() throws InterruptedException, IOException {
        when(subBudgetService.findSubBudgetsByUserIdAndLimit(TEST_USER_ID, numOfMonthsSinceCurrentDate, currentYear))
                .thenReturn(Collections.emptyList());
        List<Transaction> actual = transactionImportEngine.importMonthlyTransactions(TEST_USER_ID);
        assertNotNull(actual);
        assertEquals(0, actual.size());
    }
//
//    @Test
//    @DisplayName("Should handle exception in outer try-catch and return empty list")
//    void shouldHandleExceptionInOuterTryCatch() throws IOException {
//        // Given - Mock the subBudgetService to throw an exception during the initial call
//        when(subBudgetService.findSubBudgetsByUserIdAndLimit(TEST_USER_ID, numOfMonthsSinceCurrentDate, currentYear))
//                .thenThrow(new RuntimeException("Database connection failed"));
//
//        // When - The outer try-catch should handle this exception
//        List<Transaction> result = transactionImportService.importMonthlyTransactions(TEST_USER_ID);
//
//        // Then - Should return empty list instead of throwing exception
//        assertThat(result).isNotNull();
//        assertThat(result).isEmpty();
//
//        // Verify the service was called (and failed)
//        verify(subBudgetService).findSubBudgetsByUserIdAndLimit(TEST_USER_ID, numOfMonthsSinceCurrentDate, currentYear);
//
//        // Verify that PlaidTransactionManager was never called due to early failure
//        verify(plaidTransactionManager, never()).fetchPlaidTransactionsByDateRange(any(), any(), any());
//    }

    private int getTotalExpectedWeekCalls(List<SubBudget> subBudgets) {
        return subBudgets.stream()
                .mapToInt(subBudget -> {
                    DateRange monthRange = new DateRange(subBudget.getStartDate(), subBudget.getEndDate());
                    return monthRange.splitIntoWeeks().size();
                })
                .sum();
    }

    private List<SubBudget> createMockSubBudgets() {
        List<SubBudget> subBudgets = new ArrayList<>();

        // Create 5 months of sub-budgets
        for (int i = 0; i < 5; i++) {
            SubBudget subBudget = new SubBudget();
            subBudget.setId((long) (i + 1));
            subBudget.setStartDate(LocalDate.of(currentYear, i + 1, 1));
            subBudget.setEndDate(LocalDate.of(currentYear, i + 1, 1).plusMonths(1).minusDays(1));
            subBudget.setYear(currentYear);
            subBudgets.add(subBudget);
        }

        return subBudgets;
    }

    private List<SubBudget> createMultipleMonthSubBudgets() {
        List<SubBudget> subBudgets = new ArrayList<>();

        // Create more months for concurrency testing
        for (int i = 0; i < Math.max(5, numOfMonthsSinceCurrentDate); i++) {
            SubBudget subBudget = new SubBudget();
            subBudget.setId((long) (i + 1));
            subBudget.setStartDate(LocalDate.of(currentYear, i + 1, 1));
            subBudget.setEndDate(LocalDate.of(currentYear, i + 1, 1).plusMonths(1).minusDays(1));
            subBudget.setYear(currentYear);
            subBudgets.add(subBudget);
        }

        return subBudgets;
    }

    private List<Transaction> createMockTransactions() {
        List<Transaction> transactions = new ArrayList<>();

        for (int i = 0; i < 5; i++) {
            String transactionKey = "#11";
            Transaction transaction = new Transaction();
            transaction.setTransactionId((long) (i + 1) + transactionKey);
            transaction.setPosted(LocalDate.now().minusDays(i));
            transaction.setAmount(BigDecimal.valueOf(100.00 + i * 10));
            transaction.setDescription("Test Transaction " + (i + 1));

            transactions.add(transaction);
        }

        return transactions;
    }
}