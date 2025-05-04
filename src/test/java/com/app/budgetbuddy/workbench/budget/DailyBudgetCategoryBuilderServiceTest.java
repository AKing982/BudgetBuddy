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
        dailyCategorySpending.setCategorySpending(BigDecimal.valueOf(707));
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
        dailyCategorySpending.setCategorySpending(BigDecimal.valueOf(1200.0));
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
    void testBuildDailyBudgetCategoryList_whenGroceriesTransactionListNull_returnBudgetCategoryWithEmptyTransactionList(){

    }

    private DailyBudgetCategoryCriteria createDailyBudgetCategoryCriteriaForRentAndGroceries(){
        DailyBudgetCategoryCriteria dailyBudgetCategoryCriteria = new DailyBudgetCategoryCriteria();
        dailyBudgetCategoryCriteria.setSubBudget(testSubBudget);
        dailyBudgetCategoryCriteria.setActive(true);
        dailyBudgetCategoryCriteria.setDate(LocalDate.of(2025, 4, 1));

        DailyCategorySpending rentCategorySpending = new DailyCategorySpending();
        rentCategorySpending.setCategory("Rent");
        rentCategorySpending.setCategorySpending(BigDecimal.valueOf(1200.00));
        rentCategorySpending.setCurrentDate(LocalDate.of(2025, 4, 1));
        List<Transaction> rentTransactions = new ArrayList<>();
        rentTransactions.add(createRentTransaction(BigDecimal.valueOf(1200)));
        rentCategorySpending.setTransactions(rentTransactions);

        DailyCategorySpending groceryCategorySpending = new DailyCategorySpending();
        groceryCategorySpending.setCategory("Groceries");
        groceryCategorySpending.setCategorySpending(BigDecimal.valueOf(35.32));
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