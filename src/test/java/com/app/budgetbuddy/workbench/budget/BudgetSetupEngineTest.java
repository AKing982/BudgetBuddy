package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.subBudget.SubBudgetBuilderService;
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
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BudgetSetupEngineTest
{
    @Mock
    private BudgetBuilderService budgetBuilderService;

    @Mock
    private SubBudgetBuilderService subBudgetBuilderService;

    @Mock
    private SubBudgetOverviewService subBudgetOverviewService;

    @Mock
    private BudgetHealthService<SubBudget> budgetHealthService;

    @Mock
    private AbstractBudgetStatisticsService<SubBudget> abstractBudgetStatisticsService;

    @Mock
    private MonthlyBudgetGoalsBuilder monthlyBudgetGoalsBuilder;

    @Mock
    private AbstractBudgetStatisticsService<SubBudget> subBudgetStatisticsService;

    @InjectMocks
    private BudgetSetupEngine budgetSetupEngine;

    private Budget budget;

    private BudgetRegistration budgetRegistration;

    private BudgetGoals budgetGoals;

    private List<SubBudget> subBudgets = new ArrayList<>();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.initMocks(this);

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

        budgetGoals = BudgetGoals.builder()
                .budgetId(1L)
                .goalType("Saving Money to Savings")
                .currentSavings(69.00)
                .monthlyAllocation(250)
                .targetAmount(4500)
                .status("Active")
                .savingsFrequency("Monthly")
                .build();

        BigDecimal monthlyAllocation = BigDecimal.valueOf(3250); // 39000 / 12
        BigDecimal monthlySavingsTarget = BigDecimal.valueOf(375); // 4500 / 12

        for (int month = 1; month <= 12; month++) {
            LocalDate startDate = LocalDate.of(2025, month, 1);
            LocalDate endDate = startDate.plusMonths(1).minusDays(1);

            SubBudget monthlyBudget = SubBudget.buildSubBudget(
                    true, // isActive
                    monthlyAllocation, // allocatedAmount
                    monthlySavingsTarget, // savingsTarget
                    BigDecimal.ZERO, // initial savingsAmount
                    budget, // parent budget
                    BigDecimal.ZERO, // initial spentOnBudget
                    "Budget " + month + " of 2025", // budgetName
                    startDate,
                    endDate
            );

            subBudgets.add(monthlyBudget);
        }
        budget.setSubBudgets(subBudgets);
        budgetRegistration = BudgetRegistration.builder()
                .budgetYear(2025)
                .userId(1L)
                .numberOfMonths(12)
                .totalBudgetsNeeded(12)
                .totalIncomeAmount(BigDecimal.valueOf(39000))
                .budgetName("2025 Savings Budget Plan")
                .budgetMode(BudgetMode.SAVINGS_PLAN)
                .budgetStartDate(LocalDate.of(2025, 1, 1))
                .budgetEndDate(LocalDate.of(2025,1, 31))
                .budgetPeriod(Period.MONTHLY)
                .budgetGoals(budgetGoals)
                .build();

        budgetSetupEngine = new BudgetSetupEngine(budgetBuilderService, subBudgetBuilderService, monthlyBudgetGoalsBuilder, abstractBudgetStatisticsService);
    }

    @Test
    void testCreateNewBudget_whenUserIsInvalid_thenReturnEmptyOptional()
    {
        Optional<Budget> actual = budgetSetupEngine.createNewBudget(null);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateNewBudget_shouldReturnValidBudget()
    {
        Optional<Budget> expected = Optional.of(budget);
        Mockito.when(budgetBuilderService.buildBudgetFromRegistration(budgetRegistration)).thenReturn(expected);

        Optional<Budget> actual = budgetSetupEngine.createNewBudget(budgetRegistration);
        assertNotNull(actual);

        Budget expectedBudget = expected.get();
        Budget actualBudget = actual.get();
        assertEquals(expectedBudget.getBudgetName(), actualBudget.getBudgetName());
        assertEquals(expectedBudget.getBudgetMode(), actualBudget.getBudgetMode());
        assertEquals(expectedBudget.getBudgetPeriod(), actualBudget.getBudgetPeriod());
        assertEquals(expectedBudget.getStartDate(), actualBudget.getStartDate());
        assertEquals(expectedBudget.getEndDate(), actualBudget.getEndDate());
        assertEquals(expectedBudget.getBudgetAmount(), actualBudget.getBudgetAmount());
        assertEquals(expectedBudget.getUserId(), actualBudget.getUserId());
        assertEquals(expectedBudget.getSavingsProgress(), actualBudget.getSavingsProgress());
        assertEquals(expectedBudget.getTotalMonthsToSave(), actualBudget.getTotalMonthsToSave());
        assertEquals(expectedBudget.getIncome(), actualBudget.getIncome());
        assertEquals(expectedBudget.getId(), actualBudget.getId());
        assertEquals(expectedBudget.getSubBudgets(), actualBudget.getSubBudgets());
        assertEquals(expectedBudget.getActual(), actualBudget.getActual());
        assertEquals(expectedBudget.getSavingsAmountAllocated(), actualBudget.getSavingsAmountAllocated());
    }

    @Test
    void testCreateNewSubBudgetsForUser_whenBudgetIdInvalid_thenReturnEmptyList()
    {
        List<SubBudget> actual = budgetSetupEngine.createNewMonthlySubBudgetsForUser(null, budgetGoals);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateNewSubBudgetsForUser_whenBudgetValid_thenReturnSubBudgets()
    {
        List<SubBudget> expected = subBudgets;
        Mockito.when(subBudgetBuilderService.createMonthlySubBudgets(budget, budgetGoals)).thenReturn(expected);

        List<SubBudget> actual = budgetSetupEngine.createNewMonthlySubBudgetsForUser(budget, budgetGoals);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());

        for (int i = 0; i < expected.size(); i++) {
            SubBudget expectedBudget = expected.get(i);
            SubBudget actualBudget = actual.get(i);

            assertEquals(expectedBudget.getId(), actualBudget.getId());
            assertEquals(expectedBudget.getSubBudgetName(), actualBudget.getSubBudgetName());
            assertEquals(expectedBudget.getAllocatedAmount(), actualBudget.getAllocatedAmount());
            assertEquals(expectedBudget.getSubSavingsTarget(), actualBudget.getSubSavingsTarget());
            assertEquals(expectedBudget.getSubSavingsAmount(), actualBudget.getSubSavingsAmount());
            assertEquals(expectedBudget.getSpentOnBudget(), actualBudget.getSpentOnBudget());
            assertEquals(expectedBudget.getStartDate(), actualBudget.getStartDate());
            assertEquals(expectedBudget.getEndDate(), actualBudget.getEndDate());
            assertEquals(expectedBudget.isActive(), actualBudget.isActive());
        }

        verify(subBudgetBuilderService).createMonthlySubBudgets(budget, budgetGoals);
    }



    @Test
    void testCreateMonthlyBudgetGoalsForSubBudgets_whenBudgetGoalsNull_thenReturnEmptyList()
    {
        List<SubBudget> subBudgetList = new ArrayList<>();
        subBudgetList.add(new SubBudget());
        List<MonthlyBudgetGoals> actual = budgetSetupEngine.createMonthlyBudgetGoalsForSubBudgets(null, subBudgetList);
        assertEquals(0, actual.size());
    }

    @Test
    void testCreateMonthlyBudgetGoalsForSubBudgets_whenSubBudgetsListNull_thenReturnEmptyList(){
        BudgetGoals budgetGoals1 = budgetGoals;
        List<MonthlyBudgetGoals> actual = budgetSetupEngine.createMonthlyBudgetGoalsForSubBudgets(budgetGoals1, null);
        assertEquals(0, actual.size());
    }

    @Test
    void testCreateMonthlyBudgetGoalsForSubBudgets_whenSubBudgetsListEmpty_thenReturnEmptyList(){
        List<SubBudget> subBudgetList = new ArrayList<>();
        List<MonthlyBudgetGoals> actual = budgetSetupEngine.createMonthlyBudgetGoalsForSubBudgets(budgetGoals, subBudgetList);
        assertEquals(0, actual.size());
    }

    @Test
    void testCreateMonthlyBudgetGoalsForSubBudgets_shouldReturnMonthlyBudgetGoals()
    {
        List<MonthlyBudgetGoals> expectedMonthlyBudgetGoals = new ArrayList<>();

        // Setup test data
        BudgetGoals budgetGoals = BudgetGoals.builder()
                .budgetId(1L)
                .targetAmount(4500)
                .monthlyAllocation(375)
                .currentSavings(0)
                .goalType("Savings Goal")
                .savingsFrequency("Monthly")
                .status("Active")
                .build();

        // Create expected MonthlyBudgetGoals for each SubBudget
        for (int i = 0; i < subBudgets.size(); i++) {
            SubBudget subBudget = subBudgets.get(i);

            MonthlyBudgetGoals monthlyGoal = new MonthlyBudgetGoals(
                    (long) (i + 1),                   // id
                    subBudget.getId(),                // subBudgetId
                    budgetGoals.getBudgetId(),        // budgetGoalId
                    BigDecimal.valueOf(375),          // monthlySavingsTarget
                    BigDecimal.ZERO,                  // monthlyContributed
                    BigDecimal.valueOf(100),          // goalScore (100 as starting score)
                    BigDecimal.valueOf(375),          // remainingAmount
                    "NOT_STARTED"                     // monthlyStatus
            );

            expectedMonthlyBudgetGoals.add(monthlyGoal);

            // Setup mock for MonthlyBudgetGoalsBuilder
            when(monthlyBudgetGoalsBuilder.createBudgetGoal(eq(budgetGoals), anyLong()))
                    .thenReturn(Optional.of(monthlyGoal));
        }

        // Execute test
        List<MonthlyBudgetGoals> actualMonthlyBudgetGoals =
                budgetSetupEngine.createMonthlyBudgetGoalsForSubBudgets(budgetGoals, subBudgets);

        // Verify results
        assertNotNull(actualMonthlyBudgetGoals);
        assertEquals(expectedMonthlyBudgetGoals.size(), actualMonthlyBudgetGoals.size());

        // Verify each MonthlyBudgetGoals
        for (int i = 0; i < actualMonthlyBudgetGoals.size(); i++) {
            MonthlyBudgetGoals expected = expectedMonthlyBudgetGoals.get(i);
            MonthlyBudgetGoals actual = actualMonthlyBudgetGoals.get(i);

            assertEquals(expected.getId(), actual.getId());
            assertEquals(expected.getSubBudgetId(), actual.getSubBudgetId());
            assertEquals(expected.getBudgetGoalId(), actual.getBudgetGoalId());
            assertEquals(expected.getMonthlySavingsTarget(), actual.getMonthlySavingsTarget());
            assertEquals(expected.getMonthlyContributed(), actual.getMonthlyContributed());
            assertEquals(expected.getGoalScore(), actual.getGoalScore());
            assertEquals(expected.getRemainingAmount(), actual.getRemainingAmount());
            assertEquals(expected.getMonthlyStatus(), actual.getMonthlyStatus());
        }

        // Verify builder was called for each SubBudget
        verify(monthlyBudgetGoalsBuilder, times(subBudgets.size()))
                .createBudgetGoal(eq(budgetGoals), anyLong());
    }

    @Test
    void testCreateBudgetStatistics_whenSubBudgetsListNull_thenReturnEmptyList(){
        List<BudgetStats> actual = budgetSetupEngine.createBudgetStatistics(null);
        assertEquals(0, actual.size());
    }

    @Test
    void testCreateBudgetStatistics_shouldReturnBudgetStats()
    {
        List<BudgetStats> expectedBudgetStats = new ArrayList<>();
        // Create real SubBudgets for January, February, and March
        SubBudget januaryBudget = new SubBudget();
        januaryBudget.setId(101L);
        januaryBudget.setSubBudgetName("January 2023");
        januaryBudget.setId(1L);
        januaryBudget.setStartDate(LocalDate.of(2023, 1, 1));
        januaryBudget.setEndDate(LocalDate.of(2023, 1, 31));

        SubBudget februaryBudget = new SubBudget();
        februaryBudget.setId(102L);
        februaryBudget.setSubBudgetName("February 2023");
        februaryBudget.setId(2L);
        februaryBudget.setStartDate(LocalDate.of(2023, 2, 1));
        februaryBudget.setEndDate(LocalDate.of(2023, 2, 28));

        SubBudget marchBudget = new SubBudget();
        marchBudget.setId(103L);
        marchBudget.setSubBudgetName("March 2023");
        marchBudget.setId(3L);
        marchBudget.setStartDate(LocalDate.of(2023, 3, 1));
        marchBudget.setEndDate(LocalDate.of(2023, 3, 31));

        List<SubBudget> subBudgets = Arrays.asList(januaryBudget, februaryBudget, marchBudget);

        // Create BudgetStats with real date ranges
        DateRange januaryRange = new DateRange(
                LocalDate.of(2023, 1, 1),
                LocalDate.of(2023, 1, 31)
        );

        BudgetStats januaryStats = new BudgetStats(
                januaryBudget.getId(),
                new BigDecimal("1200.00"),   // totalBudget
                new BigDecimal("950.75"),    // totalSpent
                new BigDecimal("249.25"),    // remaining
                new BigDecimal("100.00"),    // totalSaved
                new BigDecimal("30.67"),     // averageSpendingPerDay
                new BigDecimal("85.5"),      // healthScore
                januaryRange
        );

        DateRange februaryRange = new DateRange(
                LocalDate.of(2023, 2, 1),
                LocalDate.of(2023, 2, 28)
        );

        BudgetStats februaryStats = new BudgetStats(
                februaryBudget.getId(),
                new BigDecimal("1200.00"),   // totalBudget
                new BigDecimal("1050.25"),   // totalSpent
                new BigDecimal("149.75"),    // remaining
                new BigDecimal("75.00"),     // totalSaved
                new BigDecimal("37.51"),     // averageSpendingPerDay
                new BigDecimal("79.2"),      // healthScore
                februaryRange
        );

        DateRange marchRange = new DateRange(
                LocalDate.of(2023, 3, 1),
                LocalDate.of(2023, 3, 31)
        );

        BudgetStats marchStats = new BudgetStats(
                marchBudget.getId(),
                new BigDecimal("1200.00"),   // totalBudget
                new BigDecimal("875.50"),    // totalSpent
                new BigDecimal("324.50"),    // remaining
                new BigDecimal("150.00"),    // totalSaved
                new BigDecimal("28.24"),     // averageSpendingPerDay
                new BigDecimal("92.7"),      // healthScore
                marchRange
        );

        // Set up expected results
        List<BudgetStats> januaryBudgetStats = Collections.singletonList(januaryStats);
        List<BudgetStats> februaryBudgetStats = Collections.singletonList(februaryStats);
        List<BudgetStats> marchBudgetStats = Collections.singletonList(marchStats);

        expectedBudgetStats.addAll(januaryBudgetStats);
        expectedBudgetStats.addAll(februaryBudgetStats);
        expectedBudgetStats.addAll(marchBudgetStats);

        // Mock the service behavior
        when(subBudgetStatisticsService.getBudgetStats(januaryBudget)).thenReturn(januaryBudgetStats);
        when(subBudgetStatisticsService.getBudgetStats(februaryBudget)).thenReturn(februaryBudgetStats);
        when(subBudgetStatisticsService.getBudgetStats(marchBudget)).thenReturn(marchBudgetStats);

        // Act
        List<BudgetStats> actualBudgetStats = budgetSetupEngine.createBudgetStatistics(subBudgets);

        // Assert
        assertNotNull(actualBudgetStats);
        assertEquals(expectedBudgetStats.size(), actualBudgetStats.size());

        // Verify the content of the first BudgetStats (January)
        assertEquals(januaryBudget.getId(), actualBudgetStats.get(0).getBudgetId());
        assertEquals(0, new BigDecimal("1200.00").compareTo(actualBudgetStats.get(0).getTotalBudget()));
        assertEquals(0, new BigDecimal("950.75").compareTo(actualBudgetStats.get(0).getTotalSpent()));
        assertEquals(LocalDate.of(2023, 1, 1), actualBudgetStats.get(0).getDateRange().getStartDate());
        assertEquals(LocalDate.of(2023, 1, 31), actualBudgetStats.get(0).getDateRange().getEndDate());

        // Verify the content of the second BudgetStats (February)
        assertEquals(februaryBudget.getId(), actualBudgetStats.get(1).getBudgetId());
        assertEquals(0, new BigDecimal("1200.00").compareTo(actualBudgetStats.get(1).getTotalBudget()));
        assertEquals(0, new BigDecimal("1050.25").compareTo(actualBudgetStats.get(1).getTotalSpent()));
        assertEquals(LocalDate.of(2023, 2, 1), actualBudgetStats.get(1).getDateRange().getStartDate());
        assertEquals(LocalDate.of(2023, 2, 28), actualBudgetStats.get(1).getDateRange().getEndDate());

        // Verify the content of the third BudgetStats (March)
        assertEquals(marchBudget.getId(), actualBudgetStats.get(2).getBudgetId());
        assertEquals(0, new BigDecimal("1200.00").compareTo(actualBudgetStats.get(2).getTotalBudget()));
        assertEquals(0, new BigDecimal("875.50").compareTo(actualBudgetStats.get(2).getTotalSpent()));
        assertEquals(LocalDate.of(2023, 3, 1), actualBudgetStats.get(2).getDateRange().getStartDate());
        assertEquals(LocalDate.of(2023, 3, 31), actualBudgetStats.get(2).getDateRange().getEndDate());

        // Verify that the service method was called for each subBudget
        verify(subBudgetStatisticsService).getBudgetStats(januaryBudget);
        verify(subBudgetStatisticsService).getBudgetStats(februaryBudget);
        verify(subBudgetStatisticsService).getBudgetStats(marchBudget);
    }

    @Test
    void testCreateBudgetStatistics_whenSubBudgetsInPreviousYear()
    {


    }

    @Test
    void testCreatePreviousYearBudget_whenYearIsNegative_thenReturnEmptyOptional(){
        BigDecimal previousIncomeAmount = new BigDecimal("39000");
        final String previousBudgetName = "2024 Budget Savings Plan";
        final Long userId = 1L;

        Budget currentYearBudget = budget;
        Budget previousYearBudget = new Budget();
        previousYearBudget.setStartDate(LocalDate.of(2024, 1, 1));
        previousYearBudget.setEndDate(LocalDate.of(2024, 12, 31));
        previousYearBudget.setIncome(previousIncomeAmount);
        previousYearBudget.setBudgetName(previousBudgetName);
        previousYearBudget.setUserId(userId);
        previousYearBudget.setBudgetAmount(previousIncomeAmount);
        previousYearBudget.setTotalMonthsToSave(12);
        previousYearBudget.setBudgetMode(BudgetMode.SAVINGS_PLAN);
        previousYearBudget.setBudgetYear(2024);
        previousYearBudget.setBudgetPeriod(Period.MONTHLY);
        previousYearBudget.setSavingsAmountAllocated(BigDecimal.ZERO);
        previousYearBudget.setSavingsProgress(BigDecimal.ZERO);
        previousYearBudget.setSubBudgets(new ArrayList<>());

        Optional<Budget> expected = Optional.of(previousYearBudget);
        Optional<Budget> actual = budgetSetupEngine.createPreviousYearBudget(previousIncomeAmount, previousBudgetName, currentYearBudget);
        assertNotNull(actual);
        Budget expectedBudget = expected.get();
        Budget actualBudget = actual.get();
        assertEquals(expectedBudget.getSubBudgets(), actualBudget.getSubBudgets());
        assertEquals(expectedBudget.getBudgetName(), actualBudget.getBudgetName());
        assertEquals(expectedBudget.getUserId(), actualBudget.getUserId());
        assertEquals(expectedBudget.getBudgetAmount(), actualBudget.getBudgetAmount());
        assertEquals(expectedBudget.getTotalMonthsToSave(), actualBudget.getTotalMonthsToSave());
        assertEquals(expectedBudget.getBudgetMode(), actualBudget.getBudgetMode());
        assertEquals(expectedBudget.getBudgetYear(), actualBudget.getBudgetYear());
        assertEquals(expectedBudget.getBudgetPeriod(), actualBudget.getBudgetPeriod());
        assertEquals(expectedBudget.getSavingsAmountAllocated(), actualBudget.getSavingsAmountAllocated());
        assertEquals(expectedBudget.getSavingsProgress(), actualBudget.getSavingsProgress());
        assertEquals(expectedBudget.getStartDate(), actualBudget.getStartDate());
        assertEquals(expectedBudget.getEndDate(), actualBudget.getEndDate());
    }

    @Test
    void testCreateBudgetStatistics_currentAndPreviousYearSubBudgets_shouldHandleDifferently() {
        // Arrange
        int currentYear = LocalDate.now().getYear();
        int previousYear = currentYear - 1;

        // Create a current year SubBudget
        SubBudget currentYearSubBudget = new SubBudget();
        currentYearSubBudget.setSubBudgetName("March " + currentYear);
        currentYearSubBudget.setId(1L);
        currentYearSubBudget.setAllocatedAmount(new BigDecimal("1200.00"));
        currentYearSubBudget.setStartDate(LocalDate.of(currentYear, 3, 1));
        currentYearSubBudget.setEndDate(LocalDate.of(currentYear, 3, 31));

        // Create a previous year SubBudget
        SubBudget previousYearSubBudget = new SubBudget();
        previousYearSubBudget.setSubBudgetName("December " + previousYear);
        previousYearSubBudget.setId(2L);
        previousYearSubBudget.setAllocatedAmount(new BigDecimal("1200.00"));
        previousYearSubBudget.setStartDate(LocalDate.of(previousYear, 12, 1));
        previousYearSubBudget.setEndDate(LocalDate.of(previousYear, 12, 31));

        List<SubBudget> mixedSubBudgets = Arrays.asList(currentYearSubBudget, previousYearSubBudget);

        // Create current year stats that would be returned by the service
        DateRange currentYearRange = new DateRange(
                LocalDate.of(currentYear, 3, 1),
                LocalDate.of(currentYear, 3, 31)
        );

        BudgetStats currentYearStats = new BudgetStats(
                currentYearSubBudget.getId(),
                new BigDecimal("1200.00"),   // totalBudget
                new BigDecimal("875.50"),    // totalSpent
                new BigDecimal("324.50"),    // remaining
                new BigDecimal("150.00"),    // totalSaved
                new BigDecimal("28.24"),     // averageSpendingPerDay
                new BigDecimal("92.7"),      // healthScore
                currentYearRange
        );

        // Mock service to return stats for current year SubBudget
        when(subBudgetStatisticsService.getBudgetStats(currentYearSubBudget))
                .thenReturn(Collections.singletonList(currentYearStats));

        // Act
        List<BudgetStats> actualBudgetStats = budgetSetupEngine.createBudgetStatistics(mixedSubBudgets);

        // Assert
        assertNotNull(actualBudgetStats);
        assertEquals(1, actualBudgetStats.size());

        // Get stats by budget ID
        Map<Long, BudgetStats> statsMap = actualBudgetStats.stream()
                .collect(Collectors.toMap(BudgetStats::getBudgetId, stats -> stats));

        // Verify current year stats have real values
        BudgetStats returnedCurrentYearStats = statsMap.get(currentYearSubBudget.getId());
        assertNotNull(returnedCurrentYearStats);
        assertEquals(0, new BigDecimal("875.50").compareTo(returnedCurrentYearStats.getTotalSpent()));
        assertEquals(0, new BigDecimal("28.24").compareTo(returnedCurrentYearStats.getAverageSpendingPerDay()));
        assertEquals(0, new BigDecimal("92.7").compareTo(returnedCurrentYearStats.getHealthScore()));

        // Verify previous year stats have zero values
        BudgetStats returnedPreviousYearStats = statsMap.get(previousYearSubBudget.getId());
        assertNotNull(returnedPreviousYearStats);
        assertEquals(0, BigDecimal.ZERO.compareTo(returnedPreviousYearStats.getTotalSpent()));
        assertEquals(0, BigDecimal.ZERO.compareTo(returnedPreviousYearStats.getAverageSpendingPerDay()));
        assertEquals(0, BigDecimal.ZERO.compareTo(returnedPreviousYearStats.getHealthScore()));
        assertEquals(0, previousYearSubBudget.getAllocatedAmount().compareTo(returnedPreviousYearStats.getRemaining()));

        // Verify that the service was only called for current year SubBudget
        verify(subBudgetStatisticsService, times(1)).getBudgetStats(any(SubBudget.class));
        verify(subBudgetStatisticsService).getBudgetStats(currentYearSubBudget);
        verify(subBudgetStatisticsService, never()).getBudgetStats(previousYearSubBudget);
    }



}