package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.*;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.exceptions.InvalidBudgetAmountException;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.services.BudgetService;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.services.TransactionCategoryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class BudgetCalculatorTest {

    @InjectMocks
    private BudgetCalculations budgetCalculator;

    @Mock
    private BudgetService budgetService;

    @Mock
    private BudgetGoalsService budgetGoalsService;

    @Mock
    private TransactionCategoryService transactionCategoryService;

    @Mock
    private RecurringTransactionService recurringTransactionService;

    @Mock
    private BudgetValidator budgetValidator;

    private Category testCategory;

    private Category testCategory2;

    private Category testCategory3;

    private Category testCategory4;

    private TransactionCategoryEntity userBudgetCategory;

    private TransactionCategoryEntity userBudgetCategory2;

    private TransactionCategoryEntity userBudgetCategory3;

    private Budget testBudget;

    private BudgetPeriod testBudgetPeriod;

    @BeforeEach
    void setUp() {

        testCategory = new Category();
        testCategory.setCategoryDescription("Groceries and Supermarkets");
        testCategory.setCategoryName("Groceries");
        testCategory.setActual(new BigDecimal("340"));
        testCategory.setBudgetedAmount(new BigDecimal("500"));
        testCategory.setCategoryEndDate(LocalDate.of(2024, 6, 30));
        testCategory.setCategoryStartDate(LocalDate.of(2024, 6, 1));
        testCategory.setActive(true);
        testCategory.setCategoryType(CategoryType.GROCERIES);

        testCategory2 = new Category();
        testCategory2.setCategoryDescription("Subscriptions");
        testCategory2.setCategoryName("Subscriptions");
        testCategory2.setActual(new BigDecimal("67"));
        testCategory2.setBudgetedAmount(new BigDecimal("150"));
        testCategory2.setCategoryEndDate(LocalDate.of(2024, 6, 30));
        testCategory2.setCategoryStartDate(LocalDate.of(2024, 6, 1));
        testCategory2.setActive(true);
        testCategory2.setCategoryType(CategoryType.SUBSCRIPTIONS);

        testCategory3 = new Category();
        testCategory3.setCategoryDescription("Rent");
        testCategory3.setCategoryName("Rent");
        testCategory3.setActual(null);
        testCategory3.setBudgetedAmount(new BigDecimal("1200"));
        testCategory3.setCategoryEndDate(LocalDate.of(2024, 6, 30));
        testCategory3.setCategoryStartDate(LocalDate.of(2024, 6, 1));
        testCategory3.setActive(true);
        testCategory3.setCategoryType(CategoryType.RENT);

        userBudgetCategory = new TransactionCategoryEntity();
        userBudgetCategory.setBudgetedAmount(500.00);
        userBudgetCategory.setActual(340.00);
        userBudgetCategory.setStartDate(LocalDate.of(2024, 6, 1));
        userBudgetCategory.setEndDate(LocalDate.of(2024, 6, 30));
        userBudgetCategory.setId(1L);
        userBudgetCategory.setCategory(createCategory("Groceries", "Groceries"));
        userBudgetCategory.setIsactive(true);

        userBudgetCategory2 = new TransactionCategoryEntity();
        userBudgetCategory2.setBudgetedAmount(150.00);
        userBudgetCategory2.setActual(67.00);
        userBudgetCategory2.setStartDate(LocalDate.of(2024, 6, 1));
        userBudgetCategory2.setEndDate(LocalDate.of(2024, 6, 30));
        userBudgetCategory2.setId(2L);
        userBudgetCategory2.setIsactive(true);
        userBudgetCategory2.setCategory(createCategory("Subscriptions", "Subscriptions"));

        userBudgetCategory3 = new TransactionCategoryEntity();
        userBudgetCategory3.setBudgetedAmount(1200.00);
        userBudgetCategory3.setActual(1200.00);
        userBudgetCategory3.setStartDate(LocalDate.of(2024, 6, 1));
        userBudgetCategory3.setEndDate(LocalDate.of(2024, 6, 30));
        userBudgetCategory3.setId(3L);
        userBudgetCategory3.setCategory(createCategory("Rent", "Rent"));
        userBudgetCategory3.setIsactive(true);

        testBudget = new Budget();
        testBudget.setActual(new BigDecimal("400.00"));
        testBudget.setBudgetName("Test Budget");
        testBudget.setBudgetDescription("Test Budget Description");
        testBudget.setBudgetAmount(new BigDecimal("500.00"));
        testBudget.setUserId(1L);
        testBudget.setId(1L);

        testBudgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 30));
    }

    @Test
    void testGetTotalSavedInCategories_whenCategoriesListIsEmpty_thenReturnZero(){
        Set<Category> categories = new HashSet<>();

        BigDecimal actual = budgetCalculator.getTotalSavedInCategories(categories);
        assertEquals(0, actual.intValue());
    }

    @Test
    void testGetTotalSavedInCategories_whenCategoryListHasTwoItems_thenReturnSaved(){
        Set<Category> categories = new HashSet<>();
        categories.add(testCategory);
        categories.add(testCategory2);

        BigDecimal expectedAmount = new BigDecimal("243");

        BigDecimal actual = budgetCalculator.getTotalSavedInCategories(categories);
        assertNotNull(actual);
        assertEquals(expectedAmount, actual);
    }

    @Test
    void testGetTotalSavedInCategories_whenCategoryItemIsNull_thenReturnZero(){
        Set<Category> categories = new HashSet<>();
        categories.add(testCategory);
        categories.add(null);

        BigDecimal expected = new BigDecimal("160");
        BigDecimal actual = budgetCalculator.getTotalSavedInCategories(categories);
        assertEquals(expected.intValue(), actual.intValue());
    }

    @Test
    void testGetTotalSavedInCategories_whenCategorySpendingIsNull_thenSkipAndReturnSaved(){
        Set<Category> categories = new HashSet<>();
        categories.add(testCategory);
        categories.add(testCategory3);

        BigDecimal expected = new BigDecimal("160");

        BigDecimal actual = budgetCalculator.getTotalSavedInCategories(categories);
        assertNotNull(actual);
    }

    @Test
    void testGetCategoryBudgetAmountProportion_whenTotalCategorySpendingIsNull_thenThrowException(){
        assertThrows(IllegalArgumentException.class, () -> {
            budgetCalculator.getCategoryBudgetAmountProportion(null, new BigDecimal("340"), new BigDecimal("890"));
        });
    }

    @Test
    void testGetCategoryBudgetAmountProportion_whenTotalBudgetAmountIsNull_thenThrowException(){
        assertThrows(IllegalArgumentException.class, () -> {
            budgetCalculator.getCategoryBudgetAmountProportion(new BigDecimal("150"), null, new BigDecimal("890"));
        });
    }

    @Test
    void testGetCategoryBudgetAmountProportion_whenTotalSpendingOnCategoriesIsNull_thenThrowException(){
        assertThrows(IllegalArgumentException.class, () -> {
            budgetCalculator.getCategoryBudgetAmountProportion(new BigDecimal("150"), new BigDecimal("500"), null);
        });
    }

    @Test
    void testGetCategoryBudgetAmountProportion_whenTotalSpendingCategoriesEqualZero_thenReturnZero(){
        final BigDecimal totalCategorySpending = new BigDecimal("210");
        final BigDecimal totalBudgetAmount = new BigDecimal("420");
        final BigDecimal totalSpendingOnCategories = BigDecimal.ZERO;

        BigDecimal actual = budgetCalculator.getCategoryBudgetAmountProportion(totalCategorySpending, totalBudgetAmount, totalSpendingOnCategories);
        assertEquals(0, actual.intValue());
    }

    @Test
    void testGetCategoryBudgetAmountProportion_thenReturnBudgetAmountProportion(){
        final BigDecimal totalCategorySpending = new BigDecimal("210");
        final BigDecimal totalBudgetAmount = new BigDecimal("420");
        final BigDecimal totalSpendingOnCategories = new BigDecimal("890");

        final BigDecimal expected = new BigDecimal("100");
        BigDecimal actual = budgetCalculator.getCategoryBudgetAmountProportion(totalCategorySpending, totalBudgetAmount, totalSpendingOnCategories);
        assertEquals(expected.intValue(), actual.intValue());
    }

    @Test
    void testGetCategoryBudgetAmountProportion_whenTotalBudgetAmountEqualsZero_thenReturnZero(){
        final BigDecimal totalCategorySpending = new BigDecimal("210");
        final BigDecimal totalBudgetAmount = BigDecimal.ZERO;
        final BigDecimal totalSpendingOnCategories = new BigDecimal("890");

        BigDecimal actual = budgetCalculator.getCategoryBudgetAmountProportion(totalCategorySpending, totalBudgetAmount, totalSpendingOnCategories);
        assertEquals(0, actual.intValue());
    }

    @Test
    void testGetCategoryBudgetAmountProportion_whenTotalCategorySpendingEqualsZero_thenReturnZero(){
        final BigDecimal totalCategorySpending = BigDecimal.ZERO;
        final BigDecimal totalBudgetAmount = new BigDecimal("420");
        final BigDecimal totalSpendingOnCategories = new BigDecimal("890");

        BigDecimal actual = budgetCalculator.getCategoryBudgetAmountProportion(totalCategorySpending, totalBudgetAmount, totalSpendingOnCategories);
        assertEquals(0, actual.intValue());
    }

//    @Test
//    void testGetTotalSavedInUserBudgetCategoriesByPeriod_whenBudgetPeriodIsNull_thenThrowException(){
//        assertThrows(RuntimeException.class, () -> {
//            budgetCalculator.getTotalSavedInUserBudgetCategoriesByPeriod(null, testBudget);
//        });
//    }
//
//    @Test
//    void testGetTotalSavedInUserBudgetCategoriesByPeriod_whenBudgetIsNull_thenThrowException()
//    {
//        assertThrows(RuntimeException.class, () -> {
//            budgetCalculator.getTotalSavedInUserBudgetCategoriesByPeriod(testBudgetPeriod, null);
//        });
//    }

//    @Test
//    void testGetTotalSavedInUserBudgetCategoriesByPeriod_whenUserBudgetCategoryListIsEmpty_thenReturnZero(){
//        List<TransactionCategoryEntity> userBudgetCategories = new ArrayList<>();
//
//        LocalDate startDate = testBudgetPeriod.startDate();
//        LocalDate endDate = testBudgetPeriod.endDate();
//        Long userId = testBudget.getUserId();
//
//        Mockito.when(transactionCategoryService.getTransactionCategoriesByUserAndDateRange(userId, startDate, endDate)).thenReturn(userBudgetCategories);
//
//        BigDecimal actual = budgetCalculator.getTotalSavedInUserBudgetCategoriesByPeriod(testBudgetPeriod, testBudget);
//        assertEquals(0, actual.intValue());
//    }
//
//    @Test
//    void testGetTotalSavedInUserBudgetCategoriesByPeriod_ThenReturnTotalSaved(){
//
//        TransactionCategoryEntity groceryCategory = createUserBudgetCategory("Groceries", "Groceries",LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 7), 410.00, 210.00);
//        TransactionCategoryEntity gasCategory = createUserBudgetCategory("Gas", "Gas", LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 7), 78.00, 35.00);
//        List<TransactionCategoryEntity> userBudgetCategories = new ArrayList<>();
//        userBudgetCategories.add(groceryCategory);
//        userBudgetCategories.add(gasCategory);
//
//        LocalDate startDate = testBudgetPeriod.startDate();
//        LocalDate endDate = testBudgetPeriod.endDate();
//        Long userId = testBudget.getUserId();
//        Mockito.when(transactionCategoryService.getTransactionCategoriesByUserAndDateRange(userId, startDate, endDate)).thenReturn(userBudgetCategories);
//
//        BigDecimal expectedSavings = new BigDecimal("243");
//        BigDecimal actualSavings = budgetCalculator.getTotalSavedInUserBudgetCategoriesByPeriod(testBudgetPeriod, testBudget);
//        assertEquals(expectedSavings.intValue(), actualSavings.intValue());
//    }
//
//    @ParameterizedTest
//    @MethodSource("provideBudgetPeriodsAndBudgets")
//    void testGetTotalSavedInUserBudgetCategoriesByPeriodParam(BudgetPeriod budgetPeriod, Budget budget, List<TransactionCategoryEntity> userBudgetCategories, BigDecimal expectedSavings) {
//        // Mock the behavior of the service method to return the supplied list of UserBudgetCategoryEntity
//        Mockito.when(transactionCategoryService.getTransactionCategoriesByUserAndDateRange(
//                        budget.getUserId(), budgetPeriod.startDate(), budgetPeriod.endDate()))
//                .thenReturn(userBudgetCategories);
//
//        // Call the method under test
//        BigDecimal actualSavings = budgetCalculator.getTotalSavedInUserBudgetCategoriesByPeriod(budgetPeriod, budget);
//
//        // Assert the result
//        assertEquals(expectedSavings, actualSavings);
//    }

    @Test
    void testCalculateWeeklyBudgetedAmount_WhenBudgetPeriodIsNull_thenThrowException(){
        assertThrows(RuntimeException.class, () -> {
            budgetCalculator.calculateBudgetedAmountByPeriod(null, testBudget);
        });
    }

    @Test
    void testCalculateWeeklyBudgetedAmount_whenBudgetIsNull_thenThrowException(){
        assertThrows(RuntimeException.class, () -> {
            budgetCalculator.calculateBudgetedAmountByPeriod(testBudgetPeriod, null);
        });
    }

    @Test
    void testCalculateWeeklyBudgetedAmount_whenPeriodIsWeekly_thenReturnBudgetAmount(){
        BudgetPeriod weeklyBudgetPeriod = new BudgetPeriod(Period.WEEKLY, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 31));

        BigDecimal expectedWeeklyBudgetAmount = new BigDecimal("125.00");
        BigDecimal actualBudgetAmount = budgetCalculator.calculateBudgetedAmountByPeriod(weeklyBudgetPeriod, testBudget);
        assertEquals(expectedWeeklyBudgetAmount, actualBudgetAmount);
    }

    @Test
    void testCalculateBudgetedAmount_whenPeriodIsWeekly_DateRangeIsSameWeek_thenReturnBudgetAmount(){
        BudgetPeriod weeklyBudgetPeriod = new BudgetPeriod(Period.WEEKLY, LocalDate.of(2024, 9, 28), LocalDate.of(2024, 10, 5));
        BigDecimal expectedWeeklyBudgetAmount = new BigDecimal("115.48");
        BigDecimal actualBudgetAmount = budgetCalculator.calculateBudgetedAmountByPeriod(weeklyBudgetPeriod, testBudget);
        assertEquals(expectedWeeklyBudgetAmount, actualBudgetAmount);
    }

    @Test
    void testCalculateBudgetedAmountByPeriod_whenPeriodIsBiWeekly_thenReturnBudgetAmount(){
        BudgetPeriod biWeeklyBudgetPeriod = new BudgetPeriod(Period.BIWEEKLY, LocalDate.of(2024, 9, 28), LocalDate.of(2024, 10, 12));
        BigDecimal expectedBiWeeklyBudgetAmount = new BigDecimal("230.42");
        BigDecimal actualBudgetAmount = budgetCalculator.calculateBudgetedAmountByPeriod(biWeeklyBudgetPeriod, testBudget);
        assertEquals(expectedBiWeeklyBudgetAmount, actualBudgetAmount);
        assertNotNull(actualBudgetAmount);
    }

    @Test
    void testCalculateBudgetedAmountByPeriod_whenPeriodIsDaily_thenReturnBudgetAmount(){
        BudgetPeriod dailyBudgetPeriod = new BudgetPeriod(Period.DAILY, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 31));
        BigDecimal expectedDailyBudgetAmount = new BigDecimal("16.13");
        BigDecimal actualBudgetAmount = budgetCalculator.calculateBudgetedAmountByPeriod(dailyBudgetPeriod, testBudget);
        assertEquals(expectedDailyBudgetAmount, actualBudgetAmount);
        assertNotNull(actualBudgetAmount);
    }

    @Test
    void testCalculateBudgetedAmountByPeriod_whenPeriodIsDailyAndDateRangeIsSameDay_thenReturnBudgetAmount(){
        BudgetPeriod dailyBudgetPeriod = new BudgetPeriod(Period.DAILY, LocalDate.of(2024, 10, 1),  LocalDate.of(2024, 10,1));
        BigDecimal expected = new BigDecimal("16.45");
        BigDecimal actual = budgetCalculator.calculateBudgetedAmountByPeriod(dailyBudgetPeriod, testBudget);
        assertEquals(expected, actual);
        assertNotNull(actual);
    }

    @Test
    void testCalculateBudgetedAmountByPeriod_whenPeriodIsMonthly_thenReturnBudgetAmount(){
        BudgetPeriod monthlyBudgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 31));
        BigDecimal expectedMonthlyBudgetAmount = new BigDecimal("500.00");
        BigDecimal actual = budgetCalculator.calculateBudgetedAmountByPeriod(monthlyBudgetPeriod, testBudget);
        assertEquals(expectedMonthlyBudgetAmount, actual);
        assertNotNull(actual);
    }

    @Test
    void testCalculateCategoryBudgetAmountForPeriod_whenCategorySpendingIsNull_thenReturnZero(){
        BigDecimal actual = budgetCalculator.calculateCategoryBudgetAmountForPeriod("Gas", null, new BigDecimal("890"), testBudget, testBudgetPeriod);
        assertEquals(0, actual.intValue());
    }

    @Test
    void testCalculateCategoryBudgetAmountForPeriod_whenTotalSpendingOnCategoriesIsNull_thenReturnZero(){
        BigDecimal actual = budgetCalculator.calculateCategoryBudgetAmountForPeriod("Gas", new BigDecimal("250"), null, testBudget, testBudgetPeriod);
        assertEquals(0, actual.intValue());
    }

    @Test
    void testCalculateCategoryBudgetAmountForPeriod_whenBudgetIsNull_thenReturnZero(){
        BigDecimal actual = budgetCalculator.calculateCategoryBudgetAmountForPeriod("Gas", new BigDecimal("250"), new BigDecimal("890"), null, testBudgetPeriod);
        assertEquals(0, actual.intValue());
    }

    @Test
    void testCalculateCategoryBudgetAmountForPeriod_whenPeriodIsMonthly_thenReturnBudgetAmount(){
        BudgetPeriod monthlyBudgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 31));
        BigDecimal categorySpending = new BigDecimal("500");
        BigDecimal totalSpendingOnCategories = new BigDecimal("2965.00");
        Budget budget = new Budget();
        budget.setBudgetAmount(new BigDecimal("3070.00"));

        BigDecimal expectedCategoryBudgetAmount = new BigDecimal("517.60");
        BigDecimal actual = budgetCalculator.calculateCategoryBudgetAmountForPeriod("Groceries", categorySpending, totalSpendingOnCategories, budget, monthlyBudgetPeriod);
        assertEquals(expectedCategoryBudgetAmount, actual);
        assertNotNull(actual);
    }

    @Test
    void testCalculateCategoryBudgetAmountForPeriod_whenMonthStartsPreviousMonthToNextMonth_thenReturnBudgetAmount(){
        BudgetPeriod monthBudgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 9, 28), LocalDate.of(2024, 10, 26));
        BigDecimal categorySpending = new BigDecimal("1200.00");
        BigDecimal totalSpendingOnCategories = new BigDecimal("2965.00");
        Budget budget = new Budget();
        budget.setBudgetAmount(new BigDecimal("3070.00"));
        BigDecimal expectedCategoryBudgetAmount = new BigDecimal("1242.43");

        BigDecimal actual = budgetCalculator.calculateCategoryBudgetAmountForPeriod("Rent", categorySpending, totalSpendingOnCategories, budget, monthBudgetPeriod);
        assertEquals(expectedCategoryBudgetAmount, actual);
        assertNotNull(actual);
    }

    @Test
    void testCalculateCategoryBudgetAmountForPeriod_whenPeriodIsWeekly_thenReturnBudgetAmount(){
        BudgetPeriod weeklyBudgetPeriod = new BudgetPeriod(Period.WEEKLY, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 31));
        BigDecimal categorySpending = new BigDecimal("500.00");
        BigDecimal totalSpendingOnCategories = new BigDecimal("2965.00");
        Budget budget = new Budget();
        budget.setBudgetAmount(new BigDecimal("3070.00"));
        BigDecimal expectedCategoryBudgetAmount = new BigDecimal("129.40");

        BigDecimal actual = budgetCalculator.calculateCategoryBudgetAmountForPeriod("Groceries", categorySpending, totalSpendingOnCategories, budget, weeklyBudgetPeriod);
        assertEquals(expectedCategoryBudgetAmount, actual);
        assertNotNull(actual);
    }

    @Test
    void testCalculateCategoryBudgetAmountForPeriod_whenPeriodIsWeeklyAndDatesAreSameWeek_thenReturnBudgetAmount(){
        BudgetPeriod weeklyBudgetPeriod = new BudgetPeriod(Period.WEEKLY, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 8));
        BigDecimal categorySpending = new BigDecimal("500.00");
        BigDecimal totalSpendingOnCategories = new BigDecimal("2965.00");
        Budget budget = new Budget();
        budget.setBudgetAmount(new BigDecimal("3070.00"));
        BigDecimal expectedCategoryBudgetAmount = new BigDecimal("119.54");

        BigDecimal actual = budgetCalculator.calculateCategoryBudgetAmountForPeriod("Groceries", categorySpending, totalSpendingOnCategories, budget, weeklyBudgetPeriod);
        assertEquals(expectedCategoryBudgetAmount, actual);
        assertNotNull(actual);
    }

    @Test
    void testCalculateCategoryBudgetAmountForPeriod_whenPeriodIsBiWeekly_thenReturnBudgetAmount(){
        BudgetPeriod biweeklybudgetPeriod = new BudgetPeriod(Period.BIWEEKLY, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 31));
        BigDecimal categorySpending = new BigDecimal("500.00");
        BigDecimal totalSpendingOnCategories = new BigDecimal("2965.00");
        Budget budget = new Budget();
        budget.setBudgetAmount(new BigDecimal("3070.00"));
        BigDecimal expectedCategoryBudgetAmount = new BigDecimal("238.53");
        BigDecimal actual = budgetCalculator.calculateCategoryBudgetAmountForPeriod("Groceries",categorySpending, totalSpendingOnCategories, budget, biweeklybudgetPeriod);
        assertEquals(expectedCategoryBudgetAmount, actual);
        assertNotNull(actual);
    }

    @Test
    void testCalculateCategoryBudgetAmountForPeriod_whenPeriodIsBetweenTwoDatesInMonth_thenReturnBudgetAmount(){
        BudgetPeriod biWeeklyBudgetPeriod = new BudgetPeriod(Period.BIWEEKLY, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 15));
        BigDecimal categorySpending = new BigDecimal("500.00");
        BigDecimal totalSpendingOnCategories = new BigDecimal("2965.00");
        Budget budget = new Budget();
        budget.setBudgetAmount(new BigDecimal("3070.00"));
        BigDecimal expectedCategoryBudgetAmount = new BigDecimal("238.53");
        BigDecimal actual = budgetCalculator.calculateCategoryBudgetAmountForPeriod("Groceries", categorySpending, totalSpendingOnCategories, budget, biWeeklyBudgetPeriod);
        assertEquals(expectedCategoryBudgetAmount, actual);
        assertNotNull(actual);
    }

//    @Test
//    void testLoadCategoryBudgetsForPeriod_whenBudgetIsNull_thenReturnEmptyTreeMap(){
//        TreeMap<DateRange, List<TransactionCategoryEntity>> userBudgetCategoryMap = new TreeMap<>();
//
//        TreeMap<DateRange, List<TransactionCategoryEntity>> actual = budgetCalculator.loadCategoryBudgetsForPeriod(null, testBudgetPeriod);
//        assertNotNull(actual);
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testLoadCategoryBudgetsForPeriod_whenBudgetPeriodIsNull_thenReturnEmptyTreeMap(){
//        TreeMap<DateRange, List<TransactionCategoryEntity>> userBudgetCategoryMap = budgetCalculator.loadCategoryBudgetsForPeriod(testBudget, null);
//        assertNotNull(userBudgetCategoryMap);
//        assertTrue(userBudgetCategoryMap.isEmpty());
//    }

//    @Test
//    void testLoadCategoryBudgetsForPeriod_returnTreeMap(){
//        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 15));
//        TreeMap<DateRange, List<TransactionCategoryEntity>> userBudgetCategoryMap = new TreeMap<>();
//        DateRange dateRange = new DateRange(LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 15));
//        List<TransactionCategoryEntity> expectedUserBudgets = new ArrayList<>();
//        expectedUserBudgets.add(createUserBudgetCategory("Groceries", "Groceries", LocalDate.of(2024,10, 1), LocalDate.of(2024, 10, 7), 125.00, 100.00));
//        expectedUserBudgets.add(createUserBudgetCategory("Gas", "Gas", LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 7), 67.00, 35.00));
//        userBudgetCategoryMap.put(dateRange, expectedUserBudgets);
//
//        Mockito.when(transactionCategoryService.getTransactionCategoriesByUserAndDateRange(1L, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 15))).thenReturn(expectedUserBudgets);
//        TreeMap<DateRange, List<TransactionCategoryEntity>> userBudgets = budgetCalculator.loadCategoryBudgetsForPeriod(testBudget, budgetPeriod);
//        assertEquals(userBudgetCategoryMap.size(), userBudgets.size());
//        assertEquals(userBudgetCategoryMap.get(dateRange).size(), userBudgets.get(dateRange).size());
//        for(int i = 0; i < expectedUserBudgets.size(); i++){
//            assertEquals(expectedUserBudgets.get(i), userBudgets.get(dateRange).get(i));
//        }
//        assertEquals(userBudgetCategoryMap, userBudgets);
//    }
//
//    @Test
//    void testLoadCategoryBudgetsForPeriod_whenServiceReturnsEmptyArray_thenReturnEmptyTreeMap(){
//        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 15));
//        DateRange dateRange = new DateRange(LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 15));
//
//        Mockito.when(transactionCategoryService.getTransactionCategoriesByUserAndDateRange(1L, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 15)))
//                .thenReturn(new ArrayList<>());
//
//        TreeMap<DateRange, List<TransactionCategoryEntity>> userBudgets = budgetCalculator.loadCategoryBudgetsForPeriod(testBudget, budgetPeriod);
//
//        assertNotNull(userBudgets);
//        assertEquals(1, userBudgets.size());
//        assertTrue(userBudgets.containsKey(dateRange));
//        assertTrue(userBudgets.get(dateRange).isEmpty());
//    }

//    @Test
//    void testLoadCategoryBudgetsForPeriod_withInvalidDates_thenThrowException() {
//        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 10, 15), LocalDate.of(2024, 10, 1));
//
//        assertThrows(IllegalArgumentException.class, () -> {
//            budgetCalculator.loadCategoryBudgetsForPeriod(testBudget, budgetPeriod);
//        });
//    }
//
//    @Test
//    void testLoadCategoryBudgetsForPeriod_withWeeklyBudgetPeriod() {
//        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.WEEKLY, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 7));
//        DateRange dateRange = new DateRange(LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 7));
//
//        List<TransactionCategoryEntity> expectedUserBudgets = new ArrayList<>();
//        expectedUserBudgets.add(createUserBudgetCategory("Groceries", "Groceries", LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 7), 125.00, 100.00));
//
//        Mockito.when(transactionCategoryService.getTransactionCategoriesByUserAndDateRange(1L, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 7)))
//                .thenReturn(expectedUserBudgets);
//
//        TreeMap<DateRange, List<TransactionCategoryEntity>> userBudgets = budgetCalculator.loadCategoryBudgetsForPeriod(testBudget, budgetPeriod);
//
//        assertEquals(1, userBudgets.size());
//        assertEquals(expectedUserBudgets.size(), userBudgets.get(dateRange).size());
//        assertEquals(expectedUserBudgets.get(0), userBudgets.get(dateRange).get(0));
//    }

    @Test
    void testCreateCategoryBudgetAmountForPeriod_whenSingleDayRange_thenThrowException(){

    }


    @Test
    void testCreateCategoryBudgetMap_whenBudgetPeriodIsNull_thenReturnEmptyMap(){
        List<CategoryPeriodSpending> categorySpendings = new ArrayList<>();
        Map<String, BigDecimal> actual = budgetCalculator.createCategoryToBudgetMap(categorySpendings, testBudget, new BigDecimal("890"), null);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateCategoryBudgetMap_thenReturnMap(){
        Map<String, BigDecimal> categoryToBudgetMap = new HashMap<>();
        List<CategoryPeriodSpending> categorySpendings = new ArrayList<>();
        categorySpendings.add(createCategorySpending("Groceries", new BigDecimal("517.60")));
        categorySpendings.add(createCategorySpending("Gas", new BigDecimal("67")));
        categoryToBudgetMap.put("Groceries", new BigDecimal("536.02"));
        categoryToBudgetMap.put("Gas", new BigDecimal("69.38"));

        BudgetPeriod monthlyBudgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 31));

        BigDecimal totalSpendingOnAllCategories = new BigDecimal("2965");
        Budget budget = new Budget();
        budget.setBudgetAmount(new BigDecimal("3070"));

        Map<String, BigDecimal> actual = budgetCalculator.createCategoryToBudgetMap(categorySpendings, budget, totalSpendingOnAllCategories, monthlyBudgetPeriod);
        assertNotNull(actual);
        assertEquals(categoryToBudgetMap.size(), actual.size());
        for(Map.Entry<String, BigDecimal> entry : categoryToBudgetMap.entrySet()){
            assertTrue(actual.containsKey(entry.getKey()));
            assertEquals(entry.getValue(), actual.get(entry.getKey()));
        }
    }

    @Test
    void testCreateCategoryBudgetMap_whenCategorySpendingHasNullEntry_thenSkipAndReturnMap(){
        Map<String, BigDecimal> categoryToBudgetMap = new HashMap<>();
        List<CategoryPeriodSpending> categorySpendings = new ArrayList<>();
        categorySpendings.add(createCategorySpending("Groceries", new BigDecimal("517.60")));
        categorySpendings.add(null);
        categoryToBudgetMap.put("Groceries", new BigDecimal("536.02"));

        BudgetPeriod monthlyBudgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 31));

        BigDecimal totalSpendingOnAllCategories = new BigDecimal("2965");
        Budget budget = new Budget();
        budget.setBudgetAmount(new BigDecimal("3070"));

        Map<String, BigDecimal> actual = budgetCalculator.createCategoryToBudgetMap(categorySpendings, budget, totalSpendingOnAllCategories, monthlyBudgetPeriod);
        assertNotNull(actual);
        assertEquals(categoryToBudgetMap.size(), actual.size());
        for(Map.Entry<String, BigDecimal> entry : categoryToBudgetMap.entrySet()){
            assertTrue(actual.containsKey(entry.getKey()));
            assertEquals(entry.getValue(), actual.get(entry.getKey()));
        }
    }

    @Test
    void testCreateCategoryBudgetMap_whenCategorySpendingListIsEmpty_thenReturnEmptyMap(){
        List<CategoryPeriodSpending> categorySpendings = new ArrayList<>();

        Map<String, BigDecimal> actual = budgetCalculator.createCategoryToBudgetMap(categorySpendings, testBudget, new BigDecimal("890"), testBudgetPeriod);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateCategoryBudgetMap_whenBudgetIsNull_thenReturnEmptyMap() {
        List<CategoryPeriodSpending> categorySpendings = new ArrayList<>();
        categorySpendings.add(createCategorySpending("Groceries", new BigDecimal("517.60")));
        Map<String, BigDecimal> actual = budgetCalculator.createCategoryToBudgetMap(categorySpendings, null, new BigDecimal("890"), testBudgetPeriod);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateCategoryBudgetMap_whenTotalSpendingOnAllCategoriesIsZero_thenReturnEmptyMap() {
        List<CategoryPeriodSpending> categorySpendings = new ArrayList<>();
        categorySpendings.add(createCategorySpending("Groceries", new BigDecimal("517.60")));
        Map<String, BigDecimal> actual = budgetCalculator.createCategoryToBudgetMap(categorySpendings, testBudget, BigDecimal.ZERO, testBudgetPeriod);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateCategoryBudgetMap_whenTotalSpendingOnAllCategoriesIsNegative_thenReturnEmptyMap() {
        List<CategoryPeriodSpending> categorySpendings = new ArrayList<>();
        categorySpendings.add(createCategorySpending("Groceries", new BigDecimal("517.60")));
        Map<String, BigDecimal> actual = budgetCalculator.createCategoryToBudgetMap(categorySpendings, testBudget, new BigDecimal("-890"), testBudgetPeriod);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateCategoryBudgetMap_whenDuplicateCategoryNames_thenReturnLatestOrCumulativeAmount() {
        List<CategoryPeriodSpending> categorySpendings = new ArrayList<>();
        categorySpendings.add(createCategorySpending("Groceries", new BigDecimal("100")));
        categorySpendings.add(createCategorySpending("Groceries", new BigDecimal("200")));
        Map<String, BigDecimal> actual = budgetCalculator.createCategoryToBudgetMap(categorySpendings, testBudget, new BigDecimal("300"), testBudgetPeriod);
        assertNotNull(actual);
        assertEquals(1, actual.size());
        assertEquals(new BigDecimal("Amount Based on Latest Entry or Cumulative Logic"), actual.get("Groceries"));
    }

    @Test
    void testCreateCategoryBudgetMap_whenCategoryNameIsNull_thenSkipAndReturnMap() {
        List<CategoryPeriodSpending> categorySpendings = new ArrayList<>();
        categorySpendings.add(createCategorySpending(null, new BigDecimal("200")));
        Map<String, BigDecimal> actual = budgetCalculator.createCategoryToBudgetMap(categorySpendings, testBudget, new BigDecimal("200"), testBudgetPeriod);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateCategoryBudgetMap_whenActualSpendingIsNull_thenSkipAndReturnMap() {
        List<CategoryPeriodSpending> categorySpendings = new ArrayList<>();
        categorySpendings.add(createCategorySpending("Groceries", null));
        Map<String, BigDecimal> actual = budgetCalculator.createCategoryToBudgetMap(categorySpendings, testBudget, new BigDecimal("200"), testBudgetPeriod);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCalculateSavingsGoalProgress_WhenBudgetIsNull_thenReturnZero(){
        Set<TransactionCategoryEntity> categories = new HashSet<>();
        BigDecimal actual = budgetCalculator.calculateSavingsGoalProgress(null, categories);
        assertNotNull(actual);
        assertEquals(0, actual.intValue());
    }

    @Test
    void testCalculateSavingsGoalProgress_whenSpendingCategoriesIsEmpty_ThenReturnZero(){
        Set<TransactionCategoryEntity> categories = new HashSet<>();
        BigDecimal actual = budgetCalculator.calculateSavingsGoalProgress(testBudget, categories);
        assertNotNull(actual);
        assertEquals(0, actual.intValue());
    }

//    @Test
//    void testCalculateSavingsGoalProgress_thenReturnProgress(){
//        Set<TransactionCategoryEntity> categories = new HashSet<>();
//        categories.add(userBudgetCategory);
//        categories.add(userBudgetCategory2);
//        categories.add(userBudgetCategory3);
//
//        Budget budget = new Budget();
//        budget.setBudgetAmount(new BigDecimal("3070"));
//        budget.setActual(new BigDecimal("1443"));
//        budget.setId(1L);
//
//        Mockito.lenient().when(budgetGoalsService.findByBudgetId(1L)).thenReturn(Optional.of(createBudgetGoals(2400, 200, 125, new BigDecimal("3070.00"), new BigDecimal(3260), LocalDate.of(2024, 10, 28), LocalDate.of(2025, 2, 25))));
//        BigDecimal expectedOverAllSavings = new BigDecimal("61.00");
//        BigDecimal actual = budgetCalculator.calculateSavingsGoalProgress(budget, categories);
//        assertEquals(expectedOverAllSavings, actual);
//    }

    @Test
    void testCalculateTotalBudgetHealth_whenBudgetAmountIsNull_thenReturnZero(){
        BigDecimal actual = budgetCalculator.calculateTotalBudgetHealth(null, new BigDecimal("500"), new BigDecimal("67"));
        assertNotNull(actual);
        assertEquals(0, actual.intValue());
    }

    @Test
    void testCalculateTotalBudgetHealth_whenBudgetActualIsNull_thenReturnZero(){
        BigDecimal actual = budgetCalculator.calculateTotalBudgetHealth(new BigDecimal("3070"), null, new BigDecimal("67"));
        assertNotNull(actual);
        assertEquals(0, actual.intValue());
    }

    @Test
    void testCalculateTotalBudgetHealth_whenBudgetAmountIsNegative_ThrowException(){
        BigDecimal budgetAmount = new BigDecimal("-17.00");

        assertThrows(InvalidBudgetAmountException.class, () -> {

            budgetValidator.validateBudgetAmount(budgetAmount);
            budgetCalculator.calculateTotalBudgetHealth(budgetAmount, new BigDecimal("500"), new BigDecimal("67"));
        });
    }

    @Test
    void testCalculateTotalBudgetHealth_thenReturnBudgetHealth(){
        BigDecimal budgetAmount = new BigDecimal("3070");
        BigDecimal budgetActual = new BigDecimal("1607");
        BigDecimal budgetSavingsProgress = new BigDecimal("37.21");

        BigDecimal expectedBudgetHealthTotal = new BigDecimal("18.845");
        BigDecimal actualHealthTotal = budgetCalculator.calculateTotalBudgetHealth(budgetAmount, budgetActual, budgetSavingsProgress);
        assertEquals(expectedBudgetHealthTotal, actualHealthTotal);
    }

    @Test
    void testCalculateTotalBudgetHealth_whenBudgetAmountIsZero(){
        BigDecimal budgetAmount = BigDecimal.ZERO;
        BigDecimal budgetActual = new BigDecimal("1607");
        BigDecimal budgetSavingsProgress = new BigDecimal("37.21");

        BigDecimal expectedBudgetHealthTotal = new BigDecimal("18.605");
        BigDecimal actual = budgetCalculator.calculateTotalBudgetHealth(budgetAmount, budgetActual, budgetSavingsProgress);
        assertEquals(expectedBudgetHealthTotal, actual);
    }

    @Test
    void testCalculateAverageSpendingPerDayOnBudget_whenBudgetedAmountIsNull_thenReturnZero(){
        BigDecimal totalSpending = new BigDecimal("120");
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 10));

        BigDecimal actual = budgetCalculator.calculateAverageSpendingPerDayOnBudget(null, totalSpending, budgetPeriod);
        assertEquals(0, actual.intValue());
    }

    @Test
    void testCalculateAverageSpendingPerDayOnBudget_whenBudgetActualIsNull_thenReturnZero(){
        BigDecimal budgetedAmount = new BigDecimal("1530");
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 10));

        BigDecimal actual = budgetCalculator.calculateAverageSpendingPerDayOnBudget(budgetedAmount, null, budgetPeriod);
        assertEquals(0, actual.intValue());
    }

    @Test
    void testCalculateAverageSpendingPerDayOnBudget_whenBudgetPeriodIsNull_thenReturnZero(){
        BigDecimal budgetedAmount = new BigDecimal("1250");
        BigDecimal budgetActual = new BigDecimal("1020");
        BudgetPeriod budgetPeriod = null;
        BigDecimal actual = budgetCalculator.calculateAverageSpendingPerDayOnBudget(budgetedAmount, budgetActual, budgetPeriod);
        assertEquals(0, actual.intValue());
    }

    @Test
    void testCalculateAverageSpendingPerDayOnBudget_whenStartDateIsNull_thenThrowException(){
        BigDecimal budgetedAmount = new BigDecimal("1250");
        BigDecimal budgetActual = new BigDecimal("1020");
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, null, LocalDate.of(2024, 9,1));
        assertThrows(IllegalDateException.class, () -> {
            budgetCalculator.calculateAverageSpendingPerDayOnBudget(budgetedAmount, budgetActual, budgetPeriod);
        });
    }

    @Test
    void testCalculateAverageSpendingPerDayOnBudget_whenEndDateIsNull_thenThrowException(){
        BigDecimal budgetedAmount = new BigDecimal("1250");
        BigDecimal budgetActual = new BigDecimal("1020");
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 9, 1), null);
        assertThrows(IllegalDateException.class, () -> {
            budgetCalculator.calculateAverageSpendingPerDayOnBudget(budgetedAmount, budgetActual, budgetPeriod);
        });
    }

    @Test
    void testCalculateAverageSpendingPerDayOnBudget_whenValidParameters_thenReturnAverageSpendingPerDay(){
        BigDecimal budgetedAmount = new BigDecimal("3070");
        BigDecimal budgetActual = new BigDecimal("1607");
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 10));

        BigDecimal expectedSpendingPerDay = new BigDecimal("160.70");
        BigDecimal actualSpendingPerDay = budgetCalculator.calculateAverageSpendingPerDayOnBudget(budgetedAmount, budgetActual, budgetPeriod);
        assertEquals(expectedSpendingPerDay, actualSpendingPerDay);
    }

    @Test
    void testCalculateAverageSpendingPerDayOnBudget_whenDaysInPeriodIsZero_thenThrowArithmeticException() {
        // Arrange
        BigDecimal budgetedAmount = new BigDecimal("1000");
        BigDecimal budgetActual = new BigDecimal("500");

        // BudgetPeriod where startDate equals endDate resulting in zero days period
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 1));

        // Act & Assert
        assertThrows(ArithmeticException.class, () -> {
            budgetCalculator.calculateAverageSpendingPerDayOnBudget(budgetedAmount, budgetActual, budgetPeriod);
        });
    }

    @Test
    void testCalculateAverageSpendingPerDayOnBudget_whenDaysInPeriodIsNegative_thenThrowArithmeticException() {
        BigDecimal budgetedAmount = new BigDecimal("1000");
        BigDecimal budgetActual = new BigDecimal("500");
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 9, 10), LocalDate.of(2024, 9, 1));
        assertThrows(ArithmeticException.class, () -> {
            budgetCalculator.calculateAverageSpendingPerDayOnBudget(budgetedAmount, budgetActual, budgetPeriod);
        });
    }

    @Test
    void testCalculateTotalBudgetForSubBudget_whenCriteriaValid_thenReturnTotalBudget()
    {
        BigDecimal totalIncome = new BigDecimal("3260");
        Budget budget = new Budget();
        budget.setStartDate(LocalDate.of(2025,1 ,1));
        budget.setEndDate(LocalDate.of(2025,12, 31));
        budget.setBudgetPeriod(Period.MONTHLY);
        budget.setBudgetMode(BudgetMode.SAVINGS_PLAN);
        budget.setBudgetName("Savings Budget Plan");
        budget.setBudgetDescription("Savings Budget Plan");
        budget.setTotalMonthsToSave(12);
        budget.setUserId(1L);
        budget.setSavingsProgress(BigDecimal.ZERO);
        budget.setSavingsAmountAllocated(BigDecimal.ZERO);
        budget.setBudgetAmount(new BigDecimal("39120"));
        budget.setActual(new BigDecimal("1609"));

        double monthlyAllocation = 250;
        double targetSavingsAmount = 2500;
        int monthsToSave = 12;

        BigDecimal totalSubBudgetAmount = new BigDecimal("3010.00");
        BigDecimal actual = budgetCalculator.calculateTotalBudgetForSubBudget(budget, monthlyAllocation, monthsToSave);
        assertNotNull(actual);
        assertEquals(totalSubBudgetAmount, actual);
    }

    @Test
    void testCalculateSubBudgetSavingsTargetAmount_whenCriteriaValid_thenReturnSavingsTarget(){
        double targetAmount = 2500;
        int monthsToSave = 12;
        double currentSavings = 120;
        double monthlyAllocation = 200;
        BigDecimal expected = new BigDecimal("200.0");
        BigDecimal actual = budgetCalculator.calculateMonthlySubBudgetSavingsTargetAmount(targetAmount, monthsToSave, currentSavings, monthlyAllocation);
        assertEquals(expected, actual);
    }

    @Test
    void testCalculateSubBudgetSpending_whenSubBudgetDateRangeIsNull_thenReturnZero(){
        Long budgetId = 1L;
        BigDecimal actual = budgetCalculator.calculateSubBudgetSpending(null, budgetId);
        assertEquals(0, actual.intValue());
    }

    @Test
    void testCalculateSubBudgetSpending_whenCriteriaValid_thenReturnSubBudgetSpending(){

    }

//    @Test
//    void testCalculateBudgetedAmountForCategory_whenCategoryIsGroceriesAndDateRangeIsNovemberTest_thenReturnBudgetPeriodAmount(){
//        CategoryPeriodSpending grocerySpending = new CategoryPeriodSpending("Groceries", new BigDecimal("350.00"));
//        BigDecimal totalSpendingOnCategories = new BigDecimal("1789");
//
//        Budget budget = new Budget();
//        budget.setActual(new BigDecimal("1789"));
//        budget.setBudgetAmount(new BigDecimal("3260"));
////        budget.setStartDate(LocalDate.of(2024, 11, 1));
////        budget.setEndDate(LocalDate.of(2024, 11, 30));
//
//        List<DateRange> groceryDateRanges = List.of(
//                new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)),
//                new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 15)),
//                new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 22)),
//                new DateRange(LocalDate.of(2024, 11, 22), LocalDate.of(2024, 11, 30))
//        );
//
//        List<BudgetPeriodAmount> expectedBudgetPeriodAmounts = List.of(
//                new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)), 78.24),
//                new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 15)), 78.24),
//                new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 22)), 78.24),
//                new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 22), LocalDate.of(2024, 11, 30)), 91.28)
//        );
//
//        List<BudgetPeriodAmount> actual = budgetCalculator.calculateBudgetedAmountForCategoryDateRange(grocerySpending, totalSpendingOnCategories, groceryDateRanges, budget);
//        assertEquals(expectedBudgetPeriodAmounts.size(), actual.size());
//        for(int i = 0; i < expectedBudgetPeriodAmounts.size(); i++){
//            BudgetPeriodAmount expected = expectedBudgetPeriodAmounts.get(i);
//            BudgetPeriodAmount actualAmount = actual.get(i);
//
//            assertEquals(expected.getDateRange(), actualAmount.getDateRange(),
//                    String.format("Week %d date range mismatch", i + 1));
//            assertEquals(expected.getAmount(), actualAmount.getAmount(),
//                    String.format("Week %d amount mismatch. Expected %.2f, got %.2f",
//                            i + 1, expected.getAmount(), actualAmount.getAmount()));
//        }
//    }

//    @Test
//    void testCalculateActualAmountForCategoryDateRange_whenCategoryIsGroceriesAndDateRangeIsNovemberTest_thenReturnBudgetPeriodAmount(){
//        CategoryPeriodSpending grocerySpending = new CategoryPeriodSpending("Groceries", new BigDecimal("396.45"), new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 30)));
//
//        Budget budget = new Budget();
//        budget.setActual(new BigDecimal("1789"));
//        budget.setBudgetAmount(new BigDecimal("3260"));
//        budget.setStartDate(LocalDate.of(2024, 11, 1));
//        budget.setEndDate(LocalDate.of(2024, 11, 30));
//
//        List<DateRange> groceryDateRanges = List.of(
//                new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)),
//                new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 15)),
//                new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 22)),
//                new DateRange(LocalDate.of(2024, 11, 22), LocalDate.of(2024, 11, 30))
//        );
//
//        List<Transaction> transactions = List.of(
//                new Transaction(null, new BigDecimal("50.00"), null, List.of("Groceries"), "Groceries",
//                        LocalDate.of(2024, 11, 5), null, null, null, false, "t1", null, null, null),
//                new Transaction(null, new BigDecimal("46.45"), null, List.of("Groceries"), "Groceries",
//                        LocalDate.of(2024, 11, 6), null, null, null, false, "t2", null, null, null),
//                new Transaction(null, new BigDecimal("62.00"), null, List.of("Groceries"), "Groceries",
//                        LocalDate.of(2024, 11, 9), null, null, null, false, "t3", null, null, null),
//                new Transaction(null, new BigDecimal("50.00"), null, List.of("Groceries"), "Groceries",
//                        LocalDate.of(2024, 11, 12), null, null, null, false, "t4", null, null, null),
//                new Transaction(null, new BigDecimal("87.05"), null, List.of("Groceries"), "Groceries",
//                        LocalDate.of(2024, 11, 16), null, null, null, false, "t5", null, null, null),
//                new Transaction(null, new BigDecimal("101.23"), null, List.of("Groceries"), "Groceries",
//                        LocalDate.of(2024, 11, 25), null, null, null, false, "t6", null, null, null),
//                new Transaction(null, new BigDecimal("30.00"), null, List.of("Utilities"), "Utilities",
//                        LocalDate.of(2024, 11, 15), null, null, null, false, "t7", null, null, null)
//        );
//
//        CategoryTransactions categoryTransactions = new CategoryTransactions("Groceries", "Groceries");
//        categoryTransactions.setTransactions(transactions);
//
//        List<BudgetPeriodAmount> expectedBudgetPeriodAmounts = List.of(
//                new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)), 96.45),
//                new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 15)), 112.00),
//                new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 22)), 87.05),
//                new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 22), LocalDate.of(2024, 11, 30)), 101.23)
//        );
//
//        List<BudgetPeriodAmount> actual = budgetCalculator.calculateActualAmountForCategoryDateRange(
//                grocerySpending, categoryTransactions, groceryDateRanges, budget);
//        assertEquals(expectedBudgetPeriodAmounts.size(), actual.size());
//        for(int i = 0; i < expectedBudgetPeriodAmounts.size(); i++){
//            BudgetPeriodAmount expected = expectedBudgetPeriodAmounts.get(i);
//            BudgetPeriodAmount actualAmount = actual.get(i);
//
//            assertEquals(expected.getDateRange(), actualAmount.getDateRange(),
//                    String.format("Week %d date range mismatch", i + 1));
//            assertEquals(expected.getAmount(), actualAmount.getAmount(),
//                    String.format("Week %d amount mismatch. Expected %.2f, got %.2f",
//                            i + 1, expected.getAmount(), actualAmount.getAmount()));
//        }
//    }

//    @Test
//    void testCalculateTotalSpentOnBudgetForPeriod_whenBudgetIdInvalid_thenThrowIllegalArgumentException() {
//        final Long budgetId = -1L;
//        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 10));
//        assertThrows(IllegalArgumentException.class, () -> {
//            budgetCalculator.calculateTotalSpentOnBudgetForPeriod(budgetId, budgetPeriod);
//        });
//    }
//
//    @Test
//    void testCalculateTotalSpentOnBudgetForPeriod_whenBudgetPeriodIsNull_thenReturnZero(){
//        final Long budgetId = 1L;
//        BudgetPeriod budgetPeriod = null;
//        BigDecimal actual = budgetCalculator.calculateTotalSpentOnBudgetForPeriod(budgetId, budgetPeriod);
//        assertEquals(0, actual.intValue());
//    }
//
//    @Test
//    void testCalculateTotalSpentOnBudgetForPeriod_whenStartDateIsNull_thenThrowDateException(){
//        final Long budgetId = 1L;
//        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, null, LocalDate.of(2024, 9, 10));
//        assertThrows(IllegalDateException.class, () -> {
//            budgetCalculator.calculateTotalSpentOnBudgetForPeriod(budgetId, budgetPeriod);
//        });
//    }
//
//    @Test
//    void testCalculateTotalSpentOnBudgetForPeriod_whenEndDateIsNull_thenThrowDateException(){
//        final Long budgetId = 1L;
//        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 9, 1), null);
//        assertThrows(IllegalDateException.class, () -> {
//            budgetCalculator.calculateTotalSpentOnBudgetForPeriod(budgetId, budgetPeriod);
//        });
//    }
//
//    @Test
//    void testCalculateTotalSpentOnBudgetForPeriod_whenBothDatesAreNull_thenThrowDateException(){
//        final Long budgetId = 1L;
//        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, null, null);
//        assertThrows(IllegalDateException.class, () -> {
//            budgetCalculator.calculateTotalSpentOnBudgetForPeriod(budgetId, budgetPeriod);
//        });
//    }

    @Test
    void testCalculateTotalSpentOnBudgetForPeriod_whenParametersValid_thenReturnTotalSpent(){
        final Long budgetId = 1L;
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 10));

    }


//    @Test
//    void testCalculateTotalBudgetForPeriod_whenBudgetPeriodIsNull_thenReturnZero(){
//        Long budgetId = 1L;
//        BigDecimal actual = budgetCalculator.calculateTotalBudgetForPeriod(null, budgetId);
//        assertEquals(0, actual.intValue());
//    }
//
//    @Test
//    void testCalculateTotalBudgetForPeriod_whenUserIdIsInvalid_thenThrowIllegalArgumentException(){
//        Long budgetId = -1L;
//        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 10));
//        assertThrows(IllegalArgumentException.class, () -> {
//            budgetCalculator.calculateTotalBudgetForPeriod(budgetPeriod, budgetId);
//        });
//    }
//
//    @Test
//    void testCalculateTotalBudgetForPeriod_whenStartDateIsNull_thenThrowDateException(){
//        Long budgetId = 1L;
//        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, null, LocalDate.of(2024, 9, 10));
//        assertThrows(IllegalDateException.class, () -> {
//            budgetCalculator.calculateTotalBudgetForPeriod(budgetPeriod, budgetId);
//        });
//    }
//
//    @Test
//    void testCalculateTotalBudgetForPeriod_whenEndDateIsNull_thenThrowDateException(){
//        Long budgetId = 1L;
//        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 9, 1), null);
//        assertThrows(IllegalDateException.class, () -> {
//            budgetCalculator.calculateTotalBudgetForPeriod(budgetPeriod, budgetId);
//        });
//    }
//
//    @Test
//    void testCalculateTotalBudgetForPeriod_whenStartDateAndEndDateSwapped_thenThrowException(){
//        Long budgetId = 1L;
//        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 9, 10), LocalDate.of(2024, 9, 1));
//        assertThrows(RuntimeException.class, () -> {
//            budgetCalculator.calculateTotalBudgetForPeriod(budgetPeriod, budgetId);
//        });
//    }
//
//    @Test
//    void testCalculateTotalBudgetForPeriod_whenNoFixedExpenses_thenReturnBudget(){
//        Long budgetId = 1L;
//        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8));
//
//        BigDecimal expectedBudget = new BigDecimal("760.69");
//        Mockito.when(budgetService.findById(budgetId)).thenReturn(Optional.of(createBudgetEntity(new BigDecimal("3260"), new BigDecimal("3260"), LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 30))));
//        Mockito.when(recurringTransactionService.getTotalRecurringExpensesForPeriod(
//                        Mockito.anyLong(),
//                        Mockito.any(LocalDate.class),
//                        Mockito.any(LocalDate.class)))
//                .thenReturn(BigDecimal.ZERO);
//        Mockito.lenient().when(transactionCategoryService.getTransactionCategoriesByBudgetIdAndDateRange(1L, budgetPeriod.startDate(), budgetPeriod.endDate())).thenReturn(List.of(createUserBudgetCategory("Groceries", "Groceries", LocalDate.of(2024, 9, 1), LocalDate.of(2024,9 ,8), 320.00, 0.0)));
//
//        BigDecimal actual = budgetCalculator.calculateTotalBudgetForPeriod(budgetPeriod, budgetId);
//        assertEquals(expectedBudget, actual);
//    }
//
//    @Test
//    void testCalculateTotalBudgetForPeriod_whenFixedExpenses_thenReturnTotalBudget(){
//        Long budgetId = 1L;
//        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8));
//
//        BigDecimal expectedBudget = new BigDecimal("2144.69");
//        Mockito.when(transactionCategoryService.getTransactionCategoriesByBudgetIdAndDateRange(1L, budgetPeriod.startDate(), budgetPeriod.endDate())).thenReturn(List.of(createUserBudgetCategory("Groceries", "Groceries", LocalDate.of(2024, 9, 1), LocalDate.of(2024,9 ,8), 320.00, 0.0)));
//        Mockito.when(budgetService.findById(budgetId)).thenReturn(Optional.of(createBudgetEntity(new BigDecimal("3260"), new BigDecimal("3260"), LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 30))));
//        Mockito.when(recurringTransactionService.getTotalRecurringExpensesForPeriod(1L, budgetPeriod.startDate(), budgetPeriod.endDate())).thenReturn(new BigDecimal("1384"));
//        BigDecimal actual = budgetCalculator.calculateTotalBudgetForPeriod(budgetPeriod, budgetId);
//        assertEquals(expectedBudget, actual);
//    }
//
//    @Test
//    void testCalculateTotalBudgetForPeriod_whenFixedExpensesAndSpentOnBudgetEqualTo340_thenReturnTotalBudget(){
//        Long budgetId = 1L;
//        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8));
//
//        BigDecimal expectedTotalBudget = new BigDecimal("2065.31");
//        Mockito.when(transactionCategoryService.getTransactionCategoriesByBudgetIdAndDateRange(1L, budgetPeriod.startDate(), budgetPeriod.endDate())).thenReturn(List.of(createUserBudgetCategory("Groceries", "Groceries", LocalDate.of(2024, 9, 1), LocalDate.of(2024,9 ,8), 340.00, 340.00)));
//        Mockito.when(budgetService.findById(budgetId)).thenReturn(Optional.of(createBudgetEntity(new BigDecimal("3260"), new BigDecimal("3260"), LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 30))));
//        Mockito.when(recurringTransactionService.getTotalRecurringExpensesForPeriod(1L, budgetPeriod.startDate(), budgetPeriod.endDate())).thenReturn(new BigDecimal("1384"));
//        BigDecimal actual = budgetCalculator.calculateTotalBudgetForPeriod(budgetPeriod, budgetId);
//        assertEquals(expectedTotalBudget, actual);
//    }
//
//    @Test
//    void testCalculateTotalBudgetForPeriod_whenFixedExpensesAndSpentOnBudgetIsNegative_thenThrowArithmeticException(){
//        Long budgetId = 1L;
//        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 7));
//        Mockito.when(transactionCategoryService.getTransactionCategoriesByBudgetIdAndDateRange(1L, budgetPeriod.startDate(), budgetPeriod.endDate())).thenReturn(List.of(createUserBudgetCategory("Groceries", "Groceries", LocalDate.of(2024, 9, 1), LocalDate.of(2024,9 ,7), 340.00, -340.00)));
//        Mockito.when(budgetService.findById(budgetId)).thenReturn(Optional.of(createBudgetEntity(new BigDecimal("3260"), new BigDecimal("3260"), LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 30))));
//        Mockito.when(recurringTransactionService.getTotalRecurringExpensesForPeriod(1L, budgetPeriod.startDate(), budgetPeriod.endDate())).thenReturn(new BigDecimal("1384"));
//        assertThrows(ArithmeticException.class, () -> {
//            budgetCalculator.calculateTotalBudgetForPeriod(budgetPeriod, budgetId);
//        });
//    }
//
//    @Test
//    void testCalculateTotalBudgetForPeriod_whenFixedExpensesAndTotalSpentOnBudgetEqualTo1734_thenReturnTotalBudget(){
//        Long budgetId = 1L;
//        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 9, 7), LocalDate.of(2024, 9, 15));
//        BigDecimal expectedTotalBudget = new BigDecimal("618.64");
//        Mockito.when(transactionCategoryService.getTransactionCategoriesByBudgetIdAndDateRange(1L, budgetPeriod.startDate(), budgetPeriod.endDate())).thenReturn(List.of(createUserBudgetCategory("Groceries", "Groceries", LocalDate.of(2024, 9, 1), LocalDate.of(2024,9 ,7), 340.00, 340.00),
//                createUserBudgetCategory("Rent", "Rent", LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 1), 1200.0, 1200.0),
//                createUserBudgetCategory("Bills", "Bills", LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 5), 200.00, 194.00)));
//        Mockito.when(budgetService.findById(budgetId)).thenReturn(Optional.of(createBudgetEntity(new BigDecimal("3260"), new BigDecimal("3260"), LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 30))));
//        Mockito.when(recurringTransactionService.getTotalRecurringExpensesForPeriod(1L, budgetPeriod.startDate(), budgetPeriod.endDate())).thenReturn(new BigDecimal("110"));
//        BigDecimal actual = budgetCalculator.calculateTotalBudgetForPeriod(budgetPeriod, budgetId);
//        assertEquals(expectedTotalBudget, actual);
//    }

//    private static Stream<Arguments> provideBudgetPeriodsAndBudgets() {
//        // Create different BudgetPeriod instances
//        BudgetPeriod monthlyPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 31));
//        BudgetPeriod weeklyPeriod = new BudgetPeriod(Period.WEEKLY, LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 7));
//        BudgetPeriod dailyPeriod = new BudgetPeriod(Period.DAILY, LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 1));
//        BudgetPeriod biWeeklyPeriod = new BudgetPeriod(Period.BIWEEKLY, LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 14));
//
//        // Create Budget instances
//        Budget budget1 = new Budget();
//        budget1.setId(1L);
//        budget1.setUserId(1L);
//        budget1.setBudgetAmount(new BigDecimal("5000.0"));
//        budget1.setActual(new BigDecimal("4000.0"));
//
//        Budget budget2 = new Budget();
//        budget2.setId(2L);
//        budget2.setUserId(1L);
//        budget2.setBudgetAmount(new BigDecimal("10000.0"));
//        budget2.setActual(new BigDecimal("8000.0"));
//
//        // Create UserBudgetCategoryEntity lists for different periods
//        List<TransactionCategoryEntity> userBudgetCategoriesMonthly = List.of(
//                createUserBudgetCategory("Groceries", "Groceries", LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 31), 300.00, 250.00),
//                createUserBudgetCategory("Gas", "Gas", LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 31), 100.00, 80.00)
//        );
//
//        List<TransactionCategoryEntity> userBudgetCategoriesYearly = List.of(
//                createUserBudgetCategory("Rent", "Rent", LocalDate.of(2024, 1, 1), LocalDate.of(2024, 12, 31), 12000.00, 11500.00),
//                createUserBudgetCategory("Utilities", "Utilities", LocalDate.of(2024, 1, 1), LocalDate.of(2024, 12, 31), 1500.00, 1400.00)
//        );
//
//        List<TransactionCategoryEntity> userBudgetCategoriesWeekly = List.of(
//                createUserBudgetCategory("Groceries", "Groceries", LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 7), 200.00, 150.00),
//                createUserBudgetCategory("Transport", "Transport", LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 7), 50.00, 40.00)
//        );
//
//        List<TransactionCategoryEntity> userBudgetCategoriesDaily = List.of(
//                createUserBudgetCategory("Lunch", "Lunch", LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 1), 15.00, 10.00)
//        );
//
//        List<TransactionCategoryEntity> userBudgetCategoriesBiWeekly = List.of(
//                createUserBudgetCategory("Rent", "Rent", LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 14), 600.00, 500.00),
//                createUserBudgetCategory("Groceries", "Groceries", LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 14), 200.00, 170.00)
//        );
//
//        // Create a stream of arguments to supply data to the parameterized test
//        return Stream.of(
//                Arguments.of(monthlyPeriod, budget1, userBudgetCategoriesMonthly, new BigDecimal("70.00")),
//                Arguments.of(weeklyPeriod, budget1, userBudgetCategoriesWeekly, new BigDecimal("60.00")),
//                Arguments.of(dailyPeriod, budget1, userBudgetCategoriesDaily, new BigDecimal("5.00")),
//                Arguments.of(biWeeklyPeriod, budget1, userBudgetCategoriesBiWeekly, new BigDecimal("130.00"))
//        );
//    }

//    private BudgetGoalsEntity createBudgetGoals(double targetAmount, double monthlyAllocation, double currentSavings, BigDecimal budgetAmount, BigDecimal income, LocalDate startDate, LocalDate endDate)
//    {
//        BudgetGoalsEntity budgetGoals = new BudgetGoalsEntity();
//        budgetGoals.setBudget(createBudgetEntity(budgetAmount, income, startDate, endDate));
//        budgetGoals.setCurrentSavings(currentSavings);
//        budgetGoals.setGoalName("Goal Test");
//        budgetGoals.setGoalDescription("Goal Description");
//        budgetGoals.setMonthlyAllocation(monthlyAllocation);
//        budgetGoals.setSavingsFrequency("MONTHLY");
//        budgetGoals.setTargetAmount(targetAmount);
//        return budgetGoals;
//    }

//    private static BudgetEntity createBudgetEntity(BigDecimal budgetAmount, BigDecimal monthlyIncome, LocalDate startDate, LocalDate endDate)
//    {
//        BudgetEntity budgetEntity = new BudgetEntity();
//        budgetEntity.setId(1L);
//        budgetEntity.setBudgetAmount(budgetAmount);
//        budgetEntity.setBudgetName("Test Budget");
//        budgetEntity.setBudgetDescription("Test Budget Description");
//        budgetEntity.setMonthlyIncome(monthlyIncome);
//        budgetEntity.setUser(createUser());
//        budgetEntity.setStartDate(startDate);
//        budgetEntity.setEndDate(endDate);
//        return budgetEntity;
//    }


    private static CategoryEntity createCategory(String name, String description){
        CategoryEntity category = new CategoryEntity();
        category.setDescription(description);
        category.setName(name);
        category.setActive(true);
        return category;
    }

    private CategoryPeriodSpending createCategorySpending(String category, BigDecimal spending)
    {
        CategoryPeriodSpending categorySpending = new CategoryPeriodSpending();
        categorySpending.setActualSpending(spending);
        categorySpending.setCategoryName(category);
        return categorySpending;
    }

    private static UserEntity createUser(){
        UserEntity user = new UserEntity();
        user.setId(1L);
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setEmail("john@doe.com");
        return user;
    }

//    private static TransactionCategoryEntity createUserBudgetCategory(String categoryName, String categoryDescription, LocalDate startDate, LocalDate endDate, Double budgetAmount, Double actual){
//        TransactionCategoryEntity userBudgetCategory = new TransactionCategoryEntity();
//        userBudgetCategory.setCategory(createCategory(categoryName, categoryDescription));
//        userBudgetCategory.setBudgetedAmount(budgetAmount);
//        userBudgetCategory.setBudget(createBudgetEntity(new BigDecimal("3260"), new BigDecimal("3260"), LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 30)));
//        userBudgetCategory.setActual(actual);
//        userBudgetCategory.setIsactive(true);
//        userBudgetCategory.setStartDate(startDate);
//        userBudgetCategory.setEndDate(endDate);
//        return userBudgetCategory;
//    }




    @AfterEach
    void tearDown() {
    }
}