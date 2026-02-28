package com.app.budgetbuddy.workbench;
import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.workbench.budget.DailyBudgetCategoryBuilderService;
import com.app.budgetbuddy.workbench.budget.MonthlyBudgetCategoryBuilderService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest
@Slf4j
class BudgetCategoryAsyncServiceTest
{
    @MockBean
    private DailyBudgetCategoryBuilderService dailyBudgetCategoryBuilderService;

    @MockBean
    private MonthlyBudgetCategoryBuilderService monthlyBudgetCategoryBuilderService;

    @MockBean
    private BudgetCategoryService budgetCategoryService;

    @MockBean
    private DailyBudgetCategoryStrategy dailyBudgetCategoryStrategy;

    @MockBean
    private WeeklyBudgetCategoryStrategy weeklyBudgetCategoryStrategy;

    @MockBean
    private MonthlyBudgetCategoryStrategy monthlyBudgetCategoryStrategy;

    @Autowired
    private BudgetCategoryAsyncService budgetCategoryAsyncService;

    @BeforeEach
    void setUp()
    {
        when(dailyBudgetCategoryStrategy.supports(Period.DAILY)).thenReturn(true);
        when(weeklyBudgetCategoryStrategy.supports(Period.WEEKLY)).thenReturn(true);
        when(monthlyBudgetCategoryStrategy.supports(Period.MONTHLY)).thenReturn(true);
        when(dailyBudgetCategoryStrategy.supports(Period.WEEKLY)).thenReturn(false);
        when(dailyBudgetCategoryStrategy.supports(Period.MONTHLY)).thenReturn(false);
        when(weeklyBudgetCategoryStrategy.supports(Period.DAILY)).thenReturn(false);
        when(weeklyBudgetCategoryStrategy.supports(Period.MONTHLY)).thenReturn(false);
        when(monthlyBudgetCategoryStrategy.supports(Period.DAILY)).thenReturn(false);
        when(monthlyBudgetCategoryStrategy.supports(Period.WEEKLY)).thenReturn(false);
    }

    // ─── saveAsyncBudgetCategories ────────────────────────────────────────────

    @Test
    void testSaveAsyncBudgetCategories_whenBudgetCategoryListIsEmpty_thenReturnEmptyList() throws Exception
    {
        CompletableFuture<List<BudgetCategory>> future = budgetCategoryAsyncService.saveAsyncBudgetCategories(new ArrayList<>());
        List<BudgetCategory> actual = future.get(5, TimeUnit.SECONDS);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testSaveAsyncBudgetCategories_whenBudgetCategoryListIsNull_thenReturnEmptyList() throws Exception
    {
        CompletableFuture<List<BudgetCategory>> future = budgetCategoryAsyncService.saveAsyncBudgetCategories(null);
        List<BudgetCategory> actual = future.get(5, TimeUnit.SECONDS);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testSaveAsyncBudgetCategories_whenValidBudgetCategories_thenReturnSavedList() throws Exception
    {
        List<BudgetCategory> expected = createTestBudgetCategories();
        when(budgetCategoryService.saveAll(expected)).thenReturn(expected);

        CompletableFuture<List<BudgetCategory>> future = budgetCategoryAsyncService.saveAsyncBudgetCategories(expected);
        List<BudgetCategory> actual = future.get(5, TimeUnit.SECONDS);

        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for(int i = 0; i < expected.size(); i++)
        {
            assertEquals(expected.get(i).getCategoryName(), actual.get(i).getCategoryName());
            assertEquals(expected.get(i).getSubBudgetId(), actual.get(i).getSubBudgetId());
            assertEquals(expected.get(i).getBudgetedAmount(), actual.get(i).getBudgetedAmount());
            assertEquals(expected.get(i).getBudgetActual(), actual.get(i).getBudgetActual());
            assertEquals(expected.get(i).getStartDate(), actual.get(i).getStartDate());
            assertEquals(expected.get(i).getEndDate(), actual.get(i).getEndDate());
            assertEquals(expected.get(i).getIsActive(), actual.get(i).getIsActive());
            assertEquals(expected.get(i).isOverSpent(), actual.get(i).isOverSpent());
            assertEquals(expected.get(i).getOverSpendingAmount(), actual.get(i).getOverSpendingAmount());
        }
        verify(budgetCategoryService).saveAll(expected);
    }

    @Test
    void testSaveAsyncBudgetCategories_whenExceptionThrown_thenReturnEmptyList() throws Exception
    {
        List<BudgetCategory> expected = createTestBudgetCategories();
        when(budgetCategoryService.saveAll(expected)).thenThrow(new CompletionException(new RuntimeException("Test exception")));

        CompletableFuture<List<BudgetCategory>> future = budgetCategoryAsyncService.saveAsyncBudgetCategories(expected);
        List<BudgetCategory> actual = future.get(5, TimeUnit.SECONDS);

        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    // ─── createAsync ─────────────────────────────────────────────────────────

    @Test
    void testCreateAsync_whenNullSubBudget_thenReturnEmptyList() throws Exception
    {
        CompletableFuture<List<BudgetCategory>> future = budgetCategoryAsyncService.createAsync(
                null, createTestTransactionsByCategory(), createAprilBudgetScheduleRanges().get(0), Period.WEEKLY);
        assertTrue(future.get(5, TimeUnit.SECONDS).isEmpty());
    }

    @Test
    void testCreateAsync_whenNullTransactions_thenReturnEmptyList() throws Exception
    {
        CompletableFuture<List<BudgetCategory>> future = budgetCategoryAsyncService.createAsync(
                createTestSubBudget(), null, createAprilBudgetScheduleRanges().get(0), Period.WEEKLY);
        assertTrue(future.get(5, TimeUnit.SECONDS).isEmpty());
    }

    @Test
    void testCreateAsync_whenNullRange_thenReturnEmptyList() throws Exception
    {
        CompletableFuture<List<BudgetCategory>> future = budgetCategoryAsyncService.createAsync(
                createTestSubBudget(), createTestTransactionsByCategory(), null, Period.WEEKLY);
        assertTrue(future.get(5, TimeUnit.SECONDS).isEmpty());
    }

    @Test
    void testCreateAsync_whenWeeklyPeriod_thenReturnBudgetCategories() throws Exception
    {
        SubBudget subBudget = createTestSubBudget();
        List<TransactionsByCategory> transactions = createTestTransactionsByCategory();
        BudgetScheduleRange range = createAprilBudgetScheduleRanges().get(0);
        List<BudgetCategory> expected = createTestBudgetCategories();

        when(weeklyBudgetCategoryStrategy.build(subBudget, transactions, range)).thenReturn(expected);
        when(budgetCategoryService.saveAll(expected)).thenReturn(expected);

        CompletableFuture<List<BudgetCategory>> future = budgetCategoryAsyncService.createAsync(
                subBudget, transactions, range, Period.WEEKLY);
        List<BudgetCategory> actual = future.get(5, TimeUnit.SECONDS);

        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        verify(weeklyBudgetCategoryStrategy).build(subBudget, transactions, range);
        verify(budgetCategoryService).saveAll(expected);
    }

    @Test
    void testCreateAsync_whenDailyPeriod_thenReturnBudgetCategories() throws Exception
    {
        SubBudget subBudget = createTestSubBudget();
        List<TransactionsByCategory> transactions = createTestTransactionsByCategory();
        BudgetScheduleRange range = createAprilBudgetScheduleRanges().get(0);
        List<BudgetCategory> expected = createTestBudgetCategories();

        when(dailyBudgetCategoryStrategy.build(subBudget, transactions, range)).thenReturn(expected);
        when(budgetCategoryService.saveAll(expected)).thenReturn(expected);

        CompletableFuture<List<BudgetCategory>> future = budgetCategoryAsyncService.createAsync(
                subBudget, transactions, range, Period.DAILY);
        List<BudgetCategory> actual = future.get(5, TimeUnit.SECONDS);

        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        verify(dailyBudgetCategoryStrategy).build(subBudget, transactions, range);
    }

    @Test
    void testCreateAsync_whenMonthlyPeriod_thenReturnBudgetCategories() throws Exception
    {
        SubBudget subBudget = createTestSubBudget();
        List<TransactionsByCategory> transactions = createTestTransactionsByCategory();
        BudgetScheduleRange range = createAprilBudgetScheduleRanges().get(0);
        List<BudgetCategory> expected = createTestBudgetCategories();

        when(monthlyBudgetCategoryStrategy.build(subBudget, transactions, range)).thenReturn(expected);
        when(budgetCategoryService.saveAll(expected)).thenReturn(expected);

        CompletableFuture<List<BudgetCategory>> future = budgetCategoryAsyncService.createAsync(
                subBudget, transactions, range, Period.MONTHLY);
        List<BudgetCategory> actual = future.get(5, TimeUnit.SECONDS);

        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        verify(monthlyBudgetCategoryStrategy).build(subBudget, transactions, range);
    }

    // ─── updateAsync ─────────────────────────────────────────────────────────

    @Test
    void testUpdateAsync_whenNullSubBudget_thenReturnEmptyList() throws Exception
    {
        CompletableFuture<List<BudgetCategory>> future = budgetCategoryAsyncService.updateAsync(
                null, createTestTransactionsByCategory(), createTestBudgetCategories(),
                createAprilBudgetScheduleRanges().get(0), Period.WEEKLY);
        assertTrue(future.get(5, TimeUnit.SECONDS).isEmpty());
    }

    @Test
    void testUpdateAsync_whenNullExisting_thenReturnEmptyList() throws Exception
    {
        CompletableFuture<List<BudgetCategory>> future = budgetCategoryAsyncService.updateAsync(
                createTestSubBudget(), createTestTransactionsByCategory(), null,
                createAprilBudgetScheduleRanges().get(0), Period.WEEKLY);
        assertTrue(future.get(5, TimeUnit.SECONDS).isEmpty());
    }

    @Test
    void testUpdateAsync_whenWeeklyPeriod_thenReturnUpdatedCategories() throws Exception
    {
        SubBudget subBudget = createTestSubBudget();
        List<TransactionsByCategory> transactions = createTestTransactionsByCategory();
        List<BudgetCategory> existing = createTestBudgetCategories();
        BudgetScheduleRange range = createAprilBudgetScheduleRanges().get(0);
        List<BudgetCategory> expected = createTestBudgetCategories();

        when(weeklyBudgetCategoryStrategy.update(subBudget, transactions, existing, range)).thenReturn(expected);
        when(budgetCategoryService.saveAll(expected)).thenReturn(expected);

        CompletableFuture<List<BudgetCategory>> future = budgetCategoryAsyncService.updateAsync(
                subBudget, transactions, existing, range, Period.WEEKLY);
        List<BudgetCategory> actual = future.get(5, TimeUnit.SECONDS);

        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        verify(weeklyBudgetCategoryStrategy).update(subBudget, transactions, existing, range);
        verify(budgetCategoryService).saveAll(expected);
    }

    // ─── fetchExistingBudgetCategoriesByDateRange ─────────────────────────────

    @Test
    void testFetchExistingBudgetCategoriesByDateRange_whenValidParams_thenReturnList() throws Exception
    {
        LocalDate startDate = LocalDate.of(2025, 4, 1);
        LocalDate endDate   = LocalDate.of(2025, 4, 7);
        Long subBudgetId    = 1L;
        List<BudgetCategory> expected = createTestBudgetCategories();

        when(budgetCategoryService.getBudgetCategoryListByBudgetIdAndDateRange(subBudgetId, startDate, endDate))
                .thenReturn(expected);

        CompletableFuture<List<BudgetCategory>> future = budgetCategoryAsyncService
                .fetchExistingBudgetCategoriesByDateRange(startDate, endDate, subBudgetId);
        List<BudgetCategory> actual = future.get(5, TimeUnit.SECONDS);

        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        verify(budgetCategoryService).getBudgetCategoryListByBudgetIdAndDateRange(subBudgetId, startDate, endDate);
    }

    // ─── helpers (unchanged) ──────────────────────────────────────────────────

    private List<BudgetScheduleRange> createAprilBudgetScheduleRanges()
    {
        List<BudgetScheduleRange> budgetScheduleRanges = new ArrayList<>();
        BudgetScheduleRange budgetScheduleRange1 = new BudgetScheduleRange();
        budgetScheduleRange1.setBudgetScheduleId(4L);
        budgetScheduleRange1.setId(15L);
        budgetScheduleRange1.setStartRange(LocalDate.of(2025, 4, 1));
        budgetScheduleRange1.setEndRange(LocalDate.of(2025, 4, 7));
        budgetScheduleRange1.setBudgetedAmount(BigDecimal.valueOf(598.050));
        budgetScheduleRange1.setBudgetDateRange(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7)));
        budgetScheduleRange1.setRangeType("Week");
        budgetScheduleRange1.setSpentOnRange(BigDecimal.valueOf(0));
        budgetScheduleRanges.add(budgetScheduleRange1);
        return budgetScheduleRanges;
    }

    private Transaction createTransaction(String id, BigDecimal amount, LocalDate date)
    {
        Transaction transaction = new Transaction();
        transaction.setTransactionId(id);
        transaction.setAmount(amount);
        transaction.setPosted(date);
        transaction.setDate(date);
        return transaction;
    }

    private List<BudgetCategory> createTestBudgetCategories()
    {
        List<BudgetCategory> budgetCategories = new ArrayList<>();

        BudgetCategory groceryWeek1 = new BudgetCategory();
        groceryWeek1.setSubBudgetId(1L);
        groceryWeek1.setCategoryName("Groceries");
        groceryWeek1.setStartDate(LocalDate.of(2025, 4, 1));
        groceryWeek1.setEndDate(LocalDate.of(2025, 4, 7));
        groceryWeek1.setBudgetActual(120.00);
        groceryWeek1.setBudgetedAmount(400.00);
        groceryWeek1.setIsActive(true);
        groceryWeek1.setOverSpent(false);
        groceryWeek1.setTransactions(List.of(createTransaction("gt1", BigDecimal.valueOf(120.00), LocalDate.of(2025, 4, 3))));
        budgetCategories.add(groceryWeek1);

        BudgetCategory rentWeek1 = new BudgetCategory();
        rentWeek1.setSubBudgetId(1L);
        rentWeek1.setCategoryName("Rent");
        rentWeek1.setStartDate(LocalDate.of(2025, 4, 1));
        rentWeek1.setEndDate(LocalDate.of(2025, 4, 7));
        rentWeek1.setBudgetActual(1200.00);
        rentWeek1.setBudgetedAmount(1200.00);
        rentWeek1.setIsActive(true);
        rentWeek1.setOverSpent(false);
        rentWeek1.setTransactions(List.of(createTransaction("rt1", BigDecimal.valueOf(1200.00), LocalDate.of(2025, 4, 1))));
        budgetCategories.add(rentWeek1);

        return budgetCategories;
    }

    private SubBudget createTestSubBudget()
    {
        SubBudget subBudget = new SubBudget();
        subBudget.setId(4L);
        subBudget.setAllocatedAmount(BigDecimal.valueOf(3260));
        subBudget.setSpentOnBudget(BigDecimal.valueOf(1609));
        subBudget.setStartDate(LocalDate.of(2025, 4, 1));
        subBudget.setEndDate(LocalDate.of(2025, 4, 30));
        subBudget.setActive(true);
        subBudget.setBudgetSchedule(List.of(createTestBudgetSchedule()));
        SubBudgetGoals subBudgetGoals = new SubBudgetGoals();
        subBudgetGoals.setId(4L);
        subBudgetGoals.setSubBudgetId(4L);
        subBudgetGoals.setSavingsTarget(BigDecimal.valueOf(208));
        subBudgetGoals.setContributedAmount(BigDecimal.valueOf(120));
        subBudgetGoals.setRemaining(BigDecimal.valueOf(88));
        subBudgetGoals.setStatus(GoalStatus.IN_PROGRESS);
        subBudget.setSubBudgetGoals(subBudgetGoals);
        return subBudget;
    }

    private BudgetSchedule createTestBudgetSchedule()
    {
        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setBudgetScheduleId(4L);
        budgetSchedule.setStartDate(LocalDate.of(2025, 4, 1));
        budgetSchedule.setEndDate(LocalDate.of(2025, 4, 30));
        budgetSchedule.setBudgetScheduleRanges(createAprilBudgetScheduleRanges());
        return budgetSchedule;
    }

    private List<TransactionsByCategory> createTestTransactionsByCategory()
    {
        List<TransactionsByCategory> transactionsByCategory = new ArrayList<>();

        List<Transaction> groceryTransactions = new ArrayList<>();
        groceryTransactions.add(createTransaction("gt1", BigDecimal.valueOf(120.00), LocalDate.of(2025, 4, 3)));
        groceryTransactions.add(createTransaction("gt2", BigDecimal.valueOf(150.00), LocalDate.of(2025, 4, 10)));
        transactionsByCategory.add(new TransactionsByCategory("Groceries", groceryTransactions));

        List<Transaction> rentTransactions = new ArrayList<>();
        rentTransactions.add(createTransaction("rt1", BigDecimal.valueOf(1200.00), LocalDate.of(2025, 4, 1)));
        transactionsByCategory.add(new TransactionsByCategory("Rent", rentTransactions));

        return transactionsByCategory;
    }

    @AfterEach
    void tearDown() {}
}