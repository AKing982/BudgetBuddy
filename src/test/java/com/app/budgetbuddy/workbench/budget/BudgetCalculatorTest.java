package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.UserBudgetCategoryEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.services.BudgetService;
import com.app.budgetbuddy.services.UserBudgetCategoryService;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.TreeMap;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class BudgetCalculatorTest {

    @InjectMocks
    private BudgetCalculator budgetCalculator;

    @Mock
    private BudgetService budgetService;

    @Mock
    private BudgetGoalsService budgetGoalsService;

    @Mock
    private UserBudgetCategoryService  userBudgetCategoryService;

    private Category testCategory;

    private Category testCategory2;

    private Category testCategory3;

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



        testBudget = new Budget();
        testBudget.setActual(new BigDecimal("400.00"));
        testBudget.setBudgetName("Test Budget");
        testBudget.setBudgetDescription("Test Budget Description");
        testBudget.setBudgetAmount(new BigDecimal("500.00"));
        testBudget.setLeftOver(new BigDecimal("100.00"));
        testBudget.setUserId(1L);
        testBudget.setId(1L);

        testBudgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 30));
    }

    @Test
    void testGetTotalSavedInCategories_whenCategoriesListIsEmpty_thenReturnZero(){
        List<Category> categories = new ArrayList<>();

        BigDecimal actual = budgetCalculator.getTotalSavedInCategories(categories);
        assertEquals(0, actual.intValue());
    }

    @Test
    void testGetTotalSavedInCategories_whenCategoryListHasTwoItems_thenReturnSaved(){
        List<Category> categories = new ArrayList<>();
        categories.add(testCategory);
        categories.add(testCategory2);

        BigDecimal expectedAmount = new BigDecimal("243");

        BigDecimal actual = budgetCalculator.getTotalSavedInCategories(categories);
        assertNotNull(actual);
        assertEquals(expectedAmount, actual);
    }

    @Test
    void testGetTotalSavedInCategories_whenCategoryItemIsNull_thenReturnZero(){
        List<Category> categories = new ArrayList<>();
        categories.add(testCategory);
        categories.add(null);

        BigDecimal expected = new BigDecimal("160");
        BigDecimal actual = budgetCalculator.getTotalSavedInCategories(categories);
        assertEquals(expected.intValue(), actual.intValue());
    }

    @Test
    void testGetTotalSavedInCategories_whenCategorySpendingIsNull_thenSkipAndReturnSaved(){
        List<Category> categories = new ArrayList<>();
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

    @Test
    void testGetTotalSavedInUserBudgetCategoriesByPeriod_whenBudgetPeriodIsNull_thenThrowException(){
        assertThrows(RuntimeException.class, () -> {
            budgetCalculator.getTotalSavedInUserBudgetCategoriesByPeriod(null, testBudget);
        });
    }

    @Test
    void testGetTotalSavedInUserBudgetCategoriesByPeriod_whenBudgetIsNull_thenThrowException()
    {
        assertThrows(RuntimeException.class, () -> {
            budgetCalculator.getTotalSavedInUserBudgetCategoriesByPeriod(testBudgetPeriod, null);
        });
    }

    @Test
    void testGetTotalSavedInUserBudgetCategoriesByPeriod_whenUserBudgetCategoryListIsEmpty_thenReturnZero(){
        List<UserBudgetCategoryEntity> userBudgetCategories = new ArrayList<>();

        LocalDate startDate = testBudgetPeriod.startDate();
        LocalDate endDate = testBudgetPeriod.endDate();
        Long userId = testBudget.getUserId();

        Mockito.when(userBudgetCategoryService.getUserBudgetCategoriesByUserAndDateRange(userId, startDate, endDate)).thenReturn(userBudgetCategories);

        BigDecimal actual = budgetCalculator.getTotalSavedInUserBudgetCategoriesByPeriod(testBudgetPeriod, testBudget);
        assertEquals(0, actual.intValue());
    }

    @Test
    void testGetTotalSavedInUserBudgetCategoriesByPeriod_ThenReturnTotalSaved(){

        UserBudgetCategoryEntity groceryCategory = createUserBudgetCategory("Groceries", "Groceries",LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 7), 410.00, 210.00);
        UserBudgetCategoryEntity gasCategory = createUserBudgetCategory("Gas", "Gas", LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 7), 78.00, 35.00);
        List<UserBudgetCategoryEntity> userBudgetCategories = new ArrayList<>();
        userBudgetCategories.add(groceryCategory);
        userBudgetCategories.add(gasCategory);

        LocalDate startDate = testBudgetPeriod.startDate();
        LocalDate endDate = testBudgetPeriod.endDate();
        Long userId = testBudget.getUserId();
        Mockito.when(userBudgetCategoryService.getUserBudgetCategoriesByUserAndDateRange(userId, startDate, endDate)).thenReturn(userBudgetCategories);

        BigDecimal expectedSavings = new BigDecimal("243");
        BigDecimal actualSavings = budgetCalculator.getTotalSavedInUserBudgetCategoriesByPeriod(testBudgetPeriod, testBudget);
        assertEquals(expectedSavings.intValue(), actualSavings.intValue());
    }

    @ParameterizedTest
    @MethodSource("provideBudgetPeriodsAndBudgets")
    void testGetTotalSavedInUserBudgetCategoriesByPeriodParam(BudgetPeriod budgetPeriod, Budget budget, List<UserBudgetCategoryEntity> userBudgetCategories, BigDecimal expectedSavings) {
        // Mock the behavior of the service method to return the supplied list of UserBudgetCategoryEntity
        Mockito.when(userBudgetCategoryService.getUserBudgetCategoriesByUserAndDateRange(
                        budget.getUserId(), budgetPeriod.startDate(), budgetPeriod.endDate()))
                .thenReturn(userBudgetCategories);

        // Call the method under test
        BigDecimal actualSavings = budgetCalculator.getTotalSavedInUserBudgetCategoriesByPeriod(budgetPeriod, budget);

        // Assert the result
        assertEquals(expectedSavings, actualSavings);
    }

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

    @Test
    void testCreateCategoryBudgetAmountMapForPeriod_whenBudgetIsNull_thenReturnEmptyTreeMap(){
        TreeMap<DateRange, List<UserBudgetCategoryEntity>> userBudgetCategoryMap = new TreeMap<>();

        TreeMap<DateRange, List<UserBudgetCategoryEntity>> actual = budgetCalculator.createCategoryBudgetAmountMapForPeriod(null, testBudgetPeriod);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateCategoryBudgetAmountMapForPeriod_whenBudgetPeriodIsNull_thenReturnEmptyTreeMap(){
        TreeMap<DateRange, List<UserBudgetCategoryEntity>> userBudgetCategoryMap = budgetCalculator.createCategoryBudgetAmountMapForPeriod(testBudget, null);
        assertNotNull(userBudgetCategoryMap);
        assertTrue(userBudgetCategoryMap.isEmpty());
    }

    @Test
    void testCreateCategoryBudgetAmountMapForPeriod_returnTreeMap(){
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 15));
        TreeMap<DateRange, List<UserBudgetCategoryEntity>> userBudgetCategoryMap = new TreeMap<>();
        DateRange dateRange = new DateRange(LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 15));
        List<UserBudgetCategoryEntity> expectedUserBudgets = new ArrayList<>();
        expectedUserBudgets.add(createUserBudgetCategory("Groceries", "Groceries", LocalDate.of(2024,10, 1), LocalDate.of(2024, 10, 7), 125.00, 100.00));
        expectedUserBudgets.add(createUserBudgetCategory("Gas", "Gas", LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 7), 67.00, 35.00));
        userBudgetCategoryMap.put(dateRange, expectedUserBudgets);

        Mockito.when(userBudgetCategoryService.getUserBudgetCategoriesByUserAndDateRange(1L, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 15))).thenReturn(expectedUserBudgets);
        TreeMap<DateRange, List<UserBudgetCategoryEntity>> userBudgets = budgetCalculator.createCategoryBudgetAmountMapForPeriod(testBudget, budgetPeriod);
        assertEquals(userBudgetCategoryMap.size(), userBudgets.size());
        assertEquals(userBudgetCategoryMap.get(dateRange).size(), userBudgets.get(dateRange).size());
        for(int i = 0; i < expectedUserBudgets.size(); i++){
            assertEquals(expectedUserBudgets.get(i), userBudgets.get(dateRange).get(i));
        }
        assertEquals(userBudgetCategoryMap, userBudgets);
    }

    @Test
    void testCreateCategoryBudgetAmountForPeriod_whenServiceReturnsEmptyArray_thenReturnEmptyTreeMap(){
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 15));
        DateRange dateRange = new DateRange(LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 15));

        Mockito.when(userBudgetCategoryService.getUserBudgetCategoriesByUserAndDateRange(1L, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 15)))
                .thenReturn(new ArrayList<>());

        TreeMap<DateRange, List<UserBudgetCategoryEntity>> userBudgets = budgetCalculator.createCategoryBudgetAmountMapForPeriod(testBudget, budgetPeriod);

        assertNotNull(userBudgets);
        assertEquals(1, userBudgets.size());
        assertTrue(userBudgets.containsKey(dateRange));
        assertTrue(userBudgets.get(dateRange).isEmpty());
    }

    @Test
    void testCreateCategoryBudgetAmountForPeriod_whenNoUserBudgetCategories_thenReturnEmptyTreeMap(){

    }

    @Test
    void testCreateCategoryBudgetAmountForPeriod_whenSingleDayRange_thenThrowException(){

    }

    private static Stream<Arguments> provideBudgetPeriodsAndBudgets() {
        // Create different BudgetPeriod instances
        BudgetPeriod monthlyPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 31));
        BudgetPeriod yearlyPeriod = new BudgetPeriod(Period.YEARLY, LocalDate.of(2024, 1, 1), LocalDate.of(2024, 12, 31));
        BudgetPeriod weeklyPeriod = new BudgetPeriod(Period.WEEKLY, LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 7));
        BudgetPeriod dailyPeriod = new BudgetPeriod(Period.DAILY, LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 1));
        BudgetPeriod biWeeklyPeriod = new BudgetPeriod(Period.BIWEEKLY, LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 14));

        // Create Budget instances
        Budget budget1 = new Budget();
        budget1.setId(1L);
        budget1.setUserId(1L);
        budget1.setBudgetAmount(new BigDecimal("5000.0"));
        budget1.setActual(new BigDecimal("4000.0"));
        budget1.setLeftOver(new BigDecimal("1000.0"));

        Budget budget2 = new Budget();
        budget2.setId(2L);
        budget2.setUserId(1L);
        budget2.setBudgetAmount(new BigDecimal("10000.0"));
        budget2.setActual(new BigDecimal("8000.0"));
        budget2.setLeftOver(new BigDecimal("2000.0"));

        // Create UserBudgetCategoryEntity lists for different periods
        List<UserBudgetCategoryEntity> userBudgetCategoriesMonthly = List.of(
                createUserBudgetCategory("Groceries", "Groceries", LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 31), 300.00, 250.00),
                createUserBudgetCategory("Gas", "Gas", LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 31), 100.00, 80.00)
        );

        List<UserBudgetCategoryEntity> userBudgetCategoriesYearly = List.of(
                createUserBudgetCategory("Rent", "Rent", LocalDate.of(2024, 1, 1), LocalDate.of(2024, 12, 31), 12000.00, 11500.00),
                createUserBudgetCategory("Utilities", "Utilities", LocalDate.of(2024, 1, 1), LocalDate.of(2024, 12, 31), 1500.00, 1400.00)
        );

        List<UserBudgetCategoryEntity> userBudgetCategoriesWeekly = List.of(
                createUserBudgetCategory("Groceries", "Groceries", LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 7), 200.00, 150.00),
                createUserBudgetCategory("Transport", "Transport", LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 7), 50.00, 40.00)
        );

        List<UserBudgetCategoryEntity> userBudgetCategoriesDaily = List.of(
                createUserBudgetCategory("Lunch", "Lunch", LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 1), 15.00, 10.00)
        );

        List<UserBudgetCategoryEntity> userBudgetCategoriesBiWeekly = List.of(
                createUserBudgetCategory("Rent", "Rent", LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 14), 600.00, 500.00),
                createUserBudgetCategory("Groceries", "Groceries", LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 14), 200.00, 170.00)
        );

        // Create a stream of arguments to supply data to the parameterized test
        return Stream.of(
                Arguments.of(monthlyPeriod, budget1, userBudgetCategoriesMonthly, new BigDecimal("70.00")),
                Arguments.of(yearlyPeriod, budget2, userBudgetCategoriesYearly, new BigDecimal("600.00")),
                Arguments.of(weeklyPeriod, budget1, userBudgetCategoriesWeekly, new BigDecimal("60.00")),
                Arguments.of(dailyPeriod, budget1, userBudgetCategoriesDaily, new BigDecimal("5.00")),
                Arguments.of(biWeeklyPeriod, budget1, userBudgetCategoriesBiWeekly, new BigDecimal("130.00"))
        );
    }

    private static CategoryEntity createCategory(String name, String description){
        CategoryEntity category = new CategoryEntity();
        category.setDescription(description);
        category.setName(name);
        category.setActive(true);
        return category;
    }

    private static UserEntity createUser(){
        UserEntity user = new UserEntity();
        user.setId(1L);
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setEmail("john@doe.com");
        return user;
    }

    private static UserBudgetCategoryEntity createUserBudgetCategory(String categoryName, String categoryDescription, LocalDate startDate, LocalDate endDate, Double budgetAmount, Double actual){
        UserBudgetCategoryEntity userBudgetCategory = new UserBudgetCategoryEntity();
        userBudgetCategory.setCategory(createCategory(categoryName, categoryDescription));
        userBudgetCategory.setUser(createUser());
        userBudgetCategory.setBudgetedAmount(budgetAmount);
        userBudgetCategory.setActual(actual);
        userBudgetCategory.setIsactive(true);
        userBudgetCategory.setStartDate(startDate);
        userBudgetCategory.setEndDate(endDate);
        return userBudgetCategory;
    }




    @AfterEach
    void tearDown() {
    }
}