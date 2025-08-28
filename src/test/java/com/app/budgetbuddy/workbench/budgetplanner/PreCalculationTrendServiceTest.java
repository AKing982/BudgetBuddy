package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.SubBudgetGoalsService;
import com.app.budgetbuddy.services.SubBudgetService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.testcontainers.containers.wait.strategy.Wait;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class PreCalculationTrendServiceTest
{
    private List<PreCalculationEntry> testPrecalculationEntries;

    private Map<Integer, Map<EntryType, BigDecimal>> monthlyEntryAmounts = new HashMap<>();

    @MockBean
    private SubBudgetService subBudgetService;

    @MockBean
    private SubBudgetGoalsService subBudgetGoalsService;

    @Autowired
    private PreCalculationTrendService preCalculationTrendService;

    @BeforeEach
    void setUp() {
        monthlyEntryAmounts = new HashMap<>();

        // January (Month 1)
        Map<EntryType, BigDecimal> januaryEntries = new HashMap<>();
        januaryEntries.put(EntryType.INCOME, new BigDecimal("5000.00"));
        januaryEntries.put(EntryType.FIXED_EXPENSE, new BigDecimal("1250.00"));
        januaryEntries.put(EntryType.VARIABLE_EXPENSE, new BigDecimal("650.00"));
        monthlyEntryAmounts.put(1, januaryEntries);

        // February (Month 2)
        Map<EntryType, BigDecimal> februaryEntries = new HashMap<>();
        februaryEntries.put(EntryType.INCOME, new BigDecimal("5100.00"));
        februaryEntries.put(EntryType.FIXED_EXPENSE, new BigDecimal("1250.00"));
        februaryEntries.put(EntryType.VARIABLE_EXPENSE, new BigDecimal("750.00"));
        monthlyEntryAmounts.put(2, februaryEntries);

        Map<EntryType, BigDecimal> marchEntries = new HashMap<>();
        marchEntries.put(EntryType.INCOME, new BigDecimal("5000.00"));
        marchEntries.put(EntryType.FIXED_EXPENSE, new BigDecimal("1250.00"));
        marchEntries.put(EntryType.VARIABLE_EXPENSE, new BigDecimal("450.00"));
        monthlyEntryAmounts.put(3, marchEntries);
    }

    @Test
    void testCalculateTrendPercentageFormulaForNthMonth_whenMonthSpendingMapIsEmpty_returnZero(){
        Map<Integer, BigDecimal> monthSpending = new HashMap<>();
        int numberOfMonths = 1;
        BigDecimal result = preCalculationTrendService.calculateTrendPercentageFormulaForNthMonth(monthSpending, numberOfMonths);
        assertEquals(BigDecimal.ZERO, result);
    }

    @Test
    void testCalculateTrendPercentageFormulaForNthMonth_whenNumberOfMonthsIsOne(){
        Map<Integer, BigDecimal> monthSpending = new HashMap<>();
        int numberOfMonths = 1;
        BigDecimal expected = new BigDecimal("1.0");
        monthSpending.put(1, BigDecimal.valueOf(2350));
        BigDecimal result = preCalculationTrendService.calculateTrendPercentageFormulaForNthMonth(monthSpending, numberOfMonths);
        assertEquals(expected, result);
    }

    @Test
    void testCalculateTrendPercentageFormulaForNthMonth_whenNumberOfMonthsIsTwo(){
        Map<Integer, BigDecimal> monthSpending = new HashMap<>();
        int numberOfMonths = 2;
        BigDecimal expected = new BigDecimal("17.4");
        monthSpending.put(1, BigDecimal.valueOf(2350));
        monthSpending.put(2, BigDecimal.valueOf(2760));
        BigDecimal result = preCalculationTrendService.calculateTrendPercentageFormulaForNthMonth(monthSpending, numberOfMonths);
        assertEquals(expected, result);
    }

    @Test
    void testCalculateTrendPercentageFormulaForNthMonth_whenMonthSpendingMapHasOneEntryAndNumberOfMonthsIsTwo()
    {
        Map<Integer, BigDecimal> monthSpending = new HashMap<>();
        monthSpending.put(1, BigDecimal.valueOf(2350));
        int numberOfMonths = 2;
        BigDecimal result = preCalculationTrendService.calculateTrendPercentageFormulaForNthMonth(monthSpending, numberOfMonths);
        assertEquals(BigDecimal.ZERO, result);
    }

    @Test
    void testCalculateTrendPercentageFormulaForNthMonth_whenNumberOfMonthsIsThree()
    {
        Map<Integer, BigDecimal> monthSpending = new HashMap<>();
        int numberOfMonths = 3;
        BigDecimal expected = new BigDecimal("0.9");
        monthSpending.put(1, BigDecimal.valueOf(2350));
        monthSpending.put(2, BigDecimal.valueOf(2760));
        monthSpending.put(3, BigDecimal.valueOf(2330));
        BigDecimal result = preCalculationTrendService.calculateTrendPercentageFormulaForNthMonth(monthSpending, numberOfMonths);
        assertEquals(expected, result);
    }

    @Test
    void testCalculateTrendPercentageFormulaForNthMonth_whenNumberOfMonthsThreeAndMonthSpendingMapHasTwoEntries(){
        Map<Integer, BigDecimal> monthSpending = new HashMap<>();
        monthSpending.put(1, BigDecimal.valueOf(2350));
        monthSpending.put(2, BigDecimal.valueOf(2760));

        BigDecimal result = preCalculationTrendService.calculateTrendPercentageFormulaForNthMonth(monthSpending, 3);
        assertEquals(BigDecimal.ZERO, result);
    }

//    @Test
//    void testCalculateTrendPercentageFormula_whenMonthStartAmountIsZero_thenReturnZero()
//    {
//        double monthStartAmount = 0;
//        double monthEndAmount = 3260;
//        BigDecimal result = preCalculationTrendService.calculateTrendPercentageFormula(monthStartAmount, monthEndAmount);
//        assertEquals(0.0, result);
//    }
//
//    @Test
//    void testCalculateTrendPercentageFormula_whenMonthEndAmountIsZero_thenReturnZero()
//    {
//        double monthStartAmount = 3260;
//        double monthEndAmount = 0;
//        BigDecimal result = preCalculationTrendService.calculateTrendPercentageFormula(monthStartAmount, monthEndAmount);
//        assertEquals(0.0, result);
//    }

//    @Test
//    void shouldReturnTrendPercentageFormula()
//    {
//        double monthStartAmount = 2430;
//        double monthEndAmount = 2760;
//
//        BigDecimal expected = new BigDecimal("13.6");
//        BigDecimal actual = preCalculationTrendService.calculateTrendPercentageFormula(monthStartAmount, monthEndAmount);
//        assertEquals(expected.doubleValue(), actual.doubleValue());
//    }
//
//    @Test
//    void testCalculateTrendPercentageFormula_shouldReturnZeroWhenMonthStartAmountIsNegative()
//    {
//        double monthStartAmount = -3205;
//        double monthEndAmount = 2760;
//        BigDecimal result = preCalculationTrendService.calculateTrendPercentageFormula(monthStartAmount, monthEndAmount);
//        assertEquals(BigDecimal.ZERO, result);
//    }
//
//    @Test
//    void testCalculateTrendPercentageFormula_shouldReturnZeroWhenMonthEndAmountIsNegative()
//    {
//        double monthStartAmount = 3260;
//        double monthEndAmount = -2760;
//        BigDecimal result = preCalculationTrendService.calculateTrendPercentageFormula(monthStartAmount, monthEndAmount);
//        assertEquals(BigDecimal.ZERO, result);
//    }

    @Test
    void testCalculateTrendForNthMonthsByEntryType_whenEntryTypeVariableExpensesAndNumberOfMonthsIsOne()
    {
        int numberOfMonths = 1;
        BigDecimal actual = preCalculationTrendService.calculateTrendForNthMonthsByEntryType(monthlyEntryAmounts, numberOfMonths, EntryType.VARIABLE_EXPENSE);
        assertEquals(BigDecimal.ZERO, actual);
    }

    @Test
    void testCalculateTrendForNthMonthsByEntryType_whenNumberOfMonthsIsTwoAndEntryTypeVariableExpenses()
    {
        int numberOfMonths = 2;
        BigDecimal expected = new BigDecimal("15.4");
        BigDecimal result = preCalculationTrendService.calculateTrendForNthMonthsByEntryType(monthlyEntryAmounts, numberOfMonths, EntryType.VARIABLE_EXPENSE);
        assertEquals(expected, result);
    }

    @Test
    void testCalculateTrendForNthMonthsByEntryType_whenNumberOfMonthsIsThreeAndEntryTypeVariableExpenses()
    {
        int numberOfMonths = 3;
        BigDecimal expected = new BigDecimal("-12.3");
        BigDecimal result = preCalculationTrendService.calculateTrendForNthMonthsByEntryType(monthlyEntryAmounts, numberOfMonths, EntryType.VARIABLE_EXPENSE);
        assertEquals(expected, result);
    }

//    @Test
//    void testCalculateMonthlyEntryAmountsByDateRange_whenPreCalculationEntriesIsNull_thenReturnEmptyMap(){
//        List<PreCalculationEntry> preCalculationEntries = new ArrayList<>();
//        Map<String, Map<EntryType, BigDecimal>> actual = preCalculationTrendService.calculateMonthlyEntryAmountsByDateRange(preCalculationEntries);
//        assertTrue(actual.isEmpty());
//    }

    @Test
    void testCalculateMonthlyEntryAmountsByDateRange(){
        List<PreCalculationEntry> preCalculationEntries = new ArrayList<>();
        DateRange gasDateRange = new DateRange(LocalDate.of(2025, 7, 1), LocalDate.of(2025, 7, 7));
        PreCalculationEntry gasCategoryEntry = new PreCalculationEntry("Gas", gasDateRange, BigDecimal.valueOf(40.90), BigDecimal.valueOf(25.93), EntryType.VARIABLE_EXPENSE);
        preCalculationEntries.add(gasCategoryEntry);

        DateRange rentDateRange =  new DateRange(LocalDate.of(2025, 7, 1), LocalDate.of(2025, 7, 7));
        PreCalculationEntry rentCategoryEntry = new PreCalculationEntry("Rent", rentDateRange, BigDecimal.valueOf(1200), BigDecimal.valueOf(1200), EntryType.FIXED_EXPENSE);
        preCalculationEntries.add(rentCategoryEntry);

        Map<DateRange, List<CategoryEntryAmount>> expectedMonthlyEntryAmounts =  new HashMap<>();
        DateRange week1Range = new DateRange(LocalDate.of(2025, 7, 1), LocalDate.of(2025, 7, 7));

        CategoryEntryAmount gasVariableExpensesAmount = new CategoryEntryAmount(EntryType.VARIABLE_EXPENSE, week1Range, "Gas", BigDecimal.valueOf(40.90), BigDecimal.valueOf(25.93));
        CategoryEntryAmount fixedExpensesAmount = new CategoryEntryAmount(EntryType.FIXED_EXPENSE, week1Range, "Rent", BigDecimal.valueOf(1200),  BigDecimal.valueOf(1200));

        expectedMonthlyEntryAmounts.put(week1Range, List.of(gasVariableExpensesAmount, fixedExpensesAmount));

        List<BudgetScheduleRange> budgetScheduleRanges = new ArrayList<>();
        BudgetScheduleRange week1BudgetScheduleRange = new BudgetScheduleRange();
        week1BudgetScheduleRange.setStartRange(LocalDate.of(2025, 7, 1));
        week1BudgetScheduleRange.setEndRange(LocalDate.of(2025, 7, 7));
        week1BudgetScheduleRange.setBudgetDateRange(new DateRange(LocalDate.of(2025, 7, 1), LocalDate.of(2025, 7, 7)));
        budgetScheduleRanges.add(week1BudgetScheduleRange);

        Map<DateRange, List<CategoryEntryAmount>> actual = preCalculationTrendService.calculateMonthlyEntryAmountsByDateRange(preCalculationEntries, budgetScheduleRanges);

        assertNotNull(actual);
        assertEquals(expectedMonthlyEntryAmounts.size(), actual.size());
        for(Map.Entry<DateRange, List<CategoryEntryAmount>> entry : actual.entrySet()){
            DateRange dateRange = entry.getKey();
            List<CategoryEntryAmount> actualCategoryEntryAmounts = entry.getValue();
            for(int i = 0; i < actualCategoryEntryAmounts.size(); i++){
                CategoryEntryAmount actualCategoryEntryAmount = actualCategoryEntryAmounts.get(i);
                assertEquals(expectedMonthlyEntryAmounts.get(dateRange).get(i).getAmount(), actualCategoryEntryAmount.getAmount());
                assertEquals(expectedMonthlyEntryAmounts.get(dateRange).get(i).getEntryType(), actualCategoryEntryAmount.getEntryType());
                assertEquals(expectedMonthlyEntryAmounts.get(dateRange).get(i).getCategory(),  actualCategoryEntryAmount.getCategory());
                assertEquals(expectedMonthlyEntryAmounts.get(dateRange).get(i).getBudgeted(), actualCategoryEntryAmount.getBudgeted());
                assertEquals(expectedMonthlyEntryAmounts.get(dateRange).get(i).getDateRange().getStartDate(), actualCategoryEntryAmount.getDateRange().getStartDate());
                assertEquals(expectedMonthlyEntryAmounts.get(dateRange).get(i).getDateRange().getEndDate(), actualCategoryEntryAmount.getDateRange().getEndDate());
            }
            assertEquals(expectedMonthlyEntryAmounts.get(dateRange).size(), actualCategoryEntryAmounts.size());
        }
    }

    @Test
    void testCalculateTotalEntryTypeAmountsByDateRange(){
        Map<DateRange, List<CategoryEntryAmount>> expectedMonthlyEntryAmounts =  new HashMap<>();

        DateRange week1 = new DateRange(LocalDate.of(2025, 7, 1), LocalDate.of(2025, 7, 7));
        DateRange week2 = new DateRange(LocalDate.of(2025, 7, 8), LocalDate.of(2025, 7, 14));

        List<CategoryEntryAmount> week1CategoryEntries = new ArrayList<>();
        CategoryEntryAmount gasCategoryEntry = new CategoryEntryAmount(EntryType.VARIABLE_EXPENSE, week1, "Gas", new BigDecimal("42.00"), new BigDecimal("25.86"));
        CategoryEntryAmount rentCategoryEntry = new CategoryEntryAmount(EntryType.FIXED_EXPENSE, week1, "Rent", new BigDecimal("1200"), new BigDecimal("1200"));
        CategoryEntryAmount groceriesCategoryEntry = new CategoryEntryAmount(EntryType.VARIABLE_EXPENSE, week1, "Groceries", new BigDecimal("120"), new BigDecimal("105"));
        week1CategoryEntries.add(gasCategoryEntry);
        week1CategoryEntries.add(rentCategoryEntry);
        week1CategoryEntries.add(groceriesCategoryEntry);

        List<CategoryEntryAmount> week2CategoryEntries = new ArrayList<>();
        CategoryEntryAmount paymentCategoryEntry = new CategoryEntryAmount(EntryType.VARIABLE_EXPENSE, week2, "Payment", new BigDecimal("110"), new BigDecimal("86.04"));
        CategoryEntryAmount groceriesWeek2CategoryEntry = new CategoryEntryAmount(EntryType.VARIABLE_EXPENSE, week2, "Groceries", new BigDecimal("150"), new BigDecimal("120"));
        CategoryEntryAmount incomeCategoryEntry = new CategoryEntryAmount(EntryType.INCOME, week2, "Income", new BigDecimal("1625"), new BigDecimal("0"));
        week2CategoryEntries.add(paymentCategoryEntry);
        week2CategoryEntries.add(groceriesWeek2CategoryEntry);
        week2CategoryEntries.add(incomeCategoryEntry);

        expectedMonthlyEntryAmounts.put(week1,week1CategoryEntries);
        expectedMonthlyEntryAmounts.put(week2,week2CategoryEntries);

        Map<DateRange, Map<EntryType, BigDecimal>> expectedTotalMonthlyEntries = new HashMap<>();
        Map<EntryType, BigDecimal> week1EntryTotals = new HashMap<>();
        week1EntryTotals.put(EntryType.VARIABLE_EXPENSE, BigDecimal.valueOf(130.86));
        week1EntryTotals.put(EntryType.FIXED_EXPENSE, BigDecimal.valueOf(1200));

        Map<EntryType, BigDecimal> week2EntryTotals = new HashMap<>();
        week2EntryTotals.put(EntryType.VARIABLE_EXPENSE, BigDecimal.valueOf(206.04));
        week2EntryTotals.put(EntryType.INCOME, BigDecimal.valueOf(1625));

        expectedTotalMonthlyEntries.put(week1, week1EntryTotals);
        expectedTotalMonthlyEntries.put(week2, week2EntryTotals);

        Map<DateRange, Map<EntryType, BigDecimal>> actual = preCalculationTrendService.calculateTotalEntryTypeAmountsByDateRange(expectedMonthlyEntryAmounts);
        assertNotNull(actual);
        assertEquals(expectedTotalMonthlyEntries.size(), actual.size());

        for(Map.Entry<DateRange, Map<EntryType, BigDecimal>> entry : actual.entrySet())
        {
            DateRange dateRange = entry.getKey();
            Map<EntryType,BigDecimal> actualMonthlyEntry = entry.getValue();
            Map<EntryType,BigDecimal> expectedMonthlyEntry = expectedTotalMonthlyEntries.get(entry.getKey());
            assertNotNull(expectedMonthlyEntry, "Expected entry missing for DateRange: " + dateRange);
            assertEquals(expectedMonthlyEntry.size(), actualMonthlyEntry.size(),
                    "Mismatched entry type count for DateRange: " + dateRange);

            for (EntryType type : expectedMonthlyEntry.keySet()) {
                BigDecimal expectedAmount = expectedMonthlyEntry.get(type);
                BigDecimal actualAmount = actualMonthlyEntry.getOrDefault(type, BigDecimal.ZERO);
                assertEquals(expectedAmount, actualAmount,
                        "Mismatch for DateRange " + dateRange + " and EntryType " + type);
            }
        }
    }

    @Test
    @DisplayName("Test CreateSubBudgetTrendsByEntryType when Monthly Total Entry Amounts Map is empty, then return an empty collection")
    void testCreateSubBudgetTrendsByEntryType_whenMonthlyTotalEntryAmountsIsEmpty_thenReturnEmptyList(){
        Map<DateRange, Map<EntryType, BigDecimal>> expectedTotalMonthlyEntries = new HashMap<>();
        List<SubBudgetTrend> actual = preCalculationTrendService.createSubBudgetTrendsByEntryType(expectedTotalMonthlyEntries, 1L);
        assertNotNull(actual);
        assertEquals(expectedTotalMonthlyEntries.size(), actual.size());
    }

    @Test
    @DisplayName("Test CreateSubBudgetTrendsByEntryType with valid data")
    void testCreateSubBudgetTrendsByEntryType()
    {
        Map<DateRange, Map<EntryType, BigDecimal>> expectedTotalMonthlyEntries = new HashMap<>();
        DateRange januaryDate = new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31));
        DateRange februaryDate = new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28));

        Map<EntryType, BigDecimal> expectedJanuaryEntries = new HashMap<>();
        expectedJanuaryEntries.put(EntryType.VARIABLE_EXPENSE, BigDecimal.valueOf(1054));
        expectedJanuaryEntries.put(EntryType.FIXED_EXPENSE, BigDecimal.valueOf(2196));
        expectedJanuaryEntries.put(EntryType.INCOME, BigDecimal.valueOf(3250));

        Map<EntryType, BigDecimal> expectedFebruaryEntries = new HashMap<>();
        expectedFebruaryEntries.put(EntryType.VARIABLE_EXPENSE, BigDecimal.valueOf(750));
        expectedFebruaryEntries.put(EntryType.FIXED_EXPENSE, BigDecimal.valueOf(2298));
        expectedFebruaryEntries.put(EntryType.INCOME, BigDecimal.valueOf(3250));

        expectedTotalMonthlyEntries.put(januaryDate, expectedJanuaryEntries);
        expectedTotalMonthlyEntries.put(februaryDate, expectedFebruaryEntries);

        List<SubBudgetTrend> expectedSubBudgetTrends = new ArrayList<>();
        SubBudgetTrend januarySubBudgetTrend = new SubBudgetTrend(1L,
                januaryDate,
                0.0,
                1054.0,
                2196.0,
                3250.0,
                0.0,
                250.0);
        SubBudgetTrend februarySubBudgetTrend = new SubBudgetTrend(2L,
                februaryDate,
                202,
                750.0,
                2298.0,
                3250.0,
                48.0,
                250.0);
        expectedSubBudgetTrends.add(januarySubBudgetTrend);
        expectedSubBudgetTrends.add(februarySubBudgetTrend);

        // Mock SubBudget objects
        SubBudget janSubBudget = new SubBudget();
        janSubBudget.setId(1L);
        SubBudget febSubBudget = new SubBudget();
        febSubBudget.setId(2L);

        // Mock SubBudgetGoals objects
        SubBudgetGoals janGoals = new SubBudgetGoals();
        janGoals.setSavingsTarget(BigDecimal.valueOf(250));
        SubBudgetGoals febGoals = new SubBudgetGoals();
        febGoals.setSavingsTarget(BigDecimal.valueOf(250));

        // Setup mocks
        Mockito.when(subBudgetService.getSubBudgetsByUserIdAndDate(1L, januaryDate.getStartDate(), januaryDate.getEndDate()))
                .thenReturn(Optional.of(janSubBudget));
        Mockito.when(subBudgetService.getSubBudgetsByUserIdAndDate(1L, februaryDate.getStartDate(), februaryDate.getEndDate()))
                .thenReturn(Optional.of(febSubBudget));

        Mockito.when(subBudgetGoalsService.getSubBudgetGoalsEntitiesBySubBudgetId(1L))
                .thenReturn(janGoals);
        Mockito.when(subBudgetGoalsService.getSubBudgetGoalsEntitiesBySubBudgetId(2L))
                .thenReturn(febGoals);

        List<SubBudgetTrend> actual = preCalculationTrendService.createSubBudgetTrendsByEntryType(expectedTotalMonthlyEntries, 1L);
        assertNotNull(actual);
        assertEquals(expectedSubBudgetTrends.size(), actual.size());

        actual.sort(Comparator.comparing(subBudgetTrend -> subBudgetTrend.getMonthRange().getStartDate()));

        for(int i = 1; i < expectedSubBudgetTrends.size(); i++) {
            SubBudgetTrend actualSubBudgetTrend = actual.get(i);
            SubBudgetTrend expectedSubBudgetTrend = expectedSubBudgetTrends.get(i);

            assertEquals(expectedSubBudgetTrend.getSubBudgetId(), actualSubBudgetTrend.getSubBudgetId(),
                    "ID mismatch at index " + i);
            assertEquals(expectedSubBudgetTrend.getMonthRange(), actualSubBudgetTrend.getMonthRange(),
                    "DateRange mismatch at index " + i);
            assertEquals(expectedSubBudgetTrend.getMonthlyVariableExpenses(), actualSubBudgetTrend.getMonthlyVariableExpenses(), 0.0001,
                    "VariableExpense mismatch at index " + i);
            assertEquals(expectedSubBudgetTrend.getMonthlyFixedExpenses(), actualSubBudgetTrend.getMonthlyFixedExpenses(), 0.0001,
                    "FixedExpense mismatch at index " + i);
            assertEquals(expectedSubBudgetTrend.getMonthlySaved(), actualSubBudgetTrend.getMonthlySaved(), 0.0001,
                    "Monthly Saved mismatch at index " + i);
            assertEquals(expectedSubBudgetTrend.getMonthlyGoalAmount(), actualSubBudgetTrend.getMonthlyGoalAmount(), 0.0001,
                    "Monthly Goal Amount mismatch at index " + i);
            assertEquals(expectedSubBudgetTrend.getMonthlyGoalReached(), actualSubBudgetTrend.getMonthlyGoalReached(), 0.0001,
                    "Monthly Goal Amount Reached mismatch at index " + i);
        }
    }

    @Test
    @DisplayName("Test CalculateTotalEntryTypeAmountsByDateRange when Category Entry Amount is null then pass to next valid Category Entry Amount")
    void testCalculateTotalEntryTypeAmountByDateRange_whenCategoryEntryAmountIsNull_thenPassToNextValidCategoryEntryAmount()
    {
        Map<DateRange, List<CategoryEntryAmount>> expectedMonthlyEntryAmounts =  new HashMap<>();
        DateRange week1 = new DateRange(LocalDate.of(2025, 7, 1), LocalDate.of(2025, 7, 7));
        List<CategoryEntryAmount> week1CategoryEntries = new ArrayList<>();
        CategoryEntryAmount gasCategoryEntry = new CategoryEntryAmount(EntryType.VARIABLE_EXPENSE, week1, "Gas", new BigDecimal("42.00"), new BigDecimal("25.86"));
        CategoryEntryAmount groceriesCategoryEntry = new CategoryEntryAmount(EntryType.VARIABLE_EXPENSE, week1, "Groceries", new BigDecimal("120"), new BigDecimal("110"));
        week1CategoryEntries.add(gasCategoryEntry);
        week1CategoryEntries.add(null);
        week1CategoryEntries.add(groceriesCategoryEntry);
        expectedMonthlyEntryAmounts.put(week1,week1CategoryEntries);

        Map<DateRange, Map<EntryType, BigDecimal>> expectedTotalMonthlyEntries = new HashMap<>();
        Map<EntryType, BigDecimal> week1EntryTotals = new HashMap<>();
        week1EntryTotals.put(EntryType.VARIABLE_EXPENSE, BigDecimal.valueOf(135.86));
        expectedTotalMonthlyEntries.put(week1, week1EntryTotals);

        Map<DateRange, Map<EntryType, BigDecimal>> actual = preCalculationTrendService.calculateTotalEntryTypeAmountsByDateRange(expectedMonthlyEntryAmounts);
        assertNotNull(actual);
        assertEquals(expectedTotalMonthlyEntries.size(), actual.size());
        for(Map.Entry<DateRange, Map<EntryType, BigDecimal>> entry : actual.entrySet())
        {
            DateRange dateRange = entry.getKey();
            Map<EntryType,BigDecimal> actualMonthlyEntry = entry.getValue();
            Map<EntryType,BigDecimal> expectedMonthlyEntry = expectedTotalMonthlyEntries.get(entry.getKey());
            assertNotNull(expectedMonthlyEntry, "Expected entry missing for DateRange: " + dateRange);
            assertEquals(expectedMonthlyEntry.size(), actualMonthlyEntry.size(),
                    "Mismatched entry type count for DateRange: " + dateRange);

            for (EntryType type : expectedMonthlyEntry.keySet()) {
                BigDecimal expectedAmount = expectedMonthlyEntry.get(type);
                BigDecimal actualAmount = actualMonthlyEntry.getOrDefault(type, BigDecimal.ZERO);
                assertEquals(expectedAmount, actualAmount);
            }
        }
    }

    @Test
    @DisplayName("Test CalculateTotalEntryTypeAmountsByDateRange when spending amount is null in CategoryEntryAmount, should return zero value for categoryEntryAmount")
    void testCalculateTotalEntryAmountsByDateRange_whenSpendingAmountIsNull_thenReturnZeroValueForCategoryEntryAmount()
    {
        Map<DateRange, List<CategoryEntryAmount>> expectedMonthlyEntryAmounts =  new HashMap<>();
        DateRange week1 = new DateRange(LocalDate.of(2025, 7, 1), LocalDate.of(2025, 7, 7));
        List<CategoryEntryAmount> week1CategoryEntries = new ArrayList<>();
        CategoryEntryAmount gasCategoryEntry = new CategoryEntryAmount(EntryType.VARIABLE_EXPENSE, week1, "Gas", new BigDecimal("40.00"), new BigDecimal("25.86"));
        CategoryEntryAmount groceriesCategoryEntry = new CategoryEntryAmount(EntryType.VARIABLE_EXPENSE, week1, "Groceries", new BigDecimal("120"), null);
        week1CategoryEntries.add(gasCategoryEntry);
        week1CategoryEntries.add(groceriesCategoryEntry);
        expectedMonthlyEntryAmounts.put(week1,week1CategoryEntries);

        Map<DateRange, Map<EntryType, BigDecimal>> expectedTotalMonthlyEntries = new HashMap<>();
        Map<EntryType, BigDecimal> week1EntryTotals = new HashMap<>();
        week1EntryTotals.put(EntryType.VARIABLE_EXPENSE, BigDecimal.valueOf(25.86));
        expectedTotalMonthlyEntries.put(week1, week1EntryTotals);

        Map<DateRange, Map<EntryType, BigDecimal>> actual = preCalculationTrendService.calculateTotalEntryTypeAmountsByDateRange(expectedMonthlyEntryAmounts);
        assertNotNull(actual);
        assertEquals(expectedTotalMonthlyEntries.size(), actual.size());
        for(Map.Entry<DateRange, Map<EntryType, BigDecimal>> entry : actual.entrySet())
        {
            DateRange dateRange = entry.getKey();
            Map<EntryType,BigDecimal> actualMonthlyEntry = entry.getValue();
            Map<EntryType,BigDecimal> expectedMonthlyEntry = expectedTotalMonthlyEntries.get(entry.getKey());
            assertNotNull(expectedMonthlyEntry, "Expected entry missing for DateRange: " + dateRange);
            assertEquals(expectedMonthlyEntry.size(), actualMonthlyEntry.size(),
                    "Mismatched entry type count for DateRange: " + dateRange);
            for (EntryType type : expectedMonthlyEntry.keySet()) {
                BigDecimal expectedAmount = expectedMonthlyEntry.get(type);
                BigDecimal actualAmount = actualMonthlyEntry.getOrDefault(type, BigDecimal.ZERO);
                assertEquals(expectedAmount, actualAmount);
            }
        }
    }

    @Test
    @DisplayName("Test CalculateTotalEntryTypeAmountsByDateRange when spending amount is negative then throw IllegalArgumentException")
    void testCalculateTotalEntryAmountsByDateRange_whenSpendingAmountIsNegative_thenThrowIllegalArgumentException(){
        Map<DateRange, List<CategoryEntryAmount>> expectedMonthlyEntryAmounts =  new HashMap<>();
        DateRange week1 = new DateRange(LocalDate.of(2025, 7, 1), LocalDate.of(2025, 7, 7));
        List<CategoryEntryAmount> week1CategoryEntries = new ArrayList<>();
        CategoryEntryAmount gasCategoryEntry = new CategoryEntryAmount(EntryType.VARIABLE_EXPENSE, week1, "Gas", new BigDecimal("40.00"), new BigDecimal("-25.86"));
        CategoryEntryAmount groceriesCategoryEntry = new CategoryEntryAmount(EntryType.VARIABLE_EXPENSE, week1, "Groceries", new BigDecimal("120"), new BigDecimal("105"));
        week1CategoryEntries.add(gasCategoryEntry);
        week1CategoryEntries.add(groceriesCategoryEntry);
        expectedMonthlyEntryAmounts.put(week1,week1CategoryEntries);

        assertThrows(IllegalArgumentException.class, () -> preCalculationTrendService.calculateTotalEntryTypeAmountsByDateRange(expectedMonthlyEntryAmounts));
    }


    @AfterEach
    void tearDown() {
    }
}