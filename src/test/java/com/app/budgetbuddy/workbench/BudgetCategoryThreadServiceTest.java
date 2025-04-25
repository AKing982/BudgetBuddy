package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.workbench.budget.BudgetCategoryBuilder;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringBootTest
@Slf4j
class BudgetCategoryThreadServiceTest
{
    @MockBean
    private BudgetCategoryBuilder budgetCategoryBuilder;

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
    void testCreateBudgetCategories_Success() throws Exception
    {
        // Arrange
        SubBudget subBudget = createTestSubBudget();
        BudgetSchedule budgetSchedule = createTestBudgetSchedule();
        List<CategoryTransactions> categoryTransactions = createTestCategoryTransactions();
        SubBudgetGoals subBudgetGoals = createTestSubBudgetGoals();

        List<BudgetCategory> expectedBudgetCategories = createTestBudgetCategories();

        when(budgetCategoryBuilder.initializeBudgetCategories(
                eq(subBudget),
                eq(budgetSchedule),
                eq(categoryTransactions),
                eq(subBudgetGoals)
        )).thenReturn(expectedBudgetCategories);

        // Act
        CompletableFuture<List<BudgetCategory>> future =
                budgetCategoryThreadService.createAsyncBudgetCategories(
                        subBudget, budgetSchedule, categoryTransactions, subBudgetGoals);

        // Assert
        List<BudgetCategory> actualBudgetCategories = future.get(5, TimeUnit.SECONDS);

        assertNotNull(actualBudgetCategories);
        assertEquals(expectedBudgetCategories.size(), actualBudgetCategories.size());
        assertEquals(expectedBudgetCategories, actualBudgetCategories);

        verify(budgetCategoryBuilder).initializeBudgetCategories(
                eq(subBudget),
                eq(budgetSchedule),
                eq(categoryTransactions),
                eq(subBudgetGoals)
        );
    }

    @Test
    void testCreateBudgetCategories_Exception() {
        // Arrange
        SubBudget subBudget = createTestSubBudget();
        BudgetSchedule budgetSchedule = createTestBudgetSchedule();
        List<CategoryTransactions> categoryTransactions = createTestCategoryTransactions();
        SubBudgetGoals subBudgetGoals = createTestSubBudgetGoals();

        RuntimeException expectedException = new RuntimeException("Test exception");

        when(budgetCategoryBuilder.initializeBudgetCategories(
                any(), any(), any(), any()
        )).thenThrow(expectedException);

        // Act & Assert
        CompletableFuture<List<BudgetCategory>> future =
                budgetCategoryThreadService.createAsyncBudgetCategories(
                        subBudget, budgetSchedule, categoryTransactions, subBudgetGoals);

        ExecutionException exception = assertThrows(
                ExecutionException.class,
                () -> future.get(5, TimeUnit.SECONDS)
        );

        assertEquals(CompletionException.class, exception.getCause().getClass());
        assertEquals(expectedException, exception.getCause().getCause());
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
    void testCreateAsyncBudgetCategoriesByCurrentDate_whenCategoryTransactionsIsEmpty_thenReturnEmptyBudgetCategoryList() throws Exception{
        List<BudgetCategory> expectedBudgetCategories = createTestBudgetCategories();
        LocalDate currentDate = LocalDate.now();
        SubBudget subBudget = createTestSubBudget();
        BudgetSchedule budgetSchedule = createTestBudgetSchedule();
        List<CategoryTransactions> categoryTransactions = new ArrayList<>();

        CompletableFuture<List<BudgetCategory>> future = budgetCategoryThreadService.createAsyncBudgetCategoriesByCurrentDate(currentDate, subBudget, budgetSchedule, categoryTransactions);
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
        List<CategoryTransactions> categoryTransactions = createTestCategoryTransactions();
        List<BudgetCategory> expectedBudgetCategories = createTestBudgetCategories();

        CompletableFuture<List<BudgetCategory>> future = budgetCategoryThreadService.createAsyncBudgetCategoriesByCurrentDate(currentDate, subBudget, budgetSchedule, categoryTransactions);
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


    // Helper methods to create test data
    private SubBudget createTestSubBudget() {
        SubBudget subBudget = new SubBudget();
        subBudget.setId(1L);
        // Set other required properties
        return subBudget;
    }

    private BudgetSchedule createTestBudgetSchedule() {
        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setBudgetScheduleId(1L);
        // Set other required properties
        return budgetSchedule;
    }

    private List<CategoryTransactions> createTestCategoryTransactions() {
        // Create test category transactions
        CategoryTransactions groceries = new CategoryTransactions();
        groceries.setCategoryName("Groceries");
        groceries.setTransactions(Collections.singletonList(createTestTransaction()));

        return Collections.singletonList(groceries);
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

    private List<BudgetCategory> createTestBudgetCategories() {
        BudgetCategory category = new BudgetCategory();
        category.setId(1L);
        category.setCategoryName("Groceries");
        category.setBudgetedAmount(150.0);
        category.setBudgetActual(45.67);
        // Set other required properties

        return Collections.singletonList(category);
    }

    @AfterEach
    void tearDown() {
    }
}