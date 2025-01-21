package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.services.BudgetScheduleService;
import com.app.budgetbuddy.services.BudgetService;
import com.app.budgetbuddy.workbench.budget.BudgetCalculations;
import com.app.budgetbuddy.workbench.budget.BudgetPeriodQueries;
import com.app.budgetbuddy.workbench.budget.BudgetQueriesService;
import com.app.budgetbuddy.workbench.budget.BudgetScheduleEngine;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@Slf4j
class BudgetRunnerTest {

    @Mock
    private BudgetPeriodQueries budgetPeriodQueries;

    @Mock
    private BudgetQueriesService budgetQueriesService;

    @Mock
    private BudgetCalculations budgetCalculations;

    @Mock
    private BudgetScheduleService budgetScheduleService;

    @Mock
    private BudgetService budgetService;

    @Mock
    private BudgetScheduleEngine budgetScheduleEngine;

    @InjectMocks
    private BudgetRunner budgetRunner;

    private Budget testBudget;

    @BeforeEach
    void setUp() {
        testBudget = new Budget();
        testBudget.setId(1L);
        testBudget.setActual(new BigDecimal("1630"));
        testBudget.setBudgetAmount(new BigDecimal("3260"));
        testBudget.setBudgetDescription("Savings Budget");
        testBudget.setBudgetName("Savings Budget");
        budgetRunner = new BudgetRunner(budgetPeriodQueries, budgetQueriesService, budgetCalculations, budgetScheduleService, budgetScheduleEngine, budgetService);
    }


    @Test
    void testLoadMonthlyBudgetStatistics_whenValidDatesAndUserId_thenReturnBudgetStats() {
        // Arrange
        LocalDate startDate = LocalDate.of(2024, 1, 1);
        LocalDate endDate = LocalDate.of(2024, 1, 31);
        DateRange monthRange = new DateRange(startDate, endDate);
        BigDecimal healthScore = new BigDecimal("85.00");
        BudgetStats expectedBudgetStats = new BudgetStats(
                1L,                           // budgetId
                new BigDecimal("3000.00"),    // totalBudget
                new BigDecimal("2500.00"),    // totalSpent
                new BigDecimal("500.00"),     // remaining
                new BigDecimal("300.00"),     // totalSaved
                healthScore,
                new BigDecimal("80.65"),      // averageSpendingPerDay
                monthRange
        );

        // Mock service calls
        when(budgetQueriesService.getTotalBudgeted(
                testBudget.getId(),
                testBudget.getUserId(),
                startDate,
                endDate
        )).thenReturn(new BigDecimal("3000.00"));

        when(budgetQueriesService.getTotalSpentOnBudget(
                testBudget.getId(),
                startDate,
                endDate
        )).thenReturn(new BigDecimal("2500.00"));

        when(budgetCalculations.calculateAverageSpendingPerDayOnBudget(
                any(BigDecimal.class),
                any(BigDecimal.class),
                any(BudgetPeriod.class)
        )).thenReturn(new BigDecimal("80.65"));

        when(budgetCalculations.calculateTotalSavedInBudget(testBudget, new BigDecimal("2500.00"), monthRange)).thenReturn(new BigDecimal("300.00"));

        // Act
        BudgetStats actualBudgetStats = budgetRunner.loadMonthlyBudgetStatistics(monthRange, testBudget, healthScore);

        // Assert
        assertNotNull(actualBudgetStats);

        log.info("Testing budget stats for period: {} to {}",
                expectedBudgetStats.getDateRange().getStartDate(),
                expectedBudgetStats.getDateRange().getEndDate());

        assertEquals(expectedBudgetStats.getBudgetId(), actualBudgetStats.getBudgetId(),
                "Budget ID mismatch");

        assertEquals(expectedBudgetStats.getTotalBudget(), actualBudgetStats.getTotalBudget(),
                "Total budget mismatch: expected " + expectedBudgetStats.getTotalBudget() +
                        " but was " + actualBudgetStats.getTotalBudget());

        assertEquals(expectedBudgetStats.getTotalSpent(), actualBudgetStats.getTotalSpent(),
                "Total spent mismatch: expected " + expectedBudgetStats.getTotalSpent() +
                        " but was " + actualBudgetStats.getTotalSpent());

        assertEquals(expectedBudgetStats.getRemaining(), actualBudgetStats.getRemaining(),
                "Remaining mismatch: expected " + expectedBudgetStats.getRemaining() +
                        " but was " + actualBudgetStats.getRemaining());

        assertEquals(expectedBudgetStats.getTotalSaved(), actualBudgetStats.getTotalSaved(),
                "Total saved mismatch: expected " + expectedBudgetStats.getTotalSaved() +
                        " but was " + actualBudgetStats.getTotalSaved());

        assertEquals(expectedBudgetStats.getAverageSpendingPerDay(), actualBudgetStats.getAverageSpendingPerDay(),
                "Average spending per day mismatch: expected " + expectedBudgetStats.getAverageSpendingPerDay() +
                        " but was " + actualBudgetStats.getAverageSpendingPerDay());

        assertEquals(expectedBudgetStats.getDateRange(), actualBudgetStats.getDateRange(),
                "Date range mismatch: expected " + expectedBudgetStats.getDateRange() +
                        " but was " + actualBudgetStats.getDateRange());

        // Verify service calls
        verify(budgetQueriesService).getTotalBudgeted(
                testBudget.getId(), testBudget.getUserId(), startDate, endDate);
        verify(budgetQueriesService).getTotalSpentOnBudget(
                testBudget.getId(), startDate, endDate);
        verify(budgetCalculations).calculateAverageSpendingPerDayOnBudget(
                any(BigDecimal.class), any(BigDecimal.class), any(BudgetPeriod.class));
    }

    @Test
    void testCalculateBudgetHealthScore_whenBudgetIsNull_thenReturnZero(){
        LocalDate startDate = LocalDate.of(2024, 1, 1);
        LocalDate endDate = LocalDate.of(2024, 1, 31);

        BigDecimal actual = budgetRunner.calculateBudgetHealthScore(null, startDate, endDate);
        assertEquals(0, actual.intValue());
    }

    @Test
    void testCalculateBudgetHealthScore_whenStartDateIsNull_thenReturnZero(){
        Budget budget = new Budget();
        LocalDate endDate = LocalDate.of(2024, 1, 31);
        BigDecimal actual = budgetRunner.calculateBudgetHealthScore(budget, null, endDate);
        assertEquals(0, actual.intValue());
    }

    @Test
    void testCalculateBudgetHealthScore_whenEndDateIsNull_thenReturnZero(){
        Budget budget = new Budget();
        LocalDate startDate = LocalDate.of(2024, 1, 31);
        BigDecimal actual = budgetRunner.calculateBudgetHealthScore(budget, startDate, null);
        assertEquals(0, actual.intValue());
    }

    @Test
    void testCalculateBudgetHealthScore_whenBudgetValidAndDatesValid_thenReturnBudgetHealthScore(){
        Budget budget = new Budget();
        budget.setUserId(1L);
        budget.setId(1L);
        budget.setBudgetAmount(new BigDecimal("3260"));
        budget.setActual(new BigDecimal("1020"));
        budget.setBudgetName("Test Budget");

        LocalDate startDate = LocalDate.of(2025, 1, 1);
        LocalDate endDate = LocalDate.of(2025, 1, 31);

        Mockito.when(budgetQueriesService.getTotalBudgeted(1L, 1L, LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)))
                .thenReturn(new BigDecimal("3260"));

        Mockito.when(budgetQueriesService.getTotalSpentOnBudget(1L, LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)))
                .thenReturn(new BigDecimal("1020"));

        BigDecimal expectedBudgetHealthScore = new BigDecimal("31.00");
        BigDecimal actual = budgetRunner.calculateBudgetHealthScore(budget, startDate, endDate);
        assertEquals(expectedBudgetHealthScore, actual);
    }

    @Test
    void testGetWeeklyBudgetPeriodCategories_whenBudgetIsNull_thenReturnEmptyList(){
        WeeklyBudgetSchedule weeklyBudgetSchedule = new WeeklyBudgetSchedule();
        List<BudgetPeriodCategory> actual = budgetRunner.getWeeklyBudgetPeriodCategories(null, weeklyBudgetSchedule);
        assertEquals(0, actual.size());
    }

    @Test
    void testGetWeeklyBudgetPeriodCategories_whenWeeklyBudgetScheduleIsNull_thenReturnEmptyList(){
        Budget budget = new Budget();
        List<BudgetPeriodCategory> actual = budgetRunner.getWeeklyBudgetPeriodCategories(budget, null);
        assertEquals(0, actual.size());
    }

    @Test
    void testGetWeeklyBudgetPeriodCategories_whenWeeklyRangesIsNull_thenReturnEmptyList()
    {
        WeeklyBudgetSchedule weeklyBudgetSchedule = new WeeklyBudgetSchedule();
        weeklyBudgetSchedule.setWeeklyDateRanges(null);

        List<BudgetPeriodCategory> actual = budgetRunner.getWeeklyBudgetPeriodCategories(testBudget, weeklyBudgetSchedule);
        assertEquals(0, actual.size());
    }

    @Test
    void testGetWeeklyBudgetPeriodCategories_whenWeeklyRangesIsEmpty_thenReturnEmptyList(){
        WeeklyBudgetSchedule weeklyBudgetSchedule = new WeeklyBudgetSchedule();
        weeklyBudgetSchedule.setWeeklyDateRanges(List.of());

        List<BudgetPeriodCategory> actual = budgetRunner.getWeeklyBudgetPeriodCategories(testBudget, weeklyBudgetSchedule);
        assertEquals(0, actual.size());
    }

    @Test
    void testGetWeeklyBudgetPeriodCategories_whenWeeklyBudgetScheduleValidAndBudgetValid_thenReturnBudgetPeriodCategories(){
        WeeklyBudgetSchedule weeklyBudgetSchedule = new WeeklyBudgetSchedule(
                1L, // budgetScheduleId
                1L, // budgetId
                LocalDate.of(2025, 1, 1), // startDate
                LocalDate.of(2025, 1, 31), // endDate
                Period.WEEKLY, // period
                4, // totalPeriods
                "ACTIVE" // status
        );

        // Mock the weekly date ranges
        List<DateRange> weeklyDateRanges = List.of(
                new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7)),
                new DateRange(LocalDate.of(2025, 1, 8), LocalDate.of(2025, 1, 14)),
                new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 21)),
                new DateRange(LocalDate.of(2025, 1, 22), LocalDate.of(2025, 1, 31))
        );
        weeklyBudgetSchedule.setWeeklyDateRanges(weeklyDateRanges);

        // Mock the query service to return categories for each weekly range
        Mockito.when(budgetPeriodQueries.getWeeklyBudgetPeriodCategories(
                        Mockito.eq(weeklyDateRanges), Mockito.eq(testBudget)))
                .thenReturn(List.of(
                        new BudgetPeriodCategory("Groceries", new BigDecimal("500"), new BigDecimal("450"), weeklyDateRanges.get(0), BudgetStatus.GOOD),
                        new BudgetPeriodCategory("Rent", new BigDecimal("1000"), new BigDecimal("1000"), weeklyDateRanges.get(1), BudgetStatus.GOOD),
                        new BudgetPeriodCategory("Utilities", new BigDecimal("300"), new BigDecimal("200"), weeklyDateRanges.get(2), BudgetStatus.GOOD),
                        new BudgetPeriodCategory("Entertainment", new BigDecimal("200"), new BigDecimal("150"), weeklyDateRanges.get(3), BudgetStatus.GOOD)
                ));

        // Act
        List<BudgetPeriodCategory> result = budgetRunner.getWeeklyBudgetPeriodCategories(testBudget, weeklyBudgetSchedule);

        // Assert
        assertNotNull(result, "The result should not be null");
        assertEquals(4, result.size(), "The size of the result list should match the number of weekly ranges");

        // Validate the categories
        assertEquals("Groceries", result.get(0).getCategory());
        assertEquals(new BigDecimal("500"), result.get(0).getBudgeted());
        assertEquals(new BigDecimal("450"), result.get(0).getActual());
        assertEquals(weeklyDateRanges.get(0), result.get(0).getDateRange());

        assertEquals("Rent", result.get(1).getCategory());
        assertEquals(new BigDecimal("1000"), result.get(1).getBudgeted());
        assertEquals(new BigDecimal("1000"), result.get(1).getActual());
        assertEquals(weeklyDateRanges.get(1), result.get(1).getDateRange());

        assertEquals("Utilities", result.get(2).getCategory());
        assertEquals(new BigDecimal("300"), result.get(2).getBudgeted());
        assertEquals(new BigDecimal("200"), result.get(2).getActual());
        assertEquals(weeklyDateRanges.get(2), result.get(2).getDateRange());

        assertEquals("Entertainment", result.get(3).getCategory());
        assertEquals(new BigDecimal("200"), result.get(3).getBudgeted());
        assertEquals(new BigDecimal("150"), result.get(3).getActual());
        assertEquals(weeklyDateRanges.get(3), result.get(3).getDateRange());
    }


    @Test
    void testLoadPeriodCategories_whenBudgetAndBudgetScheduleValid_thenReturnBudgetPeriodCategory(){
        Budget budget = createTestBudget(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31), 1L);
        List<BudgetPeriodCategory> expectedBudgetPeriodCategories = new ArrayList<>();
        BudgetPeriodCategory expectedBudgetPeriodCategory = new BudgetPeriodCategory();
        expectedBudgetPeriodCategory.setBudgeted(new BigDecimal("450"));
        expectedBudgetPeriodCategory.setCategory("Groceries");
        expectedBudgetPeriodCategory.setBudgetStatus(BudgetStatus.GOOD);
        expectedBudgetPeriodCategory.setOverBudget(false);
        expectedBudgetPeriodCategory.setActual(new BigDecimal("120"));
        expectedBudgetPeriodCategory.setRemaining(new BigDecimal("330"));
        expectedBudgetPeriodCategory.setDateRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 16)));
        expectedBudgetPeriodCategories.add(expectedBudgetPeriodCategory);

        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setStartDate(LocalDate.of(2025, 1, 1));
        budgetSchedule.setEndDate(LocalDate.of(2025, 1, 31));
        budgetSchedule.setTotalPeriods(4);
        budgetSchedule.setStatus("Active");
        budgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        budgetSchedule.setPeriod(Period.MONTHLY);
        budgetSchedule.initializeBudgetDateRanges();

        Mockito.when(budgetPeriodQueries.getMonthlyBudgetPeriodCategories(
                        budgetSchedule.getScheduleRange(), budget))
                .thenReturn(expectedBudgetPeriodCategories);

        List<BudgetPeriodCategory> actual = budgetRunner.loadPeriodCategories(budget, budgetSchedule);
        assertNotNull(actual);
        assertEquals(expectedBudgetPeriodCategories.size(), actual.size());
        for (int i = 0; i < actual.size(); i++)
        {
            BudgetPeriodCategory expected = expectedBudgetPeriodCategories.get(i);
            BudgetPeriodCategory actualBudgetPeriodCategory = actual.get(i);

            assertEquals(expected.getCategory(), actualBudgetPeriodCategory.getCategory());
            assertEquals(expected.getBudgeted(), actualBudgetPeriodCategory.getBudgeted());
            assertEquals(expected.getActual(), actualBudgetPeriodCategory.getActual());
            assertEquals(expected.getRemaining(), actualBudgetPeriodCategory.getRemaining());
            assertEquals(expected.getDateRange(), actualBudgetPeriodCategory.getDateRange());
        }
    }

    @Test
    void testProcessBudget_whenBudgetAndScheduleAreValid_thenReturnResult() throws Exception {
        // Arrange
        Budget budget = createTestBudget(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31), 1L);
        BudgetSchedule budgetSchedule = createTestBudgetSchedule();
        LocalDate startDate = budgetSchedule.getStartDate();
        LocalDate endDate = budgetSchedule.getEndDate();

        BigDecimal healthScore = new BigDecimal("85");
        BudgetStats budgetStats = new BudgetStats(
                1L, new BigDecimal("5000.0"), new BigDecimal("85"),
                new BigDecimal("4915"), new BigDecimal("4915"),
                new BigDecimal("85.00"),
                healthScore,
                new DateRange(startDate, endDate)
        );
        List<Category> topExpenses = List.of(new Category("Groceries", BigDecimal.ZERO, startDate, endDate, BigDecimal.ZERO, true));
        List<Category> expenseCategories = List.of(new Category("Utilities", BigDecimal.ZERO, startDate, endDate, BigDecimal.ZERO, true));
        List<Category> savingsCategories = List.of(new Category("Savings", BigDecimal.ZERO, startDate, endDate, BigDecimal.ZERO, true));
        List<Category> incomeCategories = List.of(new Category("Salary", BigDecimal.ZERO, startDate, endDate, BigDecimal.ZERO, true));

        BudgetPeriodCategory periodCategory = new BudgetPeriodCategory(
                "Groceries",
                new BigDecimal("500"),
                new BigDecimal("400"),
                new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 15)),
                BudgetStatus.GOOD
        );
        List<BudgetPeriodCategory> periodCategories = List.of(periodCategory);

        // Mocking budgetQueriesService for calculateBudgetHealthScore and loadMonthlyBudgetStatistics
        Mockito.when(budgetQueriesService.getTotalBudgeted(1L, 1L, startDate, endDate)).thenReturn(new BigDecimal("5000.0"));
        Mockito.when(budgetQueriesService.getTotalSpentOnBudget(1L, startDate, endDate)).thenReturn(new BigDecimal("85.00"));
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY,startDate, endDate);
        DateRange dateRange = new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31));
        when(budgetRunner.loadMonthlyBudgetStatistics(dateRange, budget, healthScore)).thenReturn(budgetStats);
// Then mock with specific values
        BigDecimal budgeted = new BigDecimal("5000.0");
        BigDecimal actual = new BigDecimal("85.00");

        Mockito.when(budgetCalculations.calculateTotalSavedInBudget(budget, new BigDecimal("85"), new DateRange(startDate, endDate)))
                        .thenReturn(new BigDecimal("4915"));

        Mockito.when(budgetRunner.calculateBudgetHealthScore(budget, startDate, endDate)).thenReturn(healthScore);
        Mockito.doReturn(new BigDecimal("85.00"))
                .when(budgetCalculations)
                .calculateAverageSpendingPerDayOnBudget(
                        eq(budgeted),
                        eq(actual),
                        any(BudgetPeriod.class)
                );


        Mockito.when(budgetRunner.loadTopExpenseCategories(budget, startDate, endDate)).thenReturn(topExpenses);
        Mockito.when(budgetRunner.loadExpenseCategory(budget.getId(), startDate, endDate, Period.MONTHLY)).thenReturn(expenseCategories);
        Mockito.when(budgetRunner.loadPeriodCategories(budget, budgetSchedule)).thenReturn(periodCategories);
        Mockito.when(budgetRunner.loadSavingsCategory(budget.getId(), startDate, endDate, Period.MONTHLY)).thenReturn(savingsCategories);
        Mockito.when(budgetRunner.loadIncomeCategory(budget.getBudgetAmount(), budget.getId(), startDate, endDate)).thenReturn(incomeCategories);

        // Act
        BudgetRunnerResult result = budgetRunner.processBudget(budget, budgetSchedule, startDate, endDate);

        // Assert
        assertNotNull(result);
        assertEquals(budget, result.getBudget());
        assertEquals(budgetSchedule, result.getBudgetSchedule());
        assertEquals(budgetStats, result.getBudgetStats());
        assertEquals(topExpenses, result.getBudgetCategoryStats().getTopExpenseCategories());
        assertEquals(expenseCategories, result.getBudgetCategoryStats().getExpenseCategories());
        assertEquals(savingsCategories, result.getBudgetCategoryStats().getSavingsCategories());
        assertEquals(incomeCategories, result.getBudgetCategoryStats().getIncomeCategories());

        verify(budgetCalculations).calculateAverageSpendingPerDayOnBudget(
                any(BigDecimal.class),
                any(BigDecimal.class),
                any(BudgetPeriod.class)
        );
    }

    @Test
    void testCreateBudgetAndScheduleForPeriod_whenStartMonthIsNull_thenReturnEmptyOptional(){
        Long userId = 1L;
        LocalDate endMonth = LocalDate.of(2025, 1, 31);
        Optional<Budget> actual = budgetRunner.createBudgetAndScheduleForPeriod(userId, null, endMonth);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateBudgetAndScheduleForPeriod_whenEndMonthIsNull_thenReturnEmptyOptional(){
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2025, 1, 31);
        Optional<Budget> actual = budgetRunner.createBudgetAndScheduleForPeriod(userId, startDate, null);
    }

    @Test
    void testCreateBudgetAndScheduleForPeriod_whenUserIdNegative_thenThrowException(){
        Long userId = -1L;
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        LocalDate endDate = LocalDate.of(2025, 1, 31);
        Optional<Budget> actual = budgetRunner.createBudgetAndScheduleForPeriod(userId, startDate, endDate);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateBudgetAndScheduleForPeriod_whenJanuary_AndNoBudgetFound_thenReturnCreateBudget(){
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        LocalDate endDate = LocalDate.of(2025, 1, 31);

        Budget budget = new Budget();
        budget.setId(1L);
        budget.setBudgetAmount(new BigDecimal("5000.0"));
        budget.setBudgetMonth(LocalDate.of(2025, 1, 1));
        budget.setBudgetYear(2025);
        budget.setBudgetName("Test Budget");
        budget.setBudgetDescription("Test Budget Description");
        budget.setUserId(1L);

        BudgetSchedule januarySchedule = new BudgetSchedule();
        januarySchedule.setScheduleRange(new DateRange(startDate, endDate));
        januarySchedule.setStartDate(startDate);
        januarySchedule.setEndDate(endDate);
        januarySchedule.setTotalPeriods(4);
        januarySchedule.setStatus("Active");
        januarySchedule.setPeriod(Period.MONTHLY);
        januarySchedule.initializeBudgetDateRanges();
        budget.setBudgetSchedules(List.of(januarySchedule));

        Optional<Budget> expectedBudgetOptional = Optional.of(budget);

        Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(null);

        Optional<Budget> actual = budgetRunner.createBudgetAndScheduleForPeriod(userId, startDate, endDate);
        assertNotNull(actual);
        assertEquals(expectedBudgetOptional, actual);
        assertEquals(expectedBudgetOptional.get().getBudgetSchedules().size(), actual.get().getBudgetSchedules().size());
        assertEquals(expectedBudgetOptional.get().getBudgetName(), actual.get().getBudgetName());
    }


    private BudgetSchedule createTestBudgetSchedule() {
        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setBudgetScheduleId(1L);
        budgetSchedule.setBudgetId(1L);
        budgetSchedule.setStartDate(LocalDate.of(2025, 1, 1));
        budgetSchedule.setEndDate(LocalDate.of(2025, 1, 31));
        budgetSchedule.setPeriod(Period.MONTHLY);
        budgetSchedule.setStatus("ACTIVE");
        return budgetSchedule;
    }

    private Budget createTestBudget(LocalDate startDate, LocalDate endDate, Long budgetId) {
        Budget budget = new Budget();
        budget.setId(budgetId);
        budget.setBudgetAmount(new BigDecimal("3000.00"));
        budget.setBudgetName("Test Budget");
        budget.setBudgetDescription("Test Budget Description");
        budget.setUserId(1L);
        budget.setActual(new BigDecimal("1020"));

        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setBudgetId(budget.getId());
        budgetSchedule.setStartDate(startDate);
        budgetSchedule.setEndDate(endDate);
        budgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
        budgetSchedule.setTotalPeriods(4);
        budgetSchedule.setStatus("Active");
        budgetSchedule.setPeriod(Period.MONTHLY);

        budget.setBudgetSchedules(List.of(budgetSchedule));
        return budget;
    }

    private List<Object[]> mockBudgetStatsResults(List<BudgetStats> expectedStats) {
        return expectedStats.stream()
                .map(stat -> new Object[] {
                        stat.getBudgetId(),
                        stat.getTotalBudget().doubleValue(),
                        stat.getTotalSpent().doubleValue(),
                        stat.getRemaining().doubleValue(),
                        stat.getTotalSaved().doubleValue(),
                        stat.getAverageSpendingPerDay().doubleValue(),
                        stat.getDateRange().getStartDate(),
                        stat.getDateRange().getEndDate()
                })
                .collect(Collectors.toList());
    }

    @AfterEach
    void tearDown() {
    }
}