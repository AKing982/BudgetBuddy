package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.InvalidBudgetScheduleException;
import com.app.budgetbuddy.exceptions.InvalidPrecalculationException;
import com.app.budgetbuddy.exceptions.InvalidSubBudgetException;
import com.app.budgetbuddy.exceptions.InvalidWeekNumberCategoryException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class PreCalculationEngineTest {
    @MockBean
    private PreCalculationThreadService preCalculationThreadService;

    @MockBean
    private FourierSeriesEngine fourierSeriesEngine;

    @MockBean
    private PreCalculationTrendService preCalculationTrendService;

    @MockBean
    private CategoryTypeProcessor categoryTypeProcessor;

    @Autowired
    public PreCalculationEngine preCalculationEngine;

    private SubBudgetGoals subBudgetGoals;
    private SubBudget subBudget;
    private Budget budget;
    private BudgetSchedule budgetSchedule;

    @BeforeEach
    void setUp() {

        budget = Budget.builder()
                .budgetPeriod(Period.MONTHLY)
                .startDate(LocalDate.of(2025, 1, 1))
                .endDate(LocalDate.of(2025, 12, 31))
                .income(BigDecimal.valueOf(39000))
                .savingsProgress(BigDecimal.valueOf(0))
                .totalMonthsToSave(12)
                .budgetAmount(BigDecimal.valueOf(39000))
                .budgetMode(BudgetMode.SAVINGS_PLAN)
                .budgetName("2025 Savings Budget Plan")
                .userId(1L)
                .build();

        subBudgetGoals = new SubBudgetGoals();
        subBudget = new SubBudget();
        subBudget.setSubBudgetGoals(subBudgetGoals);

        subBudgetGoals.setId(3L);
        subBudgetGoals.setSubBudgetId(3L);
        subBudgetGoals.setStatus(GoalStatus.COMPLETED);
        subBudgetGoals.setSavingsTarget(BigDecimal.valueOf(250));
        subBudgetGoals.setContributedAmount(BigDecimal.valueOf(0));

        budgetSchedule = new BudgetSchedule();
        budgetSchedule.setStartDate(LocalDate.of(2025, 3, 1));
        budgetSchedule.setEndDate(LocalDate.of(2025, 3, 31));
        budgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)));

        subBudget = new SubBudget();
        subBudget.setId(3L);
        subBudget.setSubBudgetName("March 2025");
        subBudget.setBudget(budget);
        subBudget.setBudgetSchedule(List.of(budgetSchedule));
        subBudget.setStartDate(LocalDate.of(2025, 3, 1));
        subBudget.setEndDate(LocalDate.of(2025, 3, 31));
        subBudget.setAllocatedAmount(new BigDecimal(3250));
        subBudget.setSubSavingsTarget(new BigDecimal("200.00"));
    }

    @Test
    void testGetPrecalculationEntriesByMonth_whenBudgetCategoriesIsNull_thenReturnEmptyMap() {
        List<BudgetCategory> budgetCategories = new ArrayList<>();
        Map<WeekNumber, List<PreCalculationEntry>> actual = preCalculationEngine.getPrecalculationEntriesByMonth(null, subBudget);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGetPrecalculationEntriesByMonth_whenSubBudgetIsNull_thenReturnEmptyMap() {
        Map<WeekNumber, List<BudgetCategory>> budgetCategories = new HashMap<>();
        List<BudgetCategory> week10BudgetCategories = createBudgetCategoriesByWeekNumber(10);
        budgetCategories.put(new WeekNumber(10, 2025, new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 7))), week10BudgetCategories);
        Map<WeekNumber, List<PreCalculationEntry>> actual = preCalculationEngine.getPrecalculationEntriesByMonth(budgetCategories, null);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGetPrecalculationEntriesByMonth_validBudgetCategoriesAndSubBudget() {
        Map<WeekNumber, List<BudgetCategory>> budgetCategoriesByWeekNumber = new HashMap<>();
        List<BudgetCategory> week10BudgetCategories = createBudgetCategoriesByWeekNumber(10);
        List<BudgetCategory> week12BudgetCategories = createBudgetCategoriesByWeekNumber(12);

        budgetCategoriesByWeekNumber.put(new WeekNumber(10, 2025, new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 7))), week10BudgetCategories);
        budgetCategoriesByWeekNumber.put(new WeekNumber(12, 2025, new DateRange(LocalDate.of(2025, 3, 17), LocalDate.of(2025, 3, 23))), week12BudgetCategories);

        Map<WeekNumber, List<PreCalculationEntry>> expected = new HashMap<>();

        List<PreCalculationEntry> week1PreCalculations = new ArrayList<>();
        List<PreCalculationEntry> week3PreCalculations = new ArrayList<>();
        week1PreCalculations.add(new PreCalculationEntry("Gas", new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 7)), new BigDecimal("40.23"), new BigDecimal("23.45"), EntryType.VARIABLE_EXPENSE));
        week1PreCalculations.add(new PreCalculationEntry("Rent", new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 7)), new BigDecimal("1200.0"), new BigDecimal("1200.0"), EntryType.FIXED_EXPENSE));
        week3PreCalculations.add(new PreCalculationEntry("Gas", new DateRange(LocalDate.of(2025, 3, 17), LocalDate.of(2025, 3, 23)), new BigDecimal("40.23"), new BigDecimal("35.45"), EntryType.VARIABLE_EXPENSE));
        week3PreCalculations.add(new PreCalculationEntry("Rent", new DateRange(LocalDate.of(2025, 3, 17), LocalDate.of(2025, 3, 23)), new BigDecimal("707.0"), new BigDecimal("707.0"), EntryType.FIXED_EXPENSE));
        expected.put(new WeekNumber(10, 2025, new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 7))), week1PreCalculations);
        expected.put(new WeekNumber(12, 2025, new DateRange(LocalDate.of(2025, 3, 17), LocalDate.of(2025, 3, 23))), week3PreCalculations);

        Map<WeekNumber, List<PreCalculationEntry>> actual = preCalculationEngine.getPrecalculationEntriesByMonth(budgetCategoriesByWeekNumber, subBudget);
        assertEquals(expected.size(), actual.size());
        for (Map.Entry<WeekNumber, List<PreCalculationEntry>> entry : expected.entrySet()) {
            WeekNumber expectedWeekNumber = entry.getKey();
            List<PreCalculationEntry> expectedList = entry.getValue();
            List<PreCalculationEntry> actualList = actual.get(expectedWeekNumber);
            assertNotNull(actualList, "Actual list should not be null for week: " + expectedWeekNumber);
            assertEquals(expectedList.size(), actualList.size(), "Mismatch in entry count for week: " + expectedWeekNumber.toString());
            WeekNumber actualWeek = actual.keySet().stream()
                    .filter(week -> week.equals(expectedWeekNumber))
                    .findFirst()
                    .orElseThrow(() -> new AssertionError("Expected week not found in actual result"));
            assertEquals(expectedWeekNumber, actualWeek, "Mismatch in week number for week: " + expectedWeekNumber);
            for (int i = 0; i < expectedList.size(); i++) {
                PreCalculationEntry expectedEntry = expectedList.get(i);
                PreCalculationEntry actualEntry = actualList.get(i);

                assertEquals(expectedEntry, actualEntry, "Mismatch at index " + i + " for week: " + expectedWeekNumber);
            }
        }
    }

    @Test
    void testGetPrecalculationEntriesByMonth_whenBudgetCategoriesWeekNumbersHasNoBudgetCategories_shouldReturnRemainingWeekNumbersWithBudgetCategories() {
        Map<WeekNumber, List<BudgetCategory>> budgetCategoriesByWeekNumber = new HashMap<>();
        List<BudgetCategory> week12BudgetCategories = createBudgetCategoriesByWeekNumber(12);

        budgetCategoriesByWeekNumber.put(new WeekNumber(10, 2025, new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 7))), new ArrayList<>());
        budgetCategoriesByWeekNumber.put(new WeekNumber(12, 2025, new DateRange(LocalDate.of(2025, 3, 17), LocalDate.of(2025, 3, 23))), week12BudgetCategories);

        Map<WeekNumber, List<PreCalculationEntry>> expected = new HashMap<>();
        List<PreCalculationEntry> week3PreCalculations = new ArrayList<>();
        week3PreCalculations.add(new PreCalculationEntry("Gas", new DateRange(LocalDate.of(2025, 3, 17), LocalDate.of(2025, 3, 23)), new BigDecimal("40.23"), new BigDecimal("35.45"), EntryType.VARIABLE_EXPENSE));
        week3PreCalculations.add(new PreCalculationEntry("Rent", new DateRange(LocalDate.of(2025, 3, 17), LocalDate.of(2025, 3, 23)), new BigDecimal("707.0"), new BigDecimal("707.0"), EntryType.FIXED_EXPENSE));
        expected.put(new WeekNumber(12, 2025, new DateRange(LocalDate.of(2025, 3, 17), LocalDate.of(2025, 3, 23))), week3PreCalculations);

        Map<WeekNumber, List<PreCalculationEntry>> actual = preCalculationEngine.getPrecalculationEntriesByMonth(budgetCategoriesByWeekNumber, subBudget);
        assertEquals(expected.size(), actual.size());
        for (Map.Entry<WeekNumber, List<PreCalculationEntry>> entry : expected.entrySet()) {
            WeekNumber expectedWeekNumber = entry.getKey();
            List<PreCalculationEntry> expectedList = entry.getValue();
            List<PreCalculationEntry> actualList = actual.get(expectedWeekNumber);
            assertNotNull(actualList, "Actual list should not be null for week: " + expectedWeekNumber);
            assertEquals(expectedList.size(), actualList.size(), "Mismatch in entry count for week: " + expectedWeekNumber.toString());
            WeekNumber actualWeek = actual.keySet().stream()
                    .filter(week -> week.equals(expectedWeekNumber))
                    .findFirst()
                    .orElseThrow(() -> new AssertionError("Expected week not found in actual result"));
            assertEquals(expectedWeekNumber, actualWeek, "Mismatch in week number for week: " + expectedWeekNumber);
            for (int i = 0; i < expectedList.size(); i++) {
                PreCalculationEntry expectedEntry = expectedList.get(i);
                PreCalculationEntry actualEntry = actualList.get(i);

                assertEquals(expectedEntry, actualEntry, "Mismatch at index " + i + " for week: " + expectedWeekNumber);
            }
        }
    }

    @Test
    void testGetPrecalculationEntriesByMonth_whenIncorrectWeekNumbersAndBudgetCategoriesForSubBudget_shouldThrowException() {
        Map<WeekNumber, List<BudgetCategory>> budgetCategoriesByWeekNumber = createIncorrectBudgetCategories();
        assertThrows(InvalidPrecalculationException.class, () -> preCalculationEngine.getPrecalculationEntriesByMonth(budgetCategoriesByWeekNumber, subBudget));
    }

    @Test
    void testGetPrecalculationEntriesByMonth_whenIncorrectSubBudgetAndCorrectBudgetCategoriesForWeekNumber_shouldThrowException() {
        Map<WeekNumber, List<BudgetCategory>> budgetCategoriesByWeekNumber = new HashMap<>();
        List<BudgetCategory> week10BudgetCategories = createBudgetCategoriesByWeekNumber(10);
        List<BudgetCategory> week12BudgetCategories = createBudgetCategoriesByWeekNumber(12);
        budgetCategoriesByWeekNumber.put(new WeekNumber(10, 2025, new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 7))), week10BudgetCategories);
        budgetCategoriesByWeekNumber.put(new WeekNumber(12, 2025, new DateRange(LocalDate.of(2025, 3, 17), LocalDate.of(2025, 3, 23))), week12BudgetCategories);

        SubBudget incorrectSubBudget = new SubBudget();
        incorrectSubBudget.setStartDate(LocalDate.of(2025, 1, 1));
        incorrectSubBudget.setEndDate(LocalDate.of(2025, 1, 31));
        incorrectSubBudget.setBudget(budget);

        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setSubBudgetId(1L);
        budgetSchedule.setStartDate(LocalDate.of(2025, 1, 1));
        budgetSchedule.setEndDate(LocalDate.of(2025, 1, 31));
        budgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        incorrectSubBudget.setBudgetSchedule(List.of(budgetSchedule));

        assertThrows(InvalidPrecalculationException.class, () -> preCalculationEngine.getPrecalculationEntriesByMonth(budgetCategoriesByWeekNumber, incorrectSubBudget));
    }

    @Test
    void testGetBudgetCategoriesByWeekNumber_whenBudgetCategoriesIsEmpty_thenReturnEmptyMap(){
        Map<WeekNumber, List<BudgetCategory>> actual = preCalculationEngine.getBudgetCategoriesByWeekNumber(new ArrayList<>(), budgetSchedule);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGetBudgetCategoriesByWeekNumber_whenBudgetCategoriesIsNull_thenReturnEmptyMap(){
        Map<WeekNumber, List<BudgetCategory>> actual = preCalculationEngine.getBudgetCategoriesByWeekNumber(null, budgetSchedule);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGetBudgetCategoriesByWeekNumber_whenBudgetScheduleIsNull_thenThrowExceptionAndReturnEmptyMap()
    {
        List<BudgetCategory> budgetCategories = createBudgetCategoriesByWeekNumber(10);
        Map<WeekNumber, List<BudgetCategory>> actual = preCalculationEngine.getBudgetCategoriesByWeekNumber(budgetCategories, null);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGenerateWeekNumbersByCurrentBudgetSchedule_whenBudgetScheduleIsNull_thenReturnEmptySet(){
        List<WeekNumber> actual = preCalculationEngine.generateWeekNumbersByCurrentBudgetSchedule(null);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGenerateWeekNumbersByCurrentBudgetSchedule_whenBudgetScheduleValid()
    {
        List<WeekNumber> expected = new ArrayList<>();
        expected.add(new WeekNumber(9, 2025, new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 2))));
        expected.add(new WeekNumber(10, 2025, new DateRange(LocalDate.of(2025, 3, 3), LocalDate.of(2025, 3, 9))));
        expected.add(new WeekNumber(11, 2025, new DateRange(LocalDate.of(2025, 3, 10), LocalDate.of(2025, 3, 16))));
        expected.add(new WeekNumber(12, 2025, new DateRange(LocalDate.of(2025, 3, 17), LocalDate.of(2025, 3, 23))));
        expected.add(new WeekNumber(13, 2025, new DateRange(LocalDate.of(2025, 3, 24), LocalDate.of(2025, 3, 30))));
        expected.add(new WeekNumber(14, 2025, new DateRange(LocalDate.of(2025, 3, 31), LocalDate.of(2025, 3, 31))));

        List<WeekNumber> actual = preCalculationEngine.generateWeekNumbersByCurrentBudgetSchedule(budgetSchedule);
        assertFalse(actual.isEmpty());
        assertEquals(expected.size(), actual.size());
        for(int i = 0; i < expected.size(); i++) {
            WeekNumber expectedWeek = expected.get(i);
            WeekNumber actualWeek = actual.get(i);
            assertEquals(expectedWeek, actualWeek, "Mismatch at index " + i);
        }
    }

    @Test
    void testGetBudgetCategoriesByWeekNumber_whenBudgetCategoriesAndBudgetScheduleAreValid_thenReturnMapWithBudgetCategories()
    {
        List<BudgetCategory> budgetCategories = createBudgetCategories();

        Map<WeekNumber, List<BudgetCategory>> expected = new HashMap<>();
        List<BudgetCategory> week1BudgetCategories = createBudgetCategoriesByWeekNumber(10);
        List<BudgetCategory> week3BudgetCategories = createBudgetCategoriesByWeekNumber(12);
        expected.put(new WeekNumber(10, 2025, new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 7))), week1BudgetCategories);
        expected.put(new WeekNumber(12, 2025, new DateRange(LocalDate.of(2025, 3, 17), LocalDate.of(2025, 3, 23))), week3BudgetCategories);

        Map<WeekNumber, List<BudgetCategory>> actual = preCalculationEngine.getBudgetCategoriesByWeekNumber(budgetCategories, budgetSchedule);
        assertFalse(actual.isEmpty());
        assertEquals(expected.size(), actual.size());
        for (Map.Entry<WeekNumber, List<BudgetCategory>> entry : expected.entrySet()) {
            WeekNumber expectedWeekNumber = entry.getKey();
            List<BudgetCategory> expectedList = entry.getValue();
            WeekNumber actualWeek = actual.keySet().stream()
                    .filter(week -> week.equals(expectedWeekNumber))
                    .findFirst()
                    .orElseThrow(() -> new AssertionError("Expected week not found in actual result"));
            assertEquals(expectedWeekNumber, actualWeek, "Mismatch in week number for week: " + expectedWeekNumber);
            for(int i = 0; i < expectedList.size(); i++) {
                BudgetCategory expectedCategory = expectedList.get(i);
                BudgetCategory actualCategory = actual.get(expectedWeekNumber).get(i);
                assertEquals(expectedCategory, actualCategory, "Mismatch at index " + i + " for week: " + expectedWeekNumber);
            }
        }
    }

    @Test
    void testGetSubBudgetGoalsByWeekNumber_whenBudgetScheduleIsNull_thenReturnEmptyMap(){
        Map<WeekNumber, List<SubBudgetGoals>> actual = preCalculationEngine.getSubBudgetGoalsByWeek(null, subBudgetGoals);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGetSubBudgetGoalsByWeekNumber_whenSubBudgetGoalsIsNull_thenReturnEmptyMap(){
        Map<WeekNumber, List<SubBudgetGoals>> actual = preCalculationEngine.getSubBudgetGoalsByWeek(budgetSchedule, null);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGetSubBudgetGoalsByWeekNumber_whenValidBudgetScheduleAndSubBudgetGoals(){
        Map<WeekNumber, List<SubBudgetGoals>> expected = new HashMap<>();

    }

    private Map<WeekNumber, List<BudgetCategory>> createIncorrectBudgetCategories()
    {
        Map<WeekNumber, List<BudgetCategory>> budgetCategoriesByWeekNumber = new HashMap<>();
        List<BudgetCategory> week1BudgetCategories = new ArrayList<>();
        List<BudgetCategory> week3BudgetCategories = new ArrayList<>();
        BudgetCategory week1Gas = new BudgetCategory();
        week1Gas.setStartDate(LocalDate.of(2025, 1, 1));
        week1Gas.setEndDate(LocalDate.of(2025, 1, 7));
        week1Gas.setCategoryName("Gas");
        week1Gas.setSubBudgetId(1L);
        week1Gas.setId(4L);
        week1Gas.setBudgetedAmount(40.23);
        week1Gas.setBudgetActual(23.45);
        week1BudgetCategories.add(week1Gas);

        BudgetCategory rentWeek1 = new BudgetCategory();
        rentWeek1.setStartDate(LocalDate.of(2025, 1, 1));
        rentWeek1.setEndDate(LocalDate.of(2025, 1, 7));
        rentWeek1.setCategoryName("Rent");
        rentWeek1.setSubBudgetId(1L);
        rentWeek1.setId(15L);
        rentWeek1.setBudgetedAmount(1200.0);
        rentWeek1.setBudgetActual(1200.0);
        week1BudgetCategories.add(rentWeek1);

        BudgetCategory week3Gas = new BudgetCategory();
        week3Gas.setStartDate(LocalDate.of(2025, 1, 17));
        week3Gas.setEndDate(LocalDate.of(2025, 1, 23));
        week3Gas.setCategoryName("Gas");
        week3Gas.setSubBudgetId(1L);
        week3Gas.setId(14L);
        week3Gas.setBudgetedAmount(40.23);
        week3Gas.setBudgetActual(35.45);
        week3BudgetCategories.add(week3Gas);

        BudgetCategory rentWeek3 = new BudgetCategory();
        rentWeek3.setStartDate(LocalDate.of(2025, 1, 17));
        rentWeek3.setEndDate(LocalDate.of(2025, 1, 23));
        rentWeek3.setCategoryName("Rent");
        rentWeek3.setSubBudgetId(1L);
        rentWeek3.setId(16L);
        rentWeek3.setBudgetedAmount(707.0);
        rentWeek3.setBudgetActual(707.0);
        week3BudgetCategories.add(rentWeek3);

        budgetCategoriesByWeekNumber.put(new WeekNumber(1, 2025, new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7))), week1BudgetCategories);
        budgetCategoriesByWeekNumber.put(new WeekNumber(3, 2025, new DateRange(LocalDate.of(2025, 1, 17), LocalDate.of(2025, 1, 23))), week3BudgetCategories);
        return budgetCategoriesByWeekNumber;
    }

    private List<BudgetCategory> createBudgetCategoriesByWeekNumber(int weekNumber)
    {
        if(weekNumber == 10)
        {
            List<BudgetCategory> week10BudgetCategories = new ArrayList<>();
            BudgetCategory week1Gas = new BudgetCategory();
            week1Gas.setStartDate(LocalDate.of(2025, 3, 1));
            week1Gas.setEndDate(LocalDate.of(2025, 3, 7));
            week1Gas.setCategoryName("Gas");
            week1Gas.setSubBudgetId(3L);
            week1Gas.setId(13L);
            week1Gas.setBudgetedAmount(40.23);
            week1Gas.setBudgetActual(23.45);
            week10BudgetCategories.add(week1Gas);

            BudgetCategory rentWeek1 = new BudgetCategory();
            rentWeek1.setStartDate(LocalDate.of(2025, 3, 1));
            rentWeek1.setEndDate(LocalDate.of(2025, 3, 7));
            rentWeek1.setCategoryName("Rent");
            rentWeek1.setSubBudgetId(3L);
            rentWeek1.setId(15L);
            rentWeek1.setBudgetedAmount(1200.0);
            rentWeek1.setBudgetActual(1200.0);
            week10BudgetCategories.add(rentWeek1);
            return week10BudgetCategories;
        }
        if(weekNumber == 12)
        {
            List<BudgetCategory> week12BudgetCategories = new ArrayList<>();
            BudgetCategory week3Gas = new BudgetCategory();
            week3Gas.setStartDate(LocalDate.of(2025, 3, 17));
            week3Gas.setEndDate(LocalDate.of(2025, 3, 23));
            week3Gas.setCategoryName("Gas");
            week3Gas.setSubBudgetId(3L);
            week3Gas.setId(14L);
            week3Gas.setBudgetedAmount(40.23);
            week3Gas.setBudgetActual(35.45);
            week12BudgetCategories.add(week3Gas);

            BudgetCategory rentWeek3 = new BudgetCategory();
            rentWeek3.setStartDate(LocalDate.of(2025, 3, 17));
            rentWeek3.setEndDate(LocalDate.of(2025, 3, 23));
            rentWeek3.setCategoryName("Rent");
            rentWeek3.setSubBudgetId(3L);
            rentWeek3.setId(16L);
            rentWeek3.setBudgetedAmount(707.0);
            rentWeek3.setBudgetActual(707.0);
            week12BudgetCategories.add(rentWeek3);
            return week12BudgetCategories;
        }
        return new ArrayList<>();
    }

    private List<BudgetCategory> createBudgetCategories(){
        List<BudgetCategory> budgetCategories = new ArrayList<>();
        BudgetCategory week1Gas = new BudgetCategory();
        week1Gas.setStartDate(LocalDate.of(2025, 3, 1));
        week1Gas.setEndDate(LocalDate.of(2025, 3, 7));
        week1Gas.setCategoryName("Gas");
        week1Gas.setSubBudgetId(3L);
        week1Gas.setId(13L);
        week1Gas.setBudgetedAmount(40.23);
        week1Gas.setBudgetActual(23.45);

        BudgetCategory week3Gas = new BudgetCategory();
        week3Gas.setStartDate(LocalDate.of(2025, 3, 17));
        week3Gas.setEndDate(LocalDate.of(2025, 3, 23));
        week3Gas.setCategoryName("Gas");
        week3Gas.setSubBudgetId(3L);
        week3Gas.setId(14L);
        week3Gas.setBudgetedAmount(40.23);
        week3Gas.setBudgetActual(35.45);

        BudgetCategory rentWeek1 = new BudgetCategory();
        rentWeek1.setStartDate(LocalDate.of(2025, 3, 1));
        rentWeek1.setEndDate(LocalDate.of(2025, 3, 7));
        rentWeek1.setCategoryName("Rent");
        rentWeek1.setSubBudgetId(3L);
        rentWeek1.setId(15L);
        rentWeek1.setBudgetedAmount(1200.0);
        rentWeek1.setBudgetActual(1200.0);

        BudgetCategory rentWeek3 = new BudgetCategory();
        rentWeek3.setStartDate(LocalDate.of(2025, 3, 17));
        rentWeek3.setEndDate(LocalDate.of(2025, 3, 23));
        rentWeek3.setCategoryName("Rent");
        rentWeek3.setSubBudgetId(3L);
        rentWeek3.setId(16L);
        rentWeek3.setBudgetedAmount(707.0);
        rentWeek3.setBudgetActual(707.0);
        budgetCategories.add(week1Gas);
        budgetCategories.add(week3Gas);
        budgetCategories.add(rentWeek1);
        budgetCategories.add(rentWeek3);
        return budgetCategories;
    }

    @AfterEach
    void tearDown() {
    }
}