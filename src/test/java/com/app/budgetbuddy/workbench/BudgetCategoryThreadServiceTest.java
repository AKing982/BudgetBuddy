package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.workbench.budget.BudgetCategoryBuilderFactory;
import com.app.budgetbuddy.workbench.budget.DailyBudgetCategoryBuilderService;
import com.app.budgetbuddy.workbench.budget.MonthlyBudgetCategoryBuilderService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@Slf4j
class BudgetCategoryThreadServiceTest
{
    @MockBean
    private DailyBudgetCategoryBuilderService dailyBudgetCategoryBuilderService;

    @MockBean
    private MonthlyBudgetCategoryBuilderService monthlyBudgetCategoryBuilderService;

    @MockBean
    private BudgetCategoryService budgetCategoryService;

    @MockBean
    private ThreadPoolTaskScheduler threadPoolTaskScheduler;

    @Autowired
    private BudgetCategoryThreadService budgetCategoryThreadService;

    @BeforeEach
    void setUp()
    {
        // Create a mock ScheduledExecutorService
        ScheduledExecutorService scheduledExecutorService = Executors.newScheduledThreadPool(1);

        // Configure the mock to return our real ScheduledExecutorService
        when(threadPoolTaskScheduler.getScheduledExecutor()).thenReturn(scheduledExecutorService);
    }

    @Test
    void testSaveAsyncBudgetCategories_whenBudgetCategoryListIsEmpty_thenReturnEmptyCollectionCompletable() throws Exception
    {
        List<BudgetCategory> expectedBudgetCategories = new ArrayList<>();

        CompletableFuture<List<BudgetCategory>> future = budgetCategoryThreadService.saveAsyncBudgetCategories(expectedBudgetCategories);
        List<BudgetCategory> actualBudgetCategories = future.get(5, TimeUnit.SECONDS);
        assertNotNull(actualBudgetCategories);
        assertEquals(expectedBudgetCategories.size(), actualBudgetCategories.size());
        assertTrue(actualBudgetCategories.isEmpty());
    }

    @Test
    void testSaveAsyncBudgetCategories_whenBudgetCategoryListIsNull_thenReturnEmptyCollectionCompletable() throws Exception{
        List<BudgetCategory> expectedBudgetCategories = null;
        CompletableFuture<List<BudgetCategory>> future = budgetCategoryThreadService.saveAsyncBudgetCategories(null);
        List<BudgetCategory> actualBudgetCategories = future.get(5, TimeUnit.SECONDS);
        assertNotNull(actualBudgetCategories);
        assertTrue(actualBudgetCategories.isEmpty());
    }

    @Test
    void testSaveAsyncBudgetCategories_whenValidBudgetCategories_thenReturnBudgetCategoryList() throws Exception
    {
        List<BudgetCategory> expectedBudgetCategories = createTestBudgetCategories();

        when(budgetCategoryService.saveAll(expectedBudgetCategories)).thenReturn(expectedBudgetCategories);

        CompletableFuture<List<BudgetCategory>> future = budgetCategoryThreadService.saveAsyncBudgetCategories(expectedBudgetCategories);
        List<BudgetCategory> actual = future.get(5, TimeUnit.SECONDS);
        assertNotNull(actual);
        assertEquals(expectedBudgetCategories.size(), actual.size());
        assertFalse(actual.isEmpty());

        for(int i = 0; i < expectedBudgetCategories.size(); i++) {
            BudgetCategory expected = expectedBudgetCategories.get(i);
            BudgetCategory actualCategory = actual.get(i);

            assertEquals(expected.getId(), actualCategory.getId(), "ID should match");
            assertEquals(expected.getCategoryName(), actualCategory.getCategoryName(), "Category name should match");
            assertEquals(expected.getSubBudgetId(), actualCategory.getSubBudgetId(), "SubBudget ID should match");
            assertEquals(expected.getBudgetedAmount(), actualCategory.getBudgetedAmount(), "Budgeted amount should match");
            assertEquals(expected.getBudgetActual(), actualCategory.getBudgetActual(), "Budget actual should match");
            assertEquals(expected.getStartDate(), actualCategory.getStartDate(), "Start date should match");
            assertEquals(expected.getEndDate(), actualCategory.getEndDate(), "End date should match");
            assertEquals(expected.getIsActive(), actualCategory.getIsActive(), "Active status should match");
            assertEquals(expected.isOverSpent(), actualCategory.isOverSpent(), "Overspent status should match");
            assertEquals(expected.getOverSpendingAmount(), actualCategory.getOverSpendingAmount(), "Overspending amount should match");
        }

        // Verify the service was called exactly once with the expected categories
        verify(budgetCategoryService).saveAll(expectedBudgetCategories);
    }

    @Test
    void testSaveAsyncBudgetCategories_whenCompletionExceptionThrown_thenReturnException() throws Exception
    {
        List<BudgetCategory> expectedBudgetCategories = createTestBudgetCategories();
        RuntimeException cause = new RuntimeException("Test exception");
        CompletionException expectedException = new CompletionException(cause);
        when(budgetCategoryService.saveAll(expectedBudgetCategories)).thenThrow(expectedException);
        CompletableFuture<List<BudgetCategory>> future = budgetCategoryThreadService.saveAsyncBudgetCategories(expectedBudgetCategories);
        List<BudgetCategory> actual = future.get(5, TimeUnit.SECONDS);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateAsyncBudgetCategoriesByCurrentDate_whenTransactionsByCategoryIsEmpty_thenReturnEmptyBudgetCategoryList() throws Exception{
        List<BudgetCategory> expectedBudgetCategories = createTestBudgetCategories();
        LocalDate currentDate = LocalDate.now();
        SubBudget subBudget = createTestSubBudget();
        BudgetSchedule budgetSchedule = createTestBudgetSchedule();
        List<TransactionsByCategory> transactionsByCategoryList = new ArrayList<>();

        CompletableFuture<List<BudgetCategory>> future = budgetCategoryThreadService.createAsyncBudgetCategoriesByCurrentDate(currentDate, subBudget, transactionsByCategoryList);
        List<BudgetCategory> actual = future.get(5, TimeUnit.SECONDS);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateAsyncBudgetCategoriesByCurrentDate_whenValidParams_thenReturnBudgetCategoryList() throws Exception
    {
        LocalDate currentDate = LocalDate.now();
        SubBudget subBudget = createTestSubBudget();
        BudgetSchedule budgetSchedule = createTestBudgetSchedule();
        List<TransactionsByCategory> transactionsByCategory = createTestTransactionsByCategory();
        List<BudgetCategory> expectedBudgetCategories = createTestBudgetCategories();

        CompletableFuture<List<BudgetCategory>> future = budgetCategoryThreadService.createAsyncBudgetCategoriesByCurrentDate(currentDate, subBudget, transactionsByCategory);
        List<BudgetCategory> actual = future.get(5, TimeUnit.SECONDS);
        assertNotNull(actual);
        assertEquals(expectedBudgetCategories.size(), actual.size());
        for(int i = 0; i < expectedBudgetCategories.size(); i++) {
            BudgetCategory expected = expectedBudgetCategories.get(i);
            BudgetCategory actualCategory = actual.get(i);
            assertEquals(expected.getId(), actualCategory.getId(), "ID should match");
            assertEquals(expected.getCategoryName(), actualCategory.getCategoryName(), "Category name should match");
            assertEquals(expected.getSubBudgetId(), actualCategory.getSubBudgetId(), "SubBudget ID should match");
            assertEquals(expected.getBudgetedAmount(), actualCategory.getBudgetedAmount(), "Budgeted amount should match");
            assertEquals(expected.getBudgetActual(), actualCategory.getBudgetActual(), "Budget actual should match");
            assertEquals(expected.getStartDate(), actualCategory.getStartDate(), "Start date should match");
            assertEquals(expected.getEndDate(), actualCategory.getEndDate(), "End date should match");
            assertEquals(expected.getIsActive(), actualCategory.getIsActive(), "Active status should match");
        }
    }

    private List<MonthlyCategorySpending> createTestMonthlyCategorySpending() {
        List<MonthlyCategorySpending> monthlyCategorySpending = new ArrayList<>();

        // Groceries spending
        MonthlyCategorySpending grocerySpending = new MonthlyCategorySpending();
        grocerySpending.setCategory("Groceries");
        grocerySpending.setTotalCategorySpending(BigDecimal.valueOf(270.00));

        List<Transaction> groceryTransactions = new ArrayList<>();
        groceryTransactions.add(createTransaction("gt1", BigDecimal.valueOf(120.00), LocalDate.of(2025, 4, 3)));
        groceryTransactions.add(createTransaction("gt2", BigDecimal.valueOf(150.00), LocalDate.of(2025, 4, 10)));
        grocerySpending.setTransactions(groceryTransactions);

        List<DateRangeSpending> groceryWeekly = new ArrayList<>();
        groceryWeekly.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7)), 120.00));
        groceryWeekly.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 8), LocalDate.of(2025, 4, 14)), 150.00));
        grocerySpending.setWeeklySpending(groceryWeekly);

        monthlyCategorySpending.add(grocerySpending);

        // Rent spending
        MonthlyCategorySpending rentSpending = new MonthlyCategorySpending();
        rentSpending.setCategory("Rent");
        rentSpending.setTotalCategorySpending(BigDecimal.valueOf(1200.00));

        List<Transaction> rentTransactions = new ArrayList<>();
        rentTransactions.add(createTransaction("rt1", BigDecimal.valueOf(1200.00), LocalDate.of(2025, 4, 1)));
        rentSpending.setTransactions(rentTransactions);

        List<DateRangeSpending> rentWeekly = new ArrayList<>();
        rentWeekly.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7)), 1200.00));
        rentSpending.setWeeklySpending(rentWeekly);

        monthlyCategorySpending.add(rentSpending);

        return monthlyCategorySpending;
    }

    private List<MonthlyBudgetCategoryCriteria> createTestMonthlyBudgetCategoryCriteria() {
        List<MonthlyBudgetCategoryCriteria> criteria = new ArrayList<>();

        // Groceries criteria
        MonthlyBudgetCategoryCriteria groceriesCriteria = new MonthlyBudgetCategoryCriteria();
        groceriesCriteria.setCategory("Groceries");
        groceriesCriteria.setSubBudget(createTestSubBudget());
        groceriesCriteria.setMonthlyCategorySpending(createTestMonthlyCategorySpending().get(0));
        groceriesCriteria.setActive(true);
        criteria.add(groceriesCriteria);

        // Rent criteria
        MonthlyBudgetCategoryCriteria rentCriteria = new MonthlyBudgetCategoryCriteria();
        rentCriteria.setCategory("Rent");
        rentCriteria.setSubBudget(createTestSubBudget());
        rentCriteria.setMonthlyCategorySpending(createTestMonthlyCategorySpending().get(1));
        rentCriteria.setActive(true);
        criteria.add(rentCriteria);

        return criteria;
    }

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

        BudgetScheduleRange budgetScheduleRange2 = new BudgetScheduleRange();
        budgetScheduleRange2.setId(16L);
        budgetScheduleRange2.setBudgetScheduleId(4L);
        budgetScheduleRange2.setStartRange(LocalDate.of(2025, 4, 8));
        budgetScheduleRange2.setEndRange(LocalDate.of(2025, 4, 14));
        budgetScheduleRange2.setRangeType("Week");
        budgetScheduleRange2.setBudgetDateRange(new DateRange(LocalDate.of(2025, 4, 8), LocalDate.of(2025, 4, 14)));
        budgetScheduleRange2.setSpentOnRange(BigDecimal.valueOf(0));
        budgetScheduleRange2.setBudgetedAmount(BigDecimal.valueOf(598.050));

        BudgetScheduleRange budgetScheduleRange3 = new BudgetScheduleRange();
        budgetScheduleRange3.setId(17L);
        budgetScheduleRange3.setBudgetScheduleId(4L);
        budgetScheduleRange3.setStartRange(LocalDate.of(2025, 4, 15));
        budgetScheduleRange3.setEndRange(LocalDate.of(2025, 4, 21));

        budgetScheduleRange3.setRangeType("Week");
        budgetScheduleRange3.setBudgetDateRange(new DateRange(LocalDate.of(2025, 4, 15), LocalDate.of(2025, 4, 21)));
        budgetScheduleRange3.setSpentOnRange(BigDecimal.valueOf(0));
        budgetScheduleRange3.setBudgetedAmount(BigDecimal.valueOf(598.050));

        BudgetScheduleRange budgetScheduleRange4 = new BudgetScheduleRange();
        budgetScheduleRange4.setId(18L);
        budgetScheduleRange4.setBudgetScheduleId(4L);
        budgetScheduleRange4.setStartRange(LocalDate.of(2025, 4, 22));
        budgetScheduleRange4.setEndRange(LocalDate.of(2025, 4, 28));
        budgetScheduleRange4.setRangeType("Week");
        budgetScheduleRange4.setBudgetDateRange(new DateRange(LocalDate.of(2025, 4, 22), LocalDate.of(2025, 4, 28)));
        budgetScheduleRange4.setSpentOnRange(BigDecimal.valueOf(0));
        budgetScheduleRange4.setBudgetedAmount(BigDecimal.valueOf(598.050));

        BudgetScheduleRange budgetScheduleRange5 = new BudgetScheduleRange();
        budgetScheduleRange5.setId(19L);
        budgetScheduleRange5.setBudgetScheduleId(4L);
        budgetScheduleRange5.setStartRange(LocalDate.of(2025, 4, 29));
        budgetScheduleRange5.setEndRange(LocalDate.of(2025, 4, 30));
        budgetScheduleRange5.setBudgetDateRange(new DateRange(LocalDate.of(2025, 4, 29), LocalDate.of(2025, 4, 30)));
        budgetScheduleRange5.setRangeType("Week");
        budgetScheduleRange5.setSpentOnRange(BigDecimal.valueOf(0));
        budgetScheduleRange5.setBudgetedAmount(BigDecimal.valueOf(598.050));

        budgetScheduleRanges.add(budgetScheduleRange1);
        budgetScheduleRanges.add(budgetScheduleRange2);
        budgetScheduleRanges.add(budgetScheduleRange3);
        budgetScheduleRanges.add(budgetScheduleRange4);
        budgetScheduleRanges.add(budgetScheduleRange5);
        return budgetScheduleRanges;
    }

    private Transaction createTransaction(String id, BigDecimal amount, LocalDate date) {
        Transaction transaction = new Transaction();
        transaction.setTransactionId(id);
        transaction.setAmount(amount);
        transaction.setPosted(date);
        transaction.setDate(date);
        return transaction;
    }

    private List<BudgetCategory> createTestBudgetCategories() {
        List<BudgetCategory> budgetCategories = new ArrayList<>();

        // Groceries week 1
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

        // Groceries week 2
        BudgetCategory groceryWeek2 = new BudgetCategory();
        groceryWeek2.setSubBudgetId(1L);
        groceryWeek2.setCategoryName("Groceries");
        groceryWeek2.setStartDate(LocalDate.of(2025, 4, 8));
        groceryWeek2.setEndDate(LocalDate.of(2025, 4, 14));
        groceryWeek2.setBudgetActual(150.00);
        groceryWeek2.setBudgetedAmount(400.00);
        groceryWeek2.setIsActive(true);
        groceryWeek2.setOverSpent(false);
        groceryWeek2.setTransactions(List.of(createTransaction("gt2", BigDecimal.valueOf(150.00), LocalDate.of(2025, 4, 10))));
        budgetCategories.add(groceryWeek2);

        // Rent week 1
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


    // Helper methods to create test data
    private SubBudget createTestSubBudget() {
        SubBudget subBudget = new SubBudget();
        subBudget.setId(4L);
        subBudget.setAllocatedAmount(BigDecimal.valueOf(3260));
        subBudget.setSpentOnBudget(BigDecimal.valueOf(1609));
        subBudget.setStartDate(LocalDate.of(2025, 4, 1));
        subBudget.setEndDate(LocalDate.of(2025, 4, 30));
        subBudget.setActive(true);

        BudgetSchedule budgetSchedule = createTestBudgetSchedule();
        subBudget.setBudgetSchedule(List.of(budgetSchedule));

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

    private BudgetSchedule createTestBudgetSchedule() {
        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setBudgetScheduleId(4L);
        budgetSchedule.setStartDate(LocalDate.of(2025, 4, 1));
        budgetSchedule.setEndDate(LocalDate.of(2025, 4, 30));
        budgetSchedule.setBudgetScheduleRanges(createAprilBudgetScheduleRanges());
        // Set other required properties
        return budgetSchedule;
    }

    private List<TransactionsByCategory> createTestTransactionsByCategory() {
        List<TransactionsByCategory> transactionsByCategory = new ArrayList<>();

        // Groceries transactions
        List<Transaction> groceryTransactions = new ArrayList<>();
        groceryTransactions.add(createTransaction("gt1", BigDecimal.valueOf(120.00), LocalDate.of(2025, 4, 3)));
        groceryTransactions.add(createTransaction("gt2", BigDecimal.valueOf(150.00), LocalDate.of(2025, 4, 10)));
        TransactionsByCategory groceries = new TransactionsByCategory("grocery1", groceryTransactions);
        transactionsByCategory.add(groceries);

        // Rent transactions
        List<Transaction> rentTransactions = new ArrayList<>();
        rentTransactions.add(createTransaction("rt1", BigDecimal.valueOf(1200.00), LocalDate.of(2025, 4, 1)));
        TransactionsByCategory rent = new TransactionsByCategory("rent1", rentTransactions);

        transactionsByCategory.add(rent);

        return transactionsByCategory;
    }

    private Transaction createTestTransaction() {
        Transaction transaction = new Transaction();
        transaction.setTransactionId("123");
        transaction.setAmount(new BigDecimal("45.67"));
        transaction.setPosted(LocalDate.now());
        // Set other required properties
        return transaction;
    }

    private SubBudgetGoals createTestSubBudgetGoals() {
        SubBudgetGoals goals = new SubBudgetGoals();
        goals.setId(1L);
        goals.setSavingsTarget(new BigDecimal("100.00"));
        // Set other required properties
        return goals;
    }


    @AfterEach
    void tearDown() {
    }
}