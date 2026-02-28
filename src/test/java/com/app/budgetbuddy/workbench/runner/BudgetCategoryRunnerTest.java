package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.services.*;

import com.app.budgetbuddy.workbench.BudgetCategoryAsyncService;
import com.app.budgetbuddy.workbench.budget.BudgetCategoryBuilderFactory;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BudgetCategoryRunnerTest
{
    @Mock
    private TransactionsByCategoryLoaderService transactionFetcher;

    @Mock
    private BudgetCategoryAsyncService budgetCategoryAsyncService;

    @InjectMocks
    private BudgetCategoryRunner budgetCategoryRunner;

    private SubBudget testSubBudget;
    private BudgetScheduleRange testRange;
    private List<TransactionsByCategory> testTransactions;
    private List<BudgetCategory> testBudgetCategories;

    @BeforeEach
    void setUp()
    {
        testRange = new BudgetScheduleRange();
        testRange.setId(1L);
        testRange.setStartRange(LocalDate.of(2025, 4, 1));
        testRange.setEndRange(LocalDate.of(2025, 4, 7));

        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setBudgetScheduleId(1L);
        budgetSchedule.setStartDate(LocalDate.of(2025, 4, 1));
        budgetSchedule.setEndDate(LocalDate.of(2025, 4, 30));
        budgetSchedule.setBudgetScheduleRanges(List.of(testRange));

        testSubBudget = new SubBudget();
        testSubBudget.setId(1L);
        testSubBudget.setStartDate(LocalDate.of(2025, 4, 1));
        testSubBudget.setEndDate(LocalDate.of(2025, 4, 30));
        testSubBudget.setAllocatedAmount(BigDecimal.valueOf(3260));
        testSubBudget.setBudgetSchedule(List.of(budgetSchedule));

        Budget budget = new Budget();
        budget.setId(1L);
        budget.setUserId(1L);
        budget.setBudgetAmount(BigDecimal.valueOf(3260));
        testSubBudget.setBudget(budget);

        testTransactions = List.of(
                new TransactionsByCategory("Groceries", List.of()),
                new TransactionsByCategory("Rent", List.of())
        );

        BudgetCategory groceries = new BudgetCategory();
        groceries.setSubBudgetId(1L);
        groceries.setCategoryName("Groceries");
        groceries.setBudgetedAmount(450.0);
        groceries.setBudgetActual(120.0);
        groceries.setStartDate(LocalDate.of(2025, 4, 1));
        groceries.setEndDate(LocalDate.of(2025, 4, 7));
        groceries.setIsActive(true);

        BudgetCategory rent = new BudgetCategory();
        rent.setSubBudgetId(1L);
        rent.setCategoryName("Rent");
        rent.setBudgetedAmount(1917.0);
        rent.setBudgetActual(1917.0);
        rent.setStartDate(LocalDate.of(2025, 4, 1));
        rent.setEndDate(LocalDate.of(2025, 4, 7));
        rent.setIsActive(true);

        testBudgetCategories = List.of(groceries, rent);
    }

    // ─── runBudgetCategoryProcessForMonth ────────────────────────────────────

    @Test
    void testRunBudgetCategoryProcessForMonth_whenValidSubBudget_thenReturnBudgetCategories()
    {
        when(transactionFetcher.fetchAndMergeForMonth(testSubBudget)).thenReturn(testTransactions);
        when(budgetCategoryAsyncService.createAsync(testSubBudget, testTransactions, testRange, Period.MONTHLY))
                .thenReturn(CompletableFuture.completedFuture(testBudgetCategories));

        List<BudgetCategory> actual = budgetCategoryRunner.runBudgetCategoryProcessForMonth(testSubBudget);

        assertNotNull(actual);
        assertEquals(testBudgetCategories.size(), actual.size());
        verify(transactionFetcher).fetchAndMergeForMonth(testSubBudget);
        verify(budgetCategoryAsyncService).createAsync(testSubBudget, testTransactions, testRange, Period.MONTHLY);
    }

    @Test
    void testRunBudgetCategoryProcessForMonth_whenAsyncReturnsEmpty_thenReturnEmptyList()
    {
        when(transactionFetcher.fetchAndMergeForMonth(testSubBudget)).thenReturn(testTransactions);
        when(budgetCategoryAsyncService.createAsync(testSubBudget, testTransactions, testRange, Period.MONTHLY))
                .thenReturn(CompletableFuture.completedFuture(Collections.emptyList()));

        List<BudgetCategory> actual = budgetCategoryRunner.runBudgetCategoryProcessForMonth(testSubBudget);

        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    // ─── runBudgetCategoryCreateProcessForWeek ────────────────────────────────

    @Test
    void testRunBudgetCategoryCreateProcessForWeek_whenValidParams_thenReturnBudgetCategories()
    {
        when(transactionFetcher.fetchAndMergeForRange(testRange, testSubBudget)).thenReturn(testTransactions);
        when(budgetCategoryAsyncService.createAsync(testSubBudget, testTransactions, testRange, Period.WEEKLY))
                .thenReturn(CompletableFuture.completedFuture(testBudgetCategories));

        List<BudgetCategory> actual = budgetCategoryRunner.runBudgetCategoryCreateProcessForWeek(testSubBudget, testRange);

        assertNotNull(actual);
        assertEquals(testBudgetCategories.size(), actual.size());
        verify(transactionFetcher).fetchAndMergeForRange(testRange, testSubBudget);
        verify(budgetCategoryAsyncService).createAsync(testSubBudget, testTransactions, testRange, Period.WEEKLY);
    }

    @Test
    void testRunBudgetCategoryCreateProcessForWeek_whenAsyncThrows_thenReturnEmptyList()
    {
        when(transactionFetcher.fetchAndMergeForRange(testRange, testSubBudget)).thenReturn(testTransactions);
        when(budgetCategoryAsyncService.createAsync(testSubBudget, testTransactions, testRange, Period.WEEKLY))
                .thenReturn(CompletableFuture.failedFuture(new CompletionException(new RuntimeException("async error"))));

        List<BudgetCategory> actual = budgetCategoryRunner.runBudgetCategoryCreateProcessForWeek(testSubBudget, testRange);

        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    // ─── runBudgetCategoryProcessForDate ─────────────────────────────────────

    @Test
    void testRunBudgetCategoryProcessForDate_whenValidDate_thenReturnBudgetCategories()
    {
        LocalDate date = LocalDate.of(2025, 4, 3);
        when(transactionFetcher.fetchByDate(testSubBudget, date)).thenReturn(testTransactions);
        when(budgetCategoryAsyncService.createAsync(testSubBudget, testTransactions, testRange, Period.DAILY))
                .thenReturn(CompletableFuture.completedFuture(testBudgetCategories));

        List<BudgetCategory> actual = budgetCategoryRunner.runBudgetCategoryProcessForDate(date, testSubBudget);

        assertNotNull(actual);
        assertEquals(testBudgetCategories.size(), actual.size());
        verify(transactionFetcher).fetchByDate(testSubBudget, date);
    }

    // ─── runBudgetCategoryUpdateProcessForBudgetScheduleRange ────────────────

    @Test
    void testRunBudgetCategoryUpdateProcessForBudgetScheduleRange_whenValidParams_thenReturnUpdatedCategories()
    {
        Long userId = 1L;
        when(transactionFetcher.fetchAndMergeForRange(testRange, testSubBudget)).thenReturn(testTransactions);
        when(budgetCategoryAsyncService.fetchExistingBudgetCategoriesByDateRange(
                testRange.getStartRange(), testRange.getEndRange(), testSubBudget.getId()))
                .thenReturn(CompletableFuture.completedFuture(testBudgetCategories));
        when(budgetCategoryAsyncService.updateAsync(testSubBudget, testTransactions, testBudgetCategories, testRange, Period.WEEKLY))
                .thenReturn(CompletableFuture.completedFuture(testBudgetCategories));

        List<BudgetCategory> actual = budgetCategoryRunner.runBudgetCategoryUpdateProcessForBudgetScheduleRange(testRange, testSubBudget, userId);

        assertNotNull(actual);
        assertEquals(testBudgetCategories.size(), actual.size());
        verify(budgetCategoryAsyncService).updateAsync(testSubBudget, testTransactions, testBudgetCategories, testRange, Period.WEEKLY);
    }

    // ─── runBudgetCategoryUpdateProcessForMonth ───────────────────────────────

    @Test
    void testRunBudgetCategoryUpdateProcessForMonth_whenValidSubBudget_thenReturnUpdatedCategories()
    {
        when(transactionFetcher.fetchAndMergeForMonth(testSubBudget)).thenReturn(testTransactions);
        when(budgetCategoryAsyncService.fetchExistingBudgetCategoriesByDateRange(
                testSubBudget.getStartDate(), testSubBudget.getEndDate(), testSubBudget.getId()))
                .thenReturn(CompletableFuture.completedFuture(testBudgetCategories));
        when(budgetCategoryAsyncService.updateAsync(
                eq(testSubBudget), eq(testTransactions), eq(testBudgetCategories), eq(testRange), eq(Period.MONTHLY)))
                .thenReturn(CompletableFuture.completedFuture(testBudgetCategories));

        List<BudgetCategory> actual = budgetCategoryRunner.runBudgetCategoryUpdateProcessForMonth(testSubBudget);

        assertNotNull(actual);
        assertEquals(testBudgetCategories.size(), actual.size());
        verify(transactionFetcher).fetchAndMergeForMonth(testSubBudget);
        verify(budgetCategoryAsyncService).updateAsync(
                eq(testSubBudget), eq(testTransactions), eq(testBudgetCategories), eq(testRange), eq(Period.MONTHLY));
    }

    // ─── runBudgetCategoryUpdateProcessForDate ────────────────────────────────

    @Test
    void testRunBudgetCategoryUpdateProcessForDate_whenValidDate_thenReturnUpdatedCategories()
    {
        LocalDate date = LocalDate.of(2025, 4, 3);
        when(transactionFetcher.fetchByDate(testSubBudget, date)).thenReturn(testTransactions);
        when(budgetCategoryAsyncService.fetchExistingBudgetCategoriesByDateRange(
                testSubBudget.getStartDate(), testSubBudget.getEndDate(), testSubBudget.getId()))
                .thenReturn(CompletableFuture.completedFuture(testBudgetCategories));
        when(budgetCategoryAsyncService.updateAsync(testSubBudget, testTransactions, testBudgetCategories, testRange, Period.DAILY))
                .thenReturn(CompletableFuture.completedFuture(testBudgetCategories));

        List<BudgetCategory> actual = budgetCategoryRunner.runBudgetCategoryUpdateProcessForDate(date, testSubBudget);

        assertNotNull(actual);
        assertEquals(testBudgetCategories.size(), actual.size());
        verify(transactionFetcher).fetchByDate(testSubBudget, date);
    }

    // ─── saveBudgetCategories ─────────────────────────────────────────────────

    @Test
    void testSaveBudgetCategories_whenValidList_thenReturnTrue()
    {
        when(budgetCategoryAsyncService.saveAsyncBudgetCategories(testBudgetCategories))
                .thenReturn(CompletableFuture.completedFuture(testBudgetCategories));

        boolean actual = budgetCategoryRunner.saveBudgetCategories(testBudgetCategories);
        assertTrue(actual);
        verify(budgetCategoryAsyncService).saveAsyncBudgetCategories(testBudgetCategories);
    }

    @Test
    void testSaveBudgetCategories_whenEmptyList_thenReturnFalse()
    {
        when(budgetCategoryAsyncService.saveAsyncBudgetCategories(Collections.emptyList()))
                .thenReturn(CompletableFuture.completedFuture(Collections.emptyList()));

        boolean actual = budgetCategoryRunner.saveBudgetCategories(Collections.emptyList());
        assertFalse(actual);
    }

    @Test
    void testSaveBudgetCategories_whenExceptionThrown_thenReturnFalse()
    {
        when(budgetCategoryAsyncService.saveAsyncBudgetCategories(testBudgetCategories))
                .thenReturn(CompletableFuture.failedFuture(new CompletionException(new RuntimeException("save error"))));

        boolean actual = budgetCategoryRunner.saveBudgetCategories(testBudgetCategories);
        assertFalse(actual);
    }

    @AfterEach
    void tearDown() {}
}