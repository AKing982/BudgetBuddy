package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.services.SubBudgetGoalsService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

@SpringBootTest
class DailyBudgetCategoryBuilderServiceTest
{
    @MockBean
    private BudgetCategoryService budgetCategoryService;

    @MockBean
    private BudgetCalculations budgetCalculations;

    @MockBean
    private BudgetEstimatorService budgetEstimatorService;

    @MockBean
    private SubBudgetGoalsService subBudgetGoalsService;

    @Autowired
    private DailyBudgetCategoryBuilderService dailyBudgetCategoryBuilderService;

    private SubBudget testSubBudget;

    private Budget budget;

    @BeforeEach
    void setUp() {
        testSubBudget = new SubBudget();
        testSubBudget.setYear(2025);
        testSubBudget.setStartDate(LocalDate.of(2025, 4, 1));
        testSubBudget.setEndDate(LocalDate.of(2025, 4, 30));
        testSubBudget.setSubSavingsTarget(BigDecimal.valueOf(208));
        testSubBudget.setSubSavingsAmount(BigDecimal.valueOf(120));
        testSubBudget.setAllocatedAmount(BigDecimal.valueOf(3260));
        testSubBudget.setActive(true);
        testSubBudget.setId(4L);
        testSubBudget.setSpentOnBudget(BigDecimal.valueOf(1603));

        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setStatus("Active");
        budgetSchedule.setPeriodType(Period.MONTHLY);
        budgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 30)));
        budgetSchedule.setSubBudgetId(testSubBudget.getId());
        budgetSchedule.setBudgetScheduleId(4L);
        budgetSchedule.setStartDate(LocalDate.of(2025, 4, 1));
        budgetSchedule.setEndDate(LocalDate.of(2025, 4, 30));
        budgetSchedule.setTotalPeriods(4);
        testSubBudget.setBudgetSchedule(List.of(budgetSchedule));

        budget = new Budget();
        budget.setId(1L);
        budget.setIncome(BigDecimal.valueOf(51000));
        budget.setBudgetName("2025 Year Budget");
        budget.setStartDate(LocalDate.of(2025, 1, 1));
        budget.setEndDate(LocalDate.of(2025, 12, 31));
        budget.setBudgetAmount(BigDecimal.valueOf(51000));
        budget.setUserId(1L);

        testSubBudget.setBudget(budget);
    }

    @Test
    void testBuildDailyBudgetCategoryList_whenDailyBudgetCategoryCriteriaNull_thenReturnEmptyList()
    {
        List<BudgetCategory> actual = dailyBudgetCategoryBuilderService.buildDailyBudgetCategoryList(null);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildDailyBudgetCategoryList_whenValidDate_thenReturnBudgetCategory(){
        DailyBudgetCategoryCriteria dailyBudgetCategoryCriteria = new DailyBudgetCategoryCriteria();
        dailyBudgetCategoryCriteria.setActive(true);
        dailyBudgetCategoryCriteria.setCategory("Rent");
        dailyBudgetCategoryCriteria.setDate(LocalDate.of(2025, 4, 16));
        dailyBudgetCategoryCriteria.setSubBudget(testSubBudget);

        DailyCategorySpending dailyCategorySpending = new DailyCategorySpending();
        dailyCategorySpending.setCategory("Rent");
        dailyCategorySpending.setTotalCategorySpending(BigDecimal.valueOf(707));
        dailyCategorySpending.setCurrentDate(LocalDate.of(2025, 4, 16));
        dailyCategorySpending.setTransactions(List.of(createRentTransaction(BigDecimal.valueOf(707))));
        dailyBudgetCategoryCriteria.setCategorySpendingByDate(List.of(dailyCategorySpending));

        List<BudgetCategory> expected = new ArrayList<>();
        BudgetCategory rentBudgetCategory = new BudgetCategory();
        rentBudgetCategory.setBudgetActual(707.0);
        rentBudgetCategory.setBudgetedAmount(707.0);
        rentBudgetCategory.setCategoryName("Rent");
        rentBudgetCategory.setStartDate(LocalDate.of(2025, 4, 16));
        rentBudgetCategory.setEndDate(LocalDate.of(2025, 4, 30));
        rentBudgetCategory.setSubBudgetId(testSubBudget.getId());
        rentBudgetCategory.setIsActive(true);
        rentBudgetCategory.setOverSpent(false);
        rentBudgetCategory.setTransactions(List.of(createRentTransaction(BigDecimal.valueOf(707))));
        rentBudgetCategory.setOverSpendingAmount(0.0);
        expected.add(rentBudgetCategory);

        CategoryBudgetAmount[] expectedCategoryBudgetAmounts = new CategoryBudgetAmount[10];
        CategoryBudgetAmount rentCategoryBudgetAmount = new CategoryBudgetAmount("Rent", BigDecimal.valueOf(1907.0));
        CategoryBudgetAmount utilitiesCategoryBudgetAmount = new CategoryBudgetAmount("Utilities", BigDecimal.valueOf(210.0));
        CategoryBudgetAmount insuranceCategoryBudgetAmount = new CategoryBudgetAmount("Insurance", BigDecimal.valueOf(79.3));
        CategoryBudgetAmount gasCategoryBudgetAmount = new CategoryBudgetAmount("Gas", BigDecimal.valueOf(65.3));
        CategoryBudgetAmount groceriesCategoryBudgetAmount = new CategoryBudgetAmount("Groceries", BigDecimal.valueOf(326.0));
        CategoryBudgetAmount subscriptionsCategoryBudgetAmount = new CategoryBudgetAmount("Subscription", BigDecimal.valueOf(163.0));
        CategoryBudgetAmount savingsCategoryBudgetAmount = new CategoryBudgetAmount("Savings", BigDecimal.valueOf(195.6));
        CategoryBudgetAmount ordersCategoryBudgetAmount = new CategoryBudgetAmount("Order Out", BigDecimal.valueOf(48.9));
        CategoryBudgetAmount otherPurchasesCategoryBudgetAmount = new CategoryBudgetAmount("Other", BigDecimal.valueOf(65.3));
        expectedCategoryBudgetAmounts[0] = rentCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[1] = utilitiesCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[2] = insuranceCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[3] = gasCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[4] = groceriesCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[5] = new CategoryBudgetAmount("Payments", BigDecimal.ZERO);
        expectedCategoryBudgetAmounts[6] = subscriptionsCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[7] = savingsCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[8] = ordersCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[9] = otherPurchasesCategoryBudgetAmount;

        Mockito.when(budgetEstimatorService.calculateBudgetCategoryAmount(eq(testSubBudget)))
                        .thenReturn(expectedCategoryBudgetAmounts);

        Mockito.when(budgetEstimatorService.getBudgetCategoryAmountByCategory(eq("Rent"), any(CategoryBudgetAmount[].class)))
                .thenReturn(BigDecimal.valueOf(707.0));

        List<BudgetCategory> actual = dailyBudgetCategoryBuilderService.buildDailyBudgetCategoryList(dailyBudgetCategoryCriteria);
        assertNotNull(actual);
        for(int i = 0; i < expected.size(); i++)
        {
            BudgetCategory budgetCategory = actual.get(i);
            BudgetCategory expectedBudgetCategory = expected.get(i);
            assertEquals(expectedBudgetCategory.getId(), budgetCategory.getId());
            assertEquals(expectedBudgetCategory.getBudgetActual(), budgetCategory.getBudgetActual());
            assertEquals(expectedBudgetCategory.getBudgetedAmount(), budgetCategory.getBudgetedAmount());
            assertEquals(expectedBudgetCategory.getCategoryName(), budgetCategory.getCategoryName());
            assertEquals(expectedBudgetCategory.getStartDate(), budgetCategory.getStartDate());
            assertEquals(expectedBudgetCategory.getEndDate(), budgetCategory.getEndDate());
            assertEquals(expectedBudgetCategory.getSubBudgetId(), budgetCategory.getSubBudgetId());
            assertEquals(expectedBudgetCategory.getTransactions().size(), budgetCategory.getTransactions().size());
        }
    }

    @Test
    void testBuildDailyBudgetCategoryList_whenFirstOfMonthRent_thenReturnRentBudgetCategory(){
        DailyBudgetCategoryCriteria dailyBudgetCategoryCriteria = new DailyBudgetCategoryCriteria();
        dailyBudgetCategoryCriteria.setActive(true);
        dailyBudgetCategoryCriteria.setCategory("Rent");
        dailyBudgetCategoryCriteria.setDate(LocalDate.of(2025, 4, 1));
        dailyBudgetCategoryCriteria.setSubBudget(testSubBudget);

        DailyCategorySpending dailyCategorySpending = new DailyCategorySpending();
        dailyCategorySpending.setCategory("Rent");
        dailyCategorySpending.setTotalCategorySpending(BigDecimal.valueOf(1200.0));
        dailyCategorySpending.setCurrentDate(LocalDate.of(2025, 4, 1));
        dailyCategorySpending.setTransactions(List.of(createRentTransaction(BigDecimal.valueOf(1200))));
        dailyBudgetCategoryCriteria.setCategorySpendingByDate(List.of(dailyCategorySpending));

        List<BudgetCategory> expected = new ArrayList<>();
        BudgetCategory rentBudgetCategory = new BudgetCategory();
        rentBudgetCategory.setBudgetActual(1200.0);
        rentBudgetCategory.setBudgetedAmount(1200.0);
        rentBudgetCategory.setCategoryName("Rent");
        rentBudgetCategory.setStartDate(LocalDate.of(2025, 4, 1));
        rentBudgetCategory.setEndDate(LocalDate.of(2025, 4, 15));
        rentBudgetCategory.setSubBudgetId(testSubBudget.getId());
        rentBudgetCategory.setIsActive(true);
        rentBudgetCategory.setOverSpent(false);
        rentBudgetCategory.setTransactions(List.of(createRentTransaction(BigDecimal.valueOf(1200))));
        rentBudgetCategory.setOverSpendingAmount(0.0);
        expected.add(rentBudgetCategory);

        CategoryBudgetAmount[] expectedCategoryBudgetAmounts = new CategoryBudgetAmount[10];
        CategoryBudgetAmount rentCategoryBudgetAmount = new CategoryBudgetAmount("Rent", BigDecimal.valueOf(1907.0));
        CategoryBudgetAmount utilitiesCategoryBudgetAmount = new CategoryBudgetAmount("Utilities", BigDecimal.valueOf(210.0));
        CategoryBudgetAmount insuranceCategoryBudgetAmount = new CategoryBudgetAmount("Insurance", BigDecimal.valueOf(79.3));
        CategoryBudgetAmount gasCategoryBudgetAmount = new CategoryBudgetAmount("Gas", BigDecimal.valueOf(65.3));
        CategoryBudgetAmount groceriesCategoryBudgetAmount = new CategoryBudgetAmount("Groceries", BigDecimal.valueOf(326.0));
        CategoryBudgetAmount subscriptionsCategoryBudgetAmount = new CategoryBudgetAmount("Subscription", BigDecimal.valueOf(163.0));
        CategoryBudgetAmount savingsCategoryBudgetAmount = new CategoryBudgetAmount("Savings", BigDecimal.valueOf(195.6));
        CategoryBudgetAmount ordersCategoryBudgetAmount = new CategoryBudgetAmount("Order Out", BigDecimal.valueOf(48.9));
        CategoryBudgetAmount otherPurchasesCategoryBudgetAmount = new CategoryBudgetAmount("Other", BigDecimal.valueOf(65.3));
        expectedCategoryBudgetAmounts[0] = rentCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[1] = utilitiesCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[2] = insuranceCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[3] = gasCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[4] = groceriesCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[5] = new CategoryBudgetAmount("Payments", BigDecimal.ZERO);
        expectedCategoryBudgetAmounts[6] = subscriptionsCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[7] = savingsCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[8] = ordersCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[9] = otherPurchasesCategoryBudgetAmount;

        Mockito.when(budgetEstimatorService.calculateBudgetCategoryAmount(eq(testSubBudget)))
                .thenReturn(expectedCategoryBudgetAmounts);

        Mockito.when(budgetEstimatorService.getBudgetCategoryAmountByCategory(eq("Rent"), any(CategoryBudgetAmount[].class)))
                .thenReturn(BigDecimal.valueOf(1200));

        List<BudgetCategory> actual = dailyBudgetCategoryBuilderService.buildDailyBudgetCategoryList(dailyBudgetCategoryCriteria);
        assertNotNull(actual);
        for(int i = 0; i < expected.size(); i++)
        {
            BudgetCategory budgetCategory = actual.get(i);
            BudgetCategory expectedBudgetCategory = expected.get(i);
            assertEquals(expectedBudgetCategory.getId(), budgetCategory.getId());
            assertEquals(expectedBudgetCategory.getBudgetActual(), budgetCategory.getBudgetActual());
            assertEquals(expectedBudgetCategory.getBudgetedAmount(), budgetCategory.getBudgetedAmount());
            assertEquals(expectedBudgetCategory.getCategoryName(), budgetCategory.getCategoryName());
            assertEquals(expectedBudgetCategory.getStartDate(), budgetCategory.getStartDate());
            assertEquals(expectedBudgetCategory.getEndDate(), budgetCategory.getEndDate());
            assertEquals(expectedBudgetCategory.getSubBudgetId(), budgetCategory.getSubBudgetId());
            assertEquals(expectedBudgetCategory.getTransactions().size(), budgetCategory.getTransactions().size());
        }
    }

    @Test
    void testBuildDailyBudgetCategoryList_whenRentAndGroceriesOnFirstOfMonth_thenReturnBudgetCategories()
    {
        DailyBudgetCategoryCriteria groceryRentDailyBudgetCriteria = createDailyBudgetCategoryCriteriaForRentAndGroceries();

        List<BudgetCategory> expectedBudgetCategories = new ArrayList<>();
        BudgetCategory rentBudgetCategory = new BudgetCategory();
        rentBudgetCategory.setBudgetActual(1200.0);
        rentBudgetCategory.setBudgetedAmount(1200.0);
        rentBudgetCategory.setCategoryName("Rent");
        rentBudgetCategory.setStartDate(LocalDate.of(2025, 4, 1));
        rentBudgetCategory.setEndDate(LocalDate.of(2025, 4, 15));
        rentBudgetCategory.setSubBudgetId(testSubBudget.getId());
        rentBudgetCategory.setIsActive(true);
        rentBudgetCategory.setOverSpent(false);
        rentBudgetCategory.setTransactions(List.of(createRentTransaction(BigDecimal.valueOf(1200))));
        rentBudgetCategory.setOverSpendingAmount(0.0);
        expectedBudgetCategories.add(rentBudgetCategory);

        BudgetCategory groceryBudgetCategory = new BudgetCategory();
        groceryBudgetCategory.setBudgetActual(35.32);
        groceryBudgetCategory.setBudgetedAmount(325.0);
        groceryBudgetCategory.setCategoryName("Groceries");
        groceryBudgetCategory.setStartDate(LocalDate.of(2025, 4, 1));
        groceryBudgetCategory.setEndDate(LocalDate.of(2025, 4, 1));
        groceryBudgetCategory.setSubBudgetId(testSubBudget.getId());
        groceryBudgetCategory.setIsActive(true);
        groceryBudgetCategory.setOverSpent(false);
        groceryBudgetCategory.setTransactions(List.of(createGroceryTransaction(BigDecimal.valueOf(35.32), LocalDate.of(2025, 4, 1))));
        expectedBudgetCategories.add(groceryBudgetCategory);

        CategoryBudgetAmount[] expectedCategoryBudgetAmounts = new CategoryBudgetAmount[10];
        CategoryBudgetAmount rentCategoryBudgetAmount = new CategoryBudgetAmount("Rent", BigDecimal.valueOf(1907.0));
        CategoryBudgetAmount utilitiesCategoryBudgetAmount = new CategoryBudgetAmount("Utilities", BigDecimal.valueOf(210.0));
        CategoryBudgetAmount insuranceCategoryBudgetAmount = new CategoryBudgetAmount("Insurance", BigDecimal.valueOf(79.3));
        CategoryBudgetAmount gasCategoryBudgetAmount = new CategoryBudgetAmount("Gas", BigDecimal.valueOf(65.3));
        CategoryBudgetAmount groceriesCategoryBudgetAmount = new CategoryBudgetAmount("Groceries", BigDecimal.valueOf(326.0));
        CategoryBudgetAmount subscriptionsCategoryBudgetAmount = new CategoryBudgetAmount("Subscription", BigDecimal.valueOf(163.0));
        CategoryBudgetAmount savingsCategoryBudgetAmount = new CategoryBudgetAmount("Savings", BigDecimal.valueOf(195.6));
        CategoryBudgetAmount ordersCategoryBudgetAmount = new CategoryBudgetAmount("Order Out", BigDecimal.valueOf(48.9));
        CategoryBudgetAmount otherPurchasesCategoryBudgetAmount = new CategoryBudgetAmount("Other", BigDecimal.valueOf(65.3));
        expectedCategoryBudgetAmounts[0] = rentCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[1] = utilitiesCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[2] = insuranceCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[3] = gasCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[4] = groceriesCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[5] = new CategoryBudgetAmount("Payments", BigDecimal.ZERO);
        expectedCategoryBudgetAmounts[6] = subscriptionsCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[7] = savingsCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[8] = ordersCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[9] = otherPurchasesCategoryBudgetAmount;

        Mockito.when(budgetEstimatorService.calculateBudgetCategoryAmount(eq(testSubBudget)))
                .thenReturn(expectedCategoryBudgetAmounts);

        Mockito.when(budgetEstimatorService.getBudgetCategoryAmountByCategory(eq("Rent"), any(CategoryBudgetAmount[].class)))
                .thenReturn(BigDecimal.valueOf(1200));

        Mockito.when(budgetEstimatorService.getBudgetCategoryAmountByCategory(eq("Groceries"), any(CategoryBudgetAmount[].class)))
                .thenReturn(BigDecimal.valueOf(325.0));

        List<BudgetCategory> actual = dailyBudgetCategoryBuilderService.buildDailyBudgetCategoryList(groceryRentDailyBudgetCriteria);
        assertNotNull(actual);
        assertEquals(expectedBudgetCategories.size(), actual.size());
        for(int i = 0; i < expectedBudgetCategories.size(); i++)
        {
            BudgetCategory budgetCategory = actual.get(i);
            BudgetCategory expectedBudgetCategory = expectedBudgetCategories.get(i);
            assertEquals(expectedBudgetCategory.getId(), budgetCategory.getId());
            assertEquals(expectedBudgetCategory.getBudgetActual(), budgetCategory.getBudgetActual());
            assertEquals(expectedBudgetCategory.getBudgetedAmount(), budgetCategory.getBudgetedAmount());
            assertEquals(expectedBudgetCategory.getCategoryName(), budgetCategory.getCategoryName());
            assertEquals(expectedBudgetCategory.getStartDate(), budgetCategory.getStartDate());
            assertEquals(expectedBudgetCategory.getEndDate(), budgetCategory.getEndDate());
            assertEquals(expectedBudgetCategory.getSubBudgetId(), budgetCategory.getSubBudgetId());
            assertEquals(expectedBudgetCategory.getTransactions().size(), budgetCategory.getTransactions().size());
        }
    }

    @Test
    void testBuildDailyBudgetCategoryList_whenGroceriesTransactionListNull_returnBudgetCategoryWithEmptyTransactionList()
    {
        DailyBudgetCategoryCriteria dailyBudgetCategoryCriteria = new DailyBudgetCategoryCriteria();
        dailyBudgetCategoryCriteria.setActive(true);
        dailyBudgetCategoryCriteria.setCategory("Groceries");
        dailyBudgetCategoryCriteria.setDate(LocalDate.of(2025, 4, 5));
        dailyBudgetCategoryCriteria.setSubBudget(testSubBudget);

        DailyCategorySpending dailyCategorySpending = new DailyCategorySpending();
        dailyCategorySpending.setCategory("Groceries");
        dailyCategorySpending.setTotalCategorySpending(BigDecimal.valueOf(42.50));
        dailyCategorySpending.setCurrentDate(LocalDate.of(2025, 4, 5));
        // Setting transactions to null - this is what we're testing
        dailyCategorySpending.setTransactions(null);
        dailyBudgetCategoryCriteria.setCategorySpendingByDate(List.of(dailyCategorySpending));

        List<BudgetCategory> expected = new ArrayList<>();
        BudgetCategory groceryBudgetCategory = new BudgetCategory();
        groceryBudgetCategory.setBudgetActual(42.50);
        groceryBudgetCategory.setBudgetedAmount(325.0);
        groceryBudgetCategory.setCategoryName("Groceries");
        groceryBudgetCategory.setStartDate(LocalDate.of(2025, 4, 5));
        groceryBudgetCategory.setEndDate(LocalDate.of(2025, 4, 5));
        groceryBudgetCategory.setSubBudgetId(testSubBudget.getId());
        groceryBudgetCategory.setIsActive(true);
        groceryBudgetCategory.setOverSpent(false);
        // Empty transaction list, not null
        groceryBudgetCategory.setTransactions(new ArrayList<>());
        groceryBudgetCategory.setOverSpendingAmount(0.0);
        expected.add(groceryBudgetCategory);

        CategoryBudgetAmount[] expectedCategoryBudgetAmounts = new CategoryBudgetAmount[10];
        CategoryBudgetAmount groceriesCategoryBudgetAmount = new CategoryBudgetAmount("Groceries", BigDecimal.valueOf(326.0));
        expectedCategoryBudgetAmounts[4] = groceriesCategoryBudgetAmount;
        // Fill in other necessary categories
        expectedCategoryBudgetAmounts[0] = new CategoryBudgetAmount("Rent", BigDecimal.valueOf(1907.0));
        expectedCategoryBudgetAmounts[1] = new CategoryBudgetAmount("Utilities", BigDecimal.valueOf(210.0));
        expectedCategoryBudgetAmounts[2] = new CategoryBudgetAmount("Insurance", BigDecimal.valueOf(79.3));
        expectedCategoryBudgetAmounts[3] = new CategoryBudgetAmount("Gas", BigDecimal.valueOf(65.3));
        expectedCategoryBudgetAmounts[5] = new CategoryBudgetAmount("Payments", BigDecimal.ZERO);
        expectedCategoryBudgetAmounts[6] = new CategoryBudgetAmount("Subscription", BigDecimal.valueOf(163.0));
        expectedCategoryBudgetAmounts[7] = new CategoryBudgetAmount("Savings", BigDecimal.valueOf(195.6));
        expectedCategoryBudgetAmounts[8] = new CategoryBudgetAmount("Order Out", BigDecimal.valueOf(48.9));
        expectedCategoryBudgetAmounts[9] = new CategoryBudgetAmount("Other", BigDecimal.valueOf(65.3));

        Mockito.when(budgetEstimatorService.calculateBudgetCategoryAmount(eq(testSubBudget)))
                .thenReturn(expectedCategoryBudgetAmounts);

        Mockito.when(budgetEstimatorService.getBudgetCategoryAmountByCategory(eq("Groceries"), any(CategoryBudgetAmount[].class)))
                .thenReturn(BigDecimal.valueOf(325.0));

        List<BudgetCategory> actual = dailyBudgetCategoryBuilderService.buildDailyBudgetCategoryList(dailyBudgetCategoryCriteria);

        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());

        BudgetCategory budgetCategory = actual.get(0);
        BudgetCategory expectedBudgetCategory = expected.get(0);

        assertEquals(expectedBudgetCategory.getId(), budgetCategory.getId());
        assertEquals(expectedBudgetCategory.getBudgetActual(), budgetCategory.getBudgetActual());
        assertEquals(expectedBudgetCategory.getBudgetedAmount(), budgetCategory.getBudgetedAmount());
        assertEquals(expectedBudgetCategory.getCategoryName(), budgetCategory.getCategoryName());
        assertEquals(expectedBudgetCategory.getStartDate(), budgetCategory.getStartDate());
        assertEquals(expectedBudgetCategory.getEndDate(), budgetCategory.getEndDate());
        assertEquals(expectedBudgetCategory.getSubBudgetId(), budgetCategory.getSubBudgetId());

        // The key assertion - we expect an empty list, not null
        assertNotNull(budgetCategory.getTransactions());
        assertTrue(budgetCategory.getTransactions().isEmpty());
    }

    @Test
    void testGetCategorySpendingByDate_whenDateIsNull_thenReturnEmptyList(){
        List<TransactionsByCategory> transactionsByCategoryList = new ArrayList<>();
        TransactionsByCategory transactionsByCategory = new TransactionsByCategory();
        transactionsByCategoryList.add(transactionsByCategory);

        List<DailyCategorySpending> actual = dailyBudgetCategoryBuilderService.getCategorySpendingByDate(null, transactionsByCategoryList);
        assertNotNull(actual);
        assertEquals(0, actual.size());
    }

    @Test
    void testGetCategorySpendingByDate_whenTransactionsByCategoryIsNull_thenReturnEmptyList(){
        LocalDate currentDate = LocalDate.of(2025, 4, 1);
        List<DailyCategorySpending> actual = dailyBudgetCategoryBuilderService.getCategorySpendingByDate(currentDate, null);
        assertNotNull(actual);
        assertEquals(0, actual.size());
    }

    @Test
    void testGetCategorySpendingByDate_whenValidDateAndTransactionsByCategory_thenReturnDailyCategorySpendingList()
    {
        LocalDate currentDate = LocalDate.of(2025, 4, 1);
        List<TransactionsByCategory> transactionsByCategoryList = new ArrayList<>();

        // Create rent transactions
        List<Transaction> rentTransactions = new ArrayList<>();
        Transaction rentTransaction = new Transaction();
        rentTransaction.setAmount(BigDecimal.valueOf(1200));
        rentTransaction.setDate(currentDate);
        rentTransaction.setTransactionId("rent123");
        rentTransaction.setMerchantName("Apartment Complex");
        rentTransaction.setDescription("Monthly Rent");
        rentTransactions.add(rentTransaction);
        TransactionsByCategory rentCategory = new TransactionsByCategory("Rent", rentTransactions);
        transactionsByCategoryList.add(rentCategory);

        // Create grocery transactions
        List<Transaction> groceryTransactions = new ArrayList<>();
        Transaction groceryTransaction1 = new Transaction();
        groceryTransaction1.setAmount(BigDecimal.valueOf(45.67));
        groceryTransaction1.setDate(currentDate);
        groceryTransaction1.setTransactionId("grocery123");
        groceryTransaction1.setMerchantName("Grocery Store");
        groceryTransaction1.setDescription("Weekly Groceries");
        groceryTransactions.add(groceryTransaction1);

        Transaction groceryTransaction2 = new Transaction();
        groceryTransaction2.setAmount(BigDecimal.valueOf(12.34));
        groceryTransaction2.setDate(currentDate);
        groceryTransaction2.setTransactionId("grocery456");
        groceryTransaction2.setMerchantName("Corner Market");
        groceryTransaction2.setDescription("Additional Items");
        groceryTransactions.add(groceryTransaction2);

        TransactionsByCategory groceryCategory = new TransactionsByCategory( "Groceries", groceryTransactions);
        transactionsByCategoryList.add(groceryCategory);

        // Expected results
        List<DailyCategorySpending> expected = new ArrayList<>();

        DailyCategorySpending rentSpending = new DailyCategorySpending();
        rentSpending.setCategory("Rent");
        rentSpending.setTotalCategorySpending(BigDecimal.valueOf(1200));
        rentSpending.setCurrentDate(currentDate);
        rentSpending.setTransactions(rentTransactions);
        expected.add(rentSpending);

        DailyCategorySpending grocerySpending = new DailyCategorySpending();
        grocerySpending.setCategory("Groceries");
        grocerySpending.setTotalCategorySpending(BigDecimal.valueOf(58.01)); // 45.67 + 12.34
        grocerySpending.setCurrentDate(currentDate);
        grocerySpending.setTransactions(groceryTransactions);
        expected.add(grocerySpending);

        // Call the method under test
        List<DailyCategorySpending> actual = dailyBudgetCategoryBuilderService.getCategorySpendingByDate(currentDate, transactionsByCategoryList);

        // Assertions
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());

        // Verify each DailyCategorySpending object
        for (int i = 0; i < expected.size(); i++) {
            DailyCategorySpending actualSpending = actual.get(i);
            DailyCategorySpending expectedSpending = expected.get(i);

            assertEquals(expectedSpending.getCategory(), actualSpending.getCategory());
            assertEquals(expectedSpending.getTotalCategorySpending().setScale(2, RoundingMode.HALF_UP),
                    actualSpending.getTotalCategorySpending().setScale(2, RoundingMode.HALF_UP));
            assertEquals(expectedSpending.getCurrentDate(), actualSpending.getCurrentDate());

            // Verify transactions
            assertEquals(expectedSpending.getTransactions().size(), actualSpending.getTransactions().size());

            for (int j = 0; j < expectedSpending.getTransactions().size(); j++) {
                Transaction expectedTrans = expectedSpending.getTransactions().get(j);
                Transaction actualTrans = actualSpending.getTransactions().get(j);

                assertEquals(expectedTrans.getTransactionId(), actualTrans.getTransactionId());
                assertEquals(expectedTrans.getAmount(), actualTrans.getAmount());
                assertEquals(expectedTrans.getDate(), actualTrans.getDate());
                assertEquals(expectedTrans.getMerchantName(), actualTrans.getMerchantName());
                assertEquals(expectedTrans.getDescription(), actualTrans.getDescription());
            }
        }
    }

    @Test
    void testGetCategorySpendingByDate_whenCategoryNameIsEmpty_thenSkipCategoryAndLog_thenReturnDailyCategorySpendingList()
    {
        LocalDate currentDate = LocalDate.of(2025, 4, 1);
        List<TransactionsByCategory> transactionsByCategoryList = new ArrayList<>();
        Transaction rentTransaction = new Transaction();
        rentTransaction.setAmount(BigDecimal.valueOf(1200));
        rentTransaction.setDate(currentDate);
        rentTransaction.setTransactionId("rent123");
        rentTransaction.setMerchantName("Apartment Complex");
        rentTransaction.setDescription("Monthly Rent");

        Transaction groceryTransaction1 = new Transaction();
        groceryTransaction1.setAmount(BigDecimal.valueOf(45.67));
        groceryTransaction1.setDate(currentDate);
        groceryTransaction1.setTransactionId("grocery123");
        groceryTransaction1.setMerchantName("Grocery Store");
        groceryTransaction1.setDescription("Weekly Groceries");

        TransactionsByCategory groceryEmptyTransactionsByCategory = new TransactionsByCategory("", List.of(groceryTransaction1));
        TransactionsByCategory rentCategory = new TransactionsByCategory("Rent", List.of(rentTransaction));
        transactionsByCategoryList.add(rentCategory);
        transactionsByCategoryList.add(groceryEmptyTransactionsByCategory);

        List<DailyCategorySpending> expected = new ArrayList<>();
        DailyCategorySpending rentCategorySpending = new DailyCategorySpending();
        rentCategorySpending.setCategory("Rent");
        rentCategorySpending.setTotalCategorySpending(BigDecimal.valueOf(1200));
        rentCategorySpending.setCurrentDate(currentDate);
        rentCategorySpending.setTransactions(List.of(rentTransaction));
        expected.add(rentCategorySpending);

        List<DailyCategorySpending> actual = dailyBudgetCategoryBuilderService.getCategorySpendingByDate(currentDate, transactionsByCategoryList);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for (int i = 0; i < expected.size(); i++) {
            DailyCategorySpending actualSpending = actual.get(i);
            DailyCategorySpending expectedSpending = expected.get(i);
            assertEquals(expectedSpending.getCategory(), actualSpending.getCategory());
            assertEquals(expectedSpending.getTotalCategorySpending(), actualSpending.getTotalCategorySpending());
            assertEquals(expectedSpending.getCurrentDate(), actualSpending.getCurrentDate());
            assertEquals(expectedSpending.getTransactions().size(), actualSpending.getTransactions().size());
        }
    }

    @Test
    void testCreateDailyBudgetCriteria_whenAprilOnFirstOfMonth_thenReturnDailyBudgetCategoryCriteria(){
        SubBudget subBudget = testSubBudget;
        BudgetScheduleRange aprilFirstWeek = new BudgetScheduleRange();
        aprilFirstWeek.setBudgetDateRange(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7)));
        aprilFirstWeek.setStartRange(LocalDate.of(2025, 4, 1));
        aprilFirstWeek.setEndRange(LocalDate.of(2025, 4, 7));
        aprilFirstWeek.setRangeType("Week");
        aprilFirstWeek.setBudgetedAmount(BigDecimal.valueOf(598));
        aprilFirstWeek.setSpentOnRange(BigDecimal.valueOf(1235));
        LocalDate currentDate = LocalDate.of(2025, 4, 1);

        // Create daily category spending list
        List<DailyCategorySpending> dailyBudgetCategorySpendingList = new ArrayList<>();

        // Add rent spending
        DailyCategorySpending rentSpending = new DailyCategorySpending();
        rentSpending.setCategory("Rent");
        rentSpending.setTotalCategorySpending(BigDecimal.valueOf(1200));
        rentSpending.setCurrentDate(currentDate);
        Transaction rentTransaction = new Transaction();
        rentTransaction.setAmount(BigDecimal.valueOf(1200));
        rentTransaction.setDate(currentDate);
        rentTransaction.setTransactionId("rent123");
        rentSpending.setTransactions(List.of(rentTransaction));
        dailyBudgetCategorySpendingList.add(rentSpending);

        // Add groceries spending
        DailyCategorySpending grocerySpending = new DailyCategorySpending();
        grocerySpending.setCategory("Groceries");
        grocerySpending.setTotalCategorySpending(BigDecimal.valueOf(35));
        grocerySpending.setCurrentDate(currentDate);
        Transaction groceryTransaction = new Transaction();
        groceryTransaction.setAmount(BigDecimal.valueOf(35));
        groceryTransaction.setDate(currentDate);
        groceryTransaction.setTransactionId("grocery123");
        grocerySpending.setTransactions(List.of(groceryTransaction));
        dailyBudgetCategorySpendingList.add(grocerySpending);

        // Create expected DailyBudgetCategoryCriteria
        DailyBudgetCategoryCriteria expected = new DailyBudgetCategoryCriteria();
        expected.setSubBudget(subBudget);
        expected.setDate(currentDate);
        expected.setCategorySpendingByDate(dailyBudgetCategorySpendingList);
        expected.setActive(true);

        // Call the method under test
        DailyBudgetCategoryCriteria actual = dailyBudgetCategoryBuilderService.createDailyBudgetCriteria(
                subBudget, aprilFirstWeek, currentDate, dailyBudgetCategorySpendingList);

        // Assertions
        assertNotNull(actual);
        assertEquals(expected.getSubBudget(), actual.getSubBudget());
        assertEquals(expected.getDate(), actual.getDate());
        assertEquals(expected.isActive(), actual.isActive());

        // Verify category spending list
        assertEquals(expected.getCategorySpendingByDate().size(), actual.getCategorySpendingByDate().size());
        for (int i = 0; i < expected.getCategorySpendingByDate().size(); i++) {
            DailyCategorySpending expectedSpending = expected.getCategorySpendingByDate().get(i);
            DailyCategorySpending actualSpending = actual.getCategorySpendingByDate().get(i);

            assertEquals(expectedSpending.getCategory(), actualSpending.getCategory());
            assertEquals(expectedSpending.getTotalCategorySpending(), actualSpending.getTotalCategorySpending());
            assertEquals(expectedSpending.getCurrentDate(), actualSpending.getCurrentDate());

            // Verify transactions
            assertEquals(expectedSpending.getTransactions().size(), actualSpending.getTransactions().size());
            for (int j = 0; j < expectedSpending.getTransactions().size(); j++) {
                Transaction expectedTrans = expectedSpending.getTransactions().get(j);
                Transaction actualTrans = actualSpending.getTransactions().get(j);

                assertEquals(expectedTrans.getTransactionId(), actualTrans.getTransactionId());
                assertEquals(expectedTrans.getAmount(), actualTrans.getAmount());
                assertEquals(expectedTrans.getDate(), actualTrans.getDate());
            }
        }
    }

    @Test
    void testCreateDailyBudgetCriteria_whenCurrentDateIsOutsideBudgetScheduleRange_thenThrowException()
    {
        // Setup
        SubBudget subBudget = testSubBudget;

        // Create budget week for April 1-7, 2025
        BudgetScheduleRange aprilFirstWeek = new BudgetScheduleRange();
        aprilFirstWeek.setBudgetDateRange(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7)));
        aprilFirstWeek.setStartRange(LocalDate.of(2025, 4, 1));
        aprilFirstWeek.setEndRange(LocalDate.of(2025, 4, 7));
        aprilFirstWeek.setRangeType("Week");
        aprilFirstWeek.setBudgetedAmount(BigDecimal.valueOf(598));
        aprilFirstWeek.setSpentOnRange(BigDecimal.valueOf(1235));

        // Create a date outside the range (April 15, 2025)
        LocalDate outsideDate = LocalDate.of(2025, 4, 15);

        // Create daily category spending with the outside date
        List<DailyCategorySpending> dailyCategorySpendingList = new ArrayList<>();
        DailyCategorySpending rentSpending = new DailyCategorySpending();
        rentSpending.setCategory("Rent");
        rentSpending.setTotalCategorySpending(BigDecimal.valueOf(1200));
        rentSpending.setCurrentDate(outsideDate);
        Transaction rentTransaction = new Transaction();
        rentTransaction.setAmount(BigDecimal.valueOf(1200));
        rentTransaction.setDate(outsideDate);
        rentTransaction.setTransactionId("rent123");
        rentSpending.setTransactions(List.of(rentTransaction));
        dailyCategorySpendingList.add(rentSpending);

        // Assert that an IllegalArgumentException is thrown
        Exception exception = assertThrows(RuntimeException.class, () -> {
            dailyBudgetCategoryBuilderService.createDailyBudgetCriteria(
                    subBudget, aprilFirstWeek, outsideDate, dailyCategorySpendingList);
        });

        // Verify the exception message
        String expectedMessage = "Current date is outside the week range: " + aprilFirstWeek.getStartRange() + " - " + aprilFirstWeek.getEndRange();
        String actualMessage = exception.getMessage();

        assertTrue(actualMessage.contains(expectedMessage),
                "Expected message to contain '" + expectedMessage + "' but was '" + actualMessage + "'");
    }

    @Test
    void testUpdateBudgetCategoriesByDate_whenDailyBudgetCriteriaIsNull_thenReturnEmptyList(){
        List<BudgetCategory> budgetCategories = new ArrayList<>();
        BudgetCategory budgetCategory = new BudgetCategory();
        budgetCategories.add(budgetCategory);

        List<BudgetCategory> actual = dailyBudgetCategoryBuilderService.updateBudgetCategoriesByDate(null, budgetCategories);
        assertNotNull(actual);
        assertEquals(0, actual.size());
        assertTrue(actual.isEmpty());
    }

    @Test
    void testUpdateBudgetCategoriesByDate_whenExistingBudgetCategoriesIsNull_thenReturnEmptyList(){
        DailyBudgetCategoryCriteria dailyBudgetCategoryCriteria = new DailyBudgetCategoryCriteria();
        List<BudgetCategory> actual = dailyBudgetCategoryBuilderService.updateBudgetCategoriesByDate(dailyBudgetCategoryCriteria, null);
        assertNotNull(actual);
        assertEquals(0, actual.size());
    }

    @Test
    void testUpdateBudgetCategoriesByDate_whenExistingBudgetCategoriesIsEmpty_thenReturnEmptyList(){
        DailyBudgetCategoryCriteria dailyBudgetCategoryCriteria = new DailyBudgetCategoryCriteria();
        List<BudgetCategory> existingBudgetCategories = new ArrayList<>();
        List<BudgetCategory> actual = dailyBudgetCategoryBuilderService.updateBudgetCategoriesByDate(dailyBudgetCategoryCriteria, existingBudgetCategories);
        assertNotNull(actual);
        assertEquals(0, actual.size());
        assertTrue(actual.isEmpty());
    }

    @Test
    void testUpdateBudgetCategoriesByDate_whenExistingBudgetCategoryHasNewData_thenReturnUpdateBudgetCategory(){
        DailyBudgetCategoryCriteria dailyBudgetCriteria = new DailyBudgetCategoryCriteria();
        dailyBudgetCriteria.setSubBudget(testSubBudget);
        dailyBudgetCriteria.setActive(true);
        dailyBudgetCriteria.setDate(LocalDate.of(2025, 4, 8));

        List<DailyCategorySpending> dailyCategorySpendingList = new ArrayList<>();
        DailyCategorySpending grocerySpending = new DailyCategorySpending();
        grocerySpending.setCategory("Groceries");
        grocerySpending.setTotalCategorySpending(BigDecimal.valueOf(45.75));
        grocerySpending.setCurrentDate(LocalDate.of(2025, 4, 8));
        Transaction newGroceryTransaction = new Transaction();
        newGroceryTransaction.setAmount(BigDecimal.valueOf(45.75));
        newGroceryTransaction.setDate(LocalDate.of(2025, 4, 8));
        newGroceryTransaction.setTransactionId("grocery123");
        newGroceryTransaction.setMerchantName("Winco Foods");
        grocerySpending.setTransactions(List.of(newGroceryTransaction));
        dailyCategorySpendingList.add(grocerySpending);
        dailyBudgetCriteria.setCategorySpendingByDate(dailyCategorySpendingList);

        List<BudgetCategory> existingBudgetCategories = new ArrayList<>();
        // Existing rent category - should remain unchanged
        BudgetCategory existingRentCategory = new BudgetCategory();
        existingRentCategory.setCategoryName("Rent");
        existingRentCategory.setBudgetedAmount(1200.0);
        existingRentCategory.setBudgetActual(800.0);
        existingRentCategory.setStartDate(LocalDate.of(2025, 4, 1));
        existingRentCategory.setEndDate(LocalDate.of(2025, 4, 15));
        existingRentCategory.setSubBudgetId(testSubBudget.getId());
        existingRentCategory.setIsActive(true);
        Transaction RentTransaction = new Transaction();
        RentTransaction.setAmount(BigDecimal.valueOf(800));
        RentTransaction.setTransactionId("rent123");
        existingRentCategory.setTransactions(List.of(RentTransaction));
        existingBudgetCategories.add(existingRentCategory);

        // Existing groceries category - should be updated
        BudgetCategory existingGroceryCategory = new BudgetCategory();
        existingGroceryCategory.setCategoryName("Groceries");
        existingGroceryCategory.setBudgetedAmount(300.0);
        existingGroceryCategory.setBudgetActual(25.0); // Old actual amount
        existingGroceryCategory.setStartDate(LocalDate.of(2025, 4, 8));
        existingGroceryCategory.setEndDate(LocalDate.of(2025, 4, 13));
        existingGroceryCategory.setSubBudgetId(testSubBudget.getId());
        existingGroceryCategory.setIsActive(true);

        Transaction oldGroceryTransaction = new Transaction();
        oldGroceryTransaction.setAmount(BigDecimal.valueOf(25));
        oldGroceryTransaction.setTransactionId("grocery123");
        existingGroceryCategory.setTransactions(List.of(oldGroceryTransaction));
        existingBudgetCategories.add(existingGroceryCategory);

        // Call the method under test
        List<BudgetCategory> actualUpdatedCategories = dailyBudgetCategoryBuilderService.updateBudgetCategoriesByDate(
                dailyBudgetCriteria, existingBudgetCategories);

        // Assertions
        assertNotNull(actualUpdatedCategories);
        assertEquals(1, actualUpdatedCategories.size(), "Should only return the updated Groceries category");

        // Verify the Groceries category was updated
        BudgetCategory updatedGroceryCategory = actualUpdatedCategories.get(0);
        assertEquals("Groceries", updatedGroceryCategory.getCategoryName());
        assertEquals(300.0, updatedGroceryCategory.getBudgetedAmount()); // Unchanged
        assertEquals(70.75, updatedGroceryCategory.getBudgetActual()); // Updated
        assertEquals(LocalDate.of(2025, 4, 8), updatedGroceryCategory.getStartDate()); // Unchanged
        assertEquals(LocalDate.of(2025, 4, 13), updatedGroceryCategory.getEndDate()); // Unchanged
        assertEquals(testSubBudget.getId(), updatedGroceryCategory.getSubBudgetId()); // Unchanged

        // Verify transactions were updated
        assertEquals(1, updatedGroceryCategory.getTransactions().size());
        assertEquals("grocery123", updatedGroceryCategory.getTransactions().get(0).getTransactionId());
        assertEquals(BigDecimal.valueOf(45.75), updatedGroceryCategory.getTransactions().get(0).getAmount());
    }

    private DailyBudgetCategoryCriteria createDailyBudgetCategoryCriteriaForRentAndGroceries(){
        DailyBudgetCategoryCriteria dailyBudgetCategoryCriteria = new DailyBudgetCategoryCriteria();
        dailyBudgetCategoryCriteria.setSubBudget(testSubBudget);
        dailyBudgetCategoryCriteria.setActive(true);
        dailyBudgetCategoryCriteria.setDate(LocalDate.of(2025, 4, 1));

        DailyCategorySpending rentCategorySpending = new DailyCategorySpending();
        rentCategorySpending.setCategory("Rent");
        rentCategorySpending.setTotalCategorySpending(BigDecimal.valueOf(1200.00));
        rentCategorySpending.setCurrentDate(LocalDate.of(2025, 4, 1));
        List<Transaction> rentTransactions = new ArrayList<>();
        rentTransactions.add(createRentTransaction(BigDecimal.valueOf(1200)));
        rentCategorySpending.setTransactions(rentTransactions);

        DailyCategorySpending groceryCategorySpending = new DailyCategorySpending();
        groceryCategorySpending.setCategory("Groceries");
        groceryCategorySpending.setTotalCategorySpending(BigDecimal.valueOf(35.32));
        groceryCategorySpending.setCurrentDate(LocalDate.of(2025, 4, 1));
        List<Transaction> groceryTransactions = new ArrayList<>();
        groceryTransactions.add(createGroceryTransaction(BigDecimal.valueOf(35.32), LocalDate.of(2025, 4, 1)));
        groceryCategorySpending.setTransactions(groceryTransactions);

        dailyBudgetCategoryCriteria.setCategorySpendingByDate(List.of(rentCategorySpending, groceryCategorySpending));
        return dailyBudgetCategoryCriteria;
    }

    private Transaction createGroceryTransaction(BigDecimal amount, LocalDate date)
    {
        Transaction transaction = new Transaction();
        transaction.setAmount(amount);
        transaction.setDate(date);
        transaction.setTransactionId("e55555555555");
        transaction.setPosted(date);
        transaction.setMerchantName("Winco Foods");
        transaction.setDescription("PIN PURCHASE WINCO FOODS");
        transaction.setPending(false);
        return transaction;
    }

    private Transaction createRentTransaction(BigDecimal amount)
    {
        Transaction transaction = new Transaction();
        transaction.setAmount(amount);
        transaction.setTransactionId("e2e2e2e2e2");
        transaction.setPosted(LocalDate.of(2025, 4, 16));
        transaction.setMerchantName("Flex Finance");
        transaction.setPending(false);
        transaction.setAuthorizedDate(LocalDate.of(2025, 4, 16));
        transaction.setDescription("Purchase FLEX FINANCE");
        transaction.setCategories(List.of("Financial", "Service"));
        transaction.setAccountId("vBbQarwL0Yu8YD8EjxOMFNN0LwQ16LCkg0Roo");
        return transaction;
    }

    @AfterEach
    void tearDown() {
    }
}