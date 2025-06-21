package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetStatisticsEntity;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.BudgetCategoryThreadService;
import com.app.budgetbuddy.workbench.TransactionImportService;
import com.app.budgetbuddy.workbench.subBudget.SubBudgetBuilderService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

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

@SpringBootTest
@Slf4j
class BudgetSetupEngineTest
{
    @MockBean
    private BudgetBuilderService budgetBuilderService;

    @MockBean
    private SubBudgetBuilderService subBudgetBuilderService;

    @MockBean
    private SubBudgetOverviewService subBudgetOverviewService;

    @MockBean
    private BudgetHealthService<SubBudget> budgetHealthService;

    @MockBean
    private AbstractBudgetStatisticsService<SubBudget> abstractBudgetStatisticsService;

    @MockBean
    private MonthlyBudgetGoalsBuilder monthlyBudgetGoalsBuilder;

    @MockBean
    private TransactionImportService transactionImportService;

    @MockBean
    private BudgetCategoryThreadService budgetCategoryThreadService;

    @Autowired
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

            SubBudget monthlySubBudget = SubBudget.builder()
                    .isActive(true)
                    .subSavingsTarget(monthlySavingsTarget)
                    .allocatedAmount(monthlyAllocation)
                    .subSavingsAmount(BigDecimal.ZERO)
                    .budget(budget)
                    .spentOnBudget(BigDecimal.ZERO)
                    .id((long)month)
                    .subBudgetName("Budget " + month + " of 2025")
                    .startDate(startDate)
                    .endDate(endDate)
                    .build();
            subBudgets.add(monthlySubBudget);
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

        budgetSetupEngine = new BudgetSetupEngine(budgetBuilderService, subBudgetBuilderService, monthlyBudgetGoalsBuilder, transactionImportService, abstractBudgetStatisticsService, budgetCategoryThreadService);
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

    private SubBudget createTestSubBudget(Long id, LocalDate startDate, LocalDate endDate) {
        return SubBudget.builder()
                .id(id)
                .startDate(startDate)
                .endDate(endDate)
                .allocatedAmount(BigDecimal.valueOf(3250))
                .subSavingsTarget(BigDecimal.valueOf(375))
                .subSavingsAmount(BigDecimal.ZERO)
                .spentOnBudget(BigDecimal.ZERO)
                .isActive(true)
                .build();
    }

    @Test
    void testCreateMonthlyBudgetGoalsForSubBudgets_shouldReturnMonthlyBudgetGoals() {
        // Setup test data
        List<SubBudget> subBudgets = Arrays.asList(
                createTestSubBudget(1L, LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)),
                createTestSubBudget(2L, LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28))
        );

        BudgetGoals budgetGoals = BudgetGoals.builder()
                .budgetId(1L)
                .targetAmount(4500)
                .monthlyAllocation(375)
                .currentSavings(0)
                .goalType("Savings Goal")
                .savingsFrequency("Monthly")
                .status("Active")
                .build();

        List<MonthlyBudgetGoals> expectedMonthlyBudgetGoals = new ArrayList<>();

        // Create expected MonthlyBudgetGoals for each SubBudget
        for (int i = 0; i < subBudgets.size(); i++) {
            SubBudget subBudget = subBudgets.get(i);

            MonthlyBudgetGoals monthlyGoal = new MonthlyBudgetGoals(
                    (long) (i + 1),                   // id
                    subBudget.getId(),                // subBudgetId
                    budgetGoals.getBudgetId(),        // budgetGoalId
                    BigDecimal.valueOf(375),          // monthlySavingsTarget
                    BigDecimal.ZERO,                  // monthlyContributed
                    BigDecimal.valueOf(100),          // goalScore
                    BigDecimal.valueOf(375),          // remainingAmount
                    "NOT_STARTED"                     // monthlyStatus
            );

            expectedMonthlyBudgetGoals.add(monthlyGoal);

            // Setup mock for MonthlyBudgetGoalsBuilder
            when(monthlyBudgetGoalsBuilder.createBudgetGoal(eq(budgetGoals), eq(subBudget.getId())))
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
            assertEquals(0, expected.getMonthlySavingsTarget().compareTo(actual.getMonthlySavingsTarget()));
            assertEquals(0, expected.getMonthlyContributed().compareTo(actual.getMonthlyContributed()));
            assertEquals(0, expected.getGoalScore().compareTo(actual.getGoalScore()));
            assertEquals(0, expected.getRemainingAmount().compareTo(actual.getRemainingAmount()));
            assertEquals(expected.getMonthlyStatus(), actual.getMonthlyStatus());
        }

        // Verify builder was called for each SubBudget with correct parameters
        for (SubBudget subBudget : subBudgets) {
            verify(monthlyBudgetGoalsBuilder).createBudgetGoal(budgetGoals, subBudget.getId());
        }
    }


//    @Test
//    void testCreateMonthlyBudgetGoalsForSubBudgets_shouldReturnMonthlyBudgetGoals()
//    {
//        List<MonthlyBudgetGoals> expectedMonthlyBudgetGoals = new ArrayList<>();
//
//        // Setup test data
//        BudgetGoals budgetGoals = BudgetGoals.builder()
//                .budgetId(1L)
//                .targetAmount(4500)
//                .monthlyAllocation(375)
//                .currentSavings(0)
//                .goalType("Savings Goal")
//                .savingsFrequency("Monthly")
//                .status("Active")
//                .build();
//
//        // Create expected MonthlyBudgetGoals for each SubBudget
//        for (int i = 0; i < subBudgets.size(); i++) {
//            SubBudget subBudget = subBudgets.get(i);
//
//            MonthlyBudgetGoals monthlyGoal = new MonthlyBudgetGoals(
//                    (long) (i + 1),                   // id
//                    subBudget.getId(),                // subBudgetId
//                    budgetGoals.getBudgetId(),        // budgetGoalId
//                    BigDecimal.valueOf(375),          // monthlySavingsTarget
//                    BigDecimal.ZERO,                  // monthlyContributed
//                    BigDecimal.valueOf(100),          // goalScore (100 as starting score)
//                    BigDecimal.valueOf(375),          // remainingAmount
//                    "NOT_STARTED"                     // monthlyStatus
//            );
//
//            expectedMonthlyBudgetGoals.add(monthlyGoal);
//
//            // Setup mock for MonthlyBudgetGoalsBuilder
//            when(monthlyBudgetGoalsBuilder.createBudgetGoal(eq(budgetGoals), anyLong()))
//                    .thenReturn(Optional.of(monthlyGoal));
//        }
//
//        // Execute test
//        List<MonthlyBudgetGoals> actualMonthlyBudgetGoals =
//                budgetSetupEngine.createMonthlyBudgetGoalsForSubBudgets(budgetGoals, subBudgets);
//
//        // Verify results
//        assertNotNull(actualMonthlyBudgetGoals);
//        assertEquals(expectedMonthlyBudgetGoals.size(), actualMonthlyBudgetGoals.size());
//
//        // Verify each MonthlyBudgetGoals
//        for (int i = 0; i < actualMonthlyBudgetGoals.size(); i++) {
//            MonthlyBudgetGoals expected = expectedMonthlyBudgetGoals.get(i);
//            MonthlyBudgetGoals actual = actualMonthlyBudgetGoals.get(i);
//
//            assertEquals(expected.getId(), actual.getId());
//            assertEquals(expected.getSubBudgetId(), actual.getSubBudgetId());
//            assertEquals(expected.getBudgetGoalId(), actual.getBudgetGoalId());
//            assertEquals(expected.getMonthlySavingsTarget(), actual.getMonthlySavingsTarget());
//            assertEquals(expected.getMonthlyContributed(), actual.getMonthlyContributed());
//            assertEquals(expected.getGoalScore(), actual.getGoalScore());
//            assertEquals(expected.getRemainingAmount(), actual.getRemainingAmount());
//            assertEquals(expected.getMonthlyStatus(), actual.getMonthlyStatus());
//        }
//
//        // Verify builder was called for each SubBudget
//        verify(monthlyBudgetGoalsBuilder, times(subBudgets.size()))
//                .createBudgetGoal(eq(budgetGoals), anyLong());
//    }

    @Test
    void testCreateBudgetStatistics_whenSubBudgetsListNull_thenReturnEmptyList(){
        List<BudgetStats> actual = budgetSetupEngine.createBudgetStatistics(null);
        assertEquals(0, actual.size());
    }

    @Test
    void testCreateBudgetStatistics_whenSubBudgetsInSetupPhase_shouldReturnStatsTemplates() {
        // Arrange
        LocalDate currentDate = LocalDate.of(2025, 2, 28);
        try (MockedStatic<LocalDate> mockedLocalDate = Mockito.mockStatic(LocalDate.class, Mockito.CALLS_REAL_METHODS)) {
            mockedLocalDate.when(LocalDate::now).thenReturn(currentDate);

            Budget budget = new Budget();
            budget.setId(2L);

            // Previous year sub-budget
            SubBudget dec2024Budget = new SubBudget();
            dec2024Budget.setId(12L);
            dec2024Budget.setSubBudgetName("December 2024");
            dec2024Budget.setStartDate(LocalDate.of(2024, 12, 1));
            dec2024Budget.setEndDate(LocalDate.of(2024, 12, 31));
            dec2024Budget.setBudget(budget);
            dec2024Budget.setAllocatedAmount(new BigDecimal("1200.00"));

            // Current year sub-budgets
            SubBudget januaryBudget = new SubBudget();
            januaryBudget.setId(13L);
            januaryBudget.setSubBudgetName("January 2025");
            januaryBudget.setStartDate(LocalDate.of(2025, 1, 1));
            januaryBudget.setEndDate(LocalDate.of(2025, 1, 31));
            januaryBudget.setBudget(budget);
            januaryBudget.setAllocatedAmount(new BigDecimal("1200.00"));

            SubBudget februaryBudget = new SubBudget();
            februaryBudget.setId(14L);
            februaryBudget.setSubBudgetName("February 2025");
            februaryBudget.setStartDate(LocalDate.of(2025, 2, 1));
            februaryBudget.setEndDate(LocalDate.of(2025, 2, 28));
            februaryBudget.setBudget(budget);
            februaryBudget.setAllocatedAmount(new BigDecimal("1200.00"));

            List<SubBudget> subBudgets = Arrays.asList(dec2024Budget, januaryBudget, februaryBudget);

            // Mock the statistics entity creation for each sub-budget
            for (SubBudget subBudget : subBudgets) {
                BudgetStatisticsEntity statsEntity = new BudgetStatisticsEntity();
                statsEntity.setId(subBudget.getId());
                statsEntity.setTotalBudget(subBudget.getAllocatedAmount());
                statsEntity.setTotalSpent(BigDecimal.ZERO);
                statsEntity.setAverageSpendingPerDay(BigDecimal.ZERO);
                statsEntity.setHealthScore(BigDecimal.ZERO);

                when(abstractBudgetStatisticsService.saveBudgetStatistic(any(BudgetStats.class)))
                        .thenReturn(Optional.of(statsEntity));
            }

            // Act
            List<BudgetStats> actualBudgetStats = budgetSetupEngine.createBudgetStatistics(subBudgets);

            // Assert
            assertNotNull(actualBudgetStats);
            assertEquals(3, actualBudgetStats.size(), "Should return 3 BudgetStats templates for Dec 2024, Jan-Feb 2025");

            // Verify Dec 2024 stats template
            assertEquals(12L, actualBudgetStats.get(0).getBudgetId());
            assertEquals(0, new BigDecimal("1200.00").compareTo(actualBudgetStats.get(0).getTotalBudget()), "Dec 2024 totalBudget mismatch");
            assertEquals(0, BigDecimal.ZERO.compareTo(actualBudgetStats.get(0).getTotalSpent()), "Dec 2024 totalSpent mismatch");
            assertEquals(0, new BigDecimal("1200.00").compareTo(actualBudgetStats.get(0).getRemaining()), "Dec 2024 remaining mismatch");

            // Verify January 2025 stats template
            assertEquals(13L, actualBudgetStats.get(1).getBudgetId());
            assertEquals(0, new BigDecimal("1200.00").compareTo(actualBudgetStats.get(1).getTotalBudget()), "January totalBudget mismatch");
            assertEquals(0, BigDecimal.ZERO.compareTo(actualBudgetStats.get(1).getTotalSpent()), "January totalSpent mismatch");
            assertEquals(0, new BigDecimal("1200.00").compareTo(actualBudgetStats.get(1).getRemaining()), "January remaining mismatch");

            // Verify February 2025 stats template
            assertEquals(14L, actualBudgetStats.get(2).getBudgetId());
            assertEquals(0, new BigDecimal("1200.00").compareTo(actualBudgetStats.get(2).getTotalBudget()), "February totalBudget mismatch");
            assertEquals(0, BigDecimal.ZERO.compareTo(actualBudgetStats.get(2).getTotalSpent()), "February totalSpent mismatch");
            assertEquals(0, new BigDecimal("1200.00").compareTo(actualBudgetStats.get(2).getRemaining()), "February remaining mismatch");

            // Verify service interactions
            verify(abstractBudgetStatisticsService, times(3)).saveBudgetStatistic(any(BudgetStats.class));
            verify(abstractBudgetStatisticsService, never()).getBudgetStats(any(SubBudget.class));
        }
    }


//    @Test
//    void testCreateBudgetStatistics_whenSubBudgetsInSetupPhase_shouldReturnStatsTemplates() {
//        // Arrange
//        LocalDate currentDate = LocalDate.of(2025, 2, 28);
//        try (MockedStatic<LocalDate> mockedLocalDate = Mockito.mockStatic(LocalDate.class, Mockito.CALLS_REAL_METHODS)) {
//            mockedLocalDate.when(LocalDate::now).thenReturn(currentDate);
//
//            Budget budget = new Budget();
//            budget.setId(2L);
//
//            // Previous year sub-budget
//            SubBudget dec2024Budget = new SubBudget();
//            dec2024Budget.setId(12L);
//            dec2024Budget.setSubBudgetName("December 2024");
//            dec2024Budget.setStartDate(LocalDate.of(2024, 12, 1));
//            dec2024Budget.setEndDate(LocalDate.of(2024, 12, 31));
//            dec2024Budget.setBudget(budget);
//            dec2024Budget.setAllocatedAmount(new BigDecimal("1200.00"));
//
//            // Current year sub-budgets
//            SubBudget januaryBudget = new SubBudget();
//            januaryBudget.setId(13L);
//            januaryBudget.setSubBudgetName("January 2025");
//            januaryBudget.setStartDate(LocalDate.of(2025, 1, 1));
//            januaryBudget.setEndDate(LocalDate.of(2025, 1, 31));
//            januaryBudget.setBudget(budget);
//            januaryBudget.setAllocatedAmount(new BigDecimal("1200.00"));
//
//            SubBudget februaryBudget = new SubBudget();
//            februaryBudget.setId(14L);
//            februaryBudget.setSubBudgetName("February 2025");
//            februaryBudget.setStartDate(LocalDate.of(2025, 2, 1));
//            februaryBudget.setEndDate(LocalDate.of(2025, 2, 28));
//            februaryBudget.setBudget(budget);
//            februaryBudget.setAllocatedAmount(new BigDecimal("1200.00"));
//
//            List<SubBudget> subBudgets = Arrays.asList(dec2024Budget, januaryBudget, februaryBudget);
//
//            // Act
//            List<BudgetStats> actualBudgetStats = budgetSetupEngine.createBudgetStatistics(subBudgets);
//
//            // Assert
//            assertNotNull(actualBudgetStats);
//            assertEquals(3, actualBudgetStats.size(), "Should return 3 BudgetStats templates for Dec 2024, Jan-Feb 2025");
//
//            // Verify Dec 2024 stats template
//            assertEquals(12L, actualBudgetStats.get(0).getBudgetId());
//            assertEquals(0, new BigDecimal("1200.00").compareTo(actualBudgetStats.get(0).getTotalBudget()), "Dec 2024 totalBudget mismatch");
//            assertEquals(0, BigDecimal.ZERO.compareTo(actualBudgetStats.get(0).getTotalSpent()), "Dec 2024 totalSpent mismatch");
//            assertEquals(0, new BigDecimal("1200.00").compareTo(actualBudgetStats.get(0).getRemaining()), "Dec 2024 remaining mismatch");
//
//            // Verify January 2025 stats template
//            assertEquals(13L, actualBudgetStats.get(1).getBudgetId());
//            assertEquals(0, new BigDecimal("1200.00").compareTo(actualBudgetStats.get(1).getTotalBudget()), "January totalBudget mismatch");
//            assertEquals(0, BigDecimal.ZERO.compareTo(actualBudgetStats.get(1).getTotalSpent()), "January totalSpent mismatch");
//            assertEquals(0, new BigDecimal("1200.00").compareTo(actualBudgetStats.get(1).getRemaining()), "January remaining mismatch");
//
//            // Verify February 2025 stats template
//            assertEquals(14L, actualBudgetStats.get(2).getBudgetId());
//            assertEquals(0, new BigDecimal("1200.00").compareTo(actualBudgetStats.get(2).getTotalBudget()), "February totalBudget mismatch");
//            assertEquals(0, BigDecimal.ZERO.compareTo(actualBudgetStats.get(2).getTotalSpent()), "February totalSpent mismatch");
//            assertEquals(0, new BigDecimal("1200.00").compareTo(actualBudgetStats.get(2).getRemaining()), "February remaining mismatch");
//
//            // No service calls expected—no transaction data
//            verify(abstractBudgetStatisticsService, never()).getBudgetStats(any(SubBudget.class));
//        }
//    }

    @Test
    void testCreateNewMonthlySubBudgetsForUser_withValidBudgetAndGoals_shouldCombinePastAndFutureSubBudgets() {
        // Arrange
        LocalDate currentDate = LocalDate.of(2025, 2, 28); // Mid-year split
        LocalDate budgetStartDate = LocalDate.of(2025, 1, 1);
        LocalDate budgetEndDate = LocalDate.of(2025, 12, 31);

        // Update budget
        budget.setStartDate(budgetStartDate);
        budget.setEndDate(budgetEndDate);
        budget.setId(2L);
        budget.setBudgetYear(2025);

        // Full year sub-budgets (Jan-Dec)
        List<SubBudget> fullYearSubBudgets = new ArrayList<>();
        for (int month = 1; month <= 12; month++) {
            LocalDate start = LocalDate.of(2025, month, 1);
            LocalDate end = start.plusMonths(1).minusDays(1);
            String monthName = start.getMonth().toString();
            SubBudget sub = SubBudget.buildSubBudget(
                    true, BigDecimal.valueOf(3250), BigDecimal.valueOf(375), BigDecimal.ZERO, budget, BigDecimal.ZERO,
                    monthName.charAt(0) + monthName.substring(1).toLowerCase() + " 2025", start, end);
            sub.setId((long) (13 + month - 1)); // IDs 13-24
            fullYearSubBudgets.add(sub);
        }

        // Mock with fixed current date
        try (MockedStatic<LocalDate> mockedLocalDate = Mockito.mockStatic(LocalDate.class, Mockito.CALLS_REAL_METHODS)) {
            mockedLocalDate.when(LocalDate::now).thenReturn(currentDate);

            // Setup mocks
            when(subBudgetBuilderService.createSubBudgetTemplates(2025, budget, budgetGoals))
                    .thenReturn(fullYearSubBudgets);

            // Act
            List<SubBudget> result = budgetSetupEngine.createNewMonthlySubBudgetsForUser(budget, budgetGoals);

            // Assert
            assertNotNull(result, "Result should not be null");
            assertEquals(12, result.size(), "Should have 12 sub-budgets (Jan-Dec)");

            // Verify all sub-budgets
            for (int i = 0; i < result.size(); i++) {
                SubBudget actual = result.get(i);
                assertEquals(fullYearSubBudgets.get(i).getId(), actual.getId(),
                        "Sub-budget ID mismatch at index " + i);
                assertEquals(fullYearSubBudgets.get(i).getSubBudgetName(), actual.getSubBudgetName(),
                        "Sub-budget name mismatch at index " + i);
                assertEquals(fullYearSubBudgets.get(i).getStartDate(), actual.getStartDate(),
                        "Start date mismatch at index " + i);
                assertEquals(fullYearSubBudgets.get(i).getEndDate(), actual.getEndDate(),
                        "End date mismatch at index " + i);
                assertEquals(0, fullYearSubBudgets.get(i).getAllocatedAmount().compareTo(actual.getAllocatedAmount()),
                        "Allocated amount mismatch at index " + i);
            }

            // Verify mock interactions
            verify(subBudgetBuilderService).createSubBudgetTemplates(2025, budget, budgetGoals);
            verifyNoMoreInteractions(subBudgetBuilderService);
        }
    }


//    @Test
//    void testCreateNewMonthlySubBudgetsForUser_withValidBudgetAndGoals_shouldCombinePastAndFutureSubBudgets() {
//        // Arrange
//        LocalDate currentDate = LocalDate.of(2025, 2, 28); // Mid-year split
//        LocalDate budgetStartDate = LocalDate.of(2025, 1, 1);
//        LocalDate budgetEndDate = LocalDate.of(2025, 12, 31);
//
//        // Update budget
//        budget.setStartDate(budgetStartDate);
//        budget.setEndDate(budgetEndDate);
//        budget.setId(2L);
//        budget.setBudgetYear(2025);
//
//        // Past sub-budgets (Jan-Feb)
//        List<SubBudget> pastSubBudgets = new ArrayList<>();
//        SubBudget jan = SubBudget.buildSubBudget(
//                true, BigDecimal.valueOf(3250), BigDecimal.valueOf(375), BigDecimal.ZERO, budget, BigDecimal.ZERO,
//                "January 2025", LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31));
//        jan.setId(13L);
//        SubBudget feb = SubBudget.buildSubBudget(
//                true, BigDecimal.valueOf(3250), BigDecimal.valueOf(375), BigDecimal.ZERO, budget, BigDecimal.ZERO,
//                "February 2025", LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28));
//        feb.setId(14L);
//        pastSubBudgets.add(jan);
//        pastSubBudgets.add(feb);
//
//        // Full year sub-budgets (Jan-Dec, filtered to Mar-Dec in method)
//        List<SubBudget> fullYearSubBudgets = new ArrayList<>();
//        for (int month = 1; month <= 12; month++) {
//            LocalDate start = LocalDate.of(2025, month, 1);
//            LocalDate end = start.plusMonths(1).minusDays(1);
//            String monthName = getMonthNameByNumber(month);
//            SubBudget sub = SubBudget.buildSubBudget(
//                    true, BigDecimal.valueOf(3250), BigDecimal.valueOf(375), BigDecimal.ZERO, budget, BigDecimal.ZERO,
//                     monthName + " 2025", start, end);
//            sub.setId((long) (13 + month - 1)); // IDs 13-24
//            fullYearSubBudgets.add(sub);
//        }
//
//        // Expected combined result
//        List<SubBudget> expectedSubBudgets = new ArrayList<>(pastSubBudgets);
//        expectedSubBudgets.addAll(fullYearSubBudgets.stream()
//                .filter(sub -> sub.getStartDate().isAfter(currentDate))
//                .collect(Collectors.toList()));
//
//        // Mock with fixed current date
//        try (MockedStatic<LocalDate> mockedLocalDate = Mockito.mockStatic(LocalDate.class, Mockito.CALLS_REAL_METHODS)) {
//            mockedLocalDate.when(LocalDate::now).thenReturn(currentDate);
//
////            when(subBudgetBuilderService.createMonthlySubBudgetsToDate(budget, budgetGoals))
////                    .thenReturn(pastSubBudgets);
//            when(subBudgetBuilderService.createSubBudgetTemplates(2025, budget, budgetGoals))
//                    .thenReturn(fullYearSubBudgets);
////            doNothing().when(subBudgetBuilderService).saveSubBudgets(any());
//
//            // Act
//            List<SubBudget> result = budgetSetupEngine.createNewMonthlySubBudgetsForUser(budget, budgetGoals);
//
//            // Assert
//            assertNotNull(result, "Result should not be null");
//            assertEquals(12, result.size(), "Should have 12 sub-budgets (Jan-Dec)");
//
//            // Verify all sub-budgets
//            for (int i = 0; i < 12; i++) {
//                SubBudget expected = expectedSubBudgets.get(i);
//                SubBudget actual = result.get(i);
//                assertEquals(expected.getId(), actual.getId(), "Sub-budget ID mismatch at index " + i);
//                assertEquals(expected.getSubBudgetName(), actual.getSubBudgetName(), "Sub-budget name mismatch at index " + i);
//                assertEquals(expected.getStartDate(), actual.getStartDate(), "Start date mismatch at index " + i);
//                assertEquals(expected.getEndDate(), actual.getEndDate(), "End date mismatch at index " + i);
//                assertEquals(expected.getAllocatedAmount(), actual.getAllocatedAmount(), "Allocated amount mismatch at index " + i);
//            }
//
//            // Verify mocks
////            verify(subBudgetBuilderService).createMonthlySubBudgetsToDate(budget, budgetGoals);
//            verify(subBudgetBuilderService).createSubBudgetTemplates(2025, budget, budgetGoals);
//            verify(subBudgetBuilderService).saveSubBudgets(result);
//            verifyNoMoreInteractions(subBudgetBuilderService);
//        }
//    }

    private String getMonthNameByNumber(int monthNumber) {
        switch(monthNumber) {
            case 1: return "January";
            case 2: return "February";
            case 3: return "March";
            case 4: return "April";
            case 5: return "May";
            case 6: return "June";
            case 7: return "July";
            case 8: return "August";
            case 9: return "September";
            case 10: return "October";
            case 11: return "November";
            case 12: return "December";
            default: throw new IllegalArgumentException("Invalid month number: " + monthNumber);
        }

    }

    @Test
    void testCreatePreviousYearBudget_whenYearIsNegative_thenReturnEmptyOptional() {
        // Arrange
        BigDecimal previousIncomeAmount = new BigDecimal("39000");
        final String previousBudgetName = "2024 Budget Savings Plan";
        final Long userId = 1L;
        final int previousYear = 2025-1;

        // Set current year to 0, so previous year is -1 (negative)
        Budget currentYearBudget = budget;
        currentYearBudget.setBudgetYear(0); // Previous year will be -1
        currentYearBudget.setStartDate(LocalDate.of(0, 1, 1)); // Adjust dates to match
        currentYearBudget.setEndDate(LocalDate.of(0, 12, 31));

        // Act
        Optional<Budget> actual = budgetSetupEngine.createPreviousYearBudget(previousIncomeAmount, previousBudgetName, previousYear, currentYearBudget);

        // Assert
        assertNotNull(actual, "Result should not be null");
        assertTrue(actual.isEmpty(), "Should return empty Optional for negative previous year");
    }
}