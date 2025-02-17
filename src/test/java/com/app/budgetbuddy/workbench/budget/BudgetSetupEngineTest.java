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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
    private MonthlyBudgetGoalService monthlyBudgetGoalService;

    @Mock
    private BudgetPeriodCategoryService budgetPeriodCategoryService;

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

        budgetSetupEngine = new BudgetSetupEngine(budgetBuilderService, subBudgetBuilderService, subBudgetOverviewService, budgetHealthService, abstractBudgetStatisticsService, budgetPeriodCategoryService, monthlyBudgetGoalService);
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
    void testCreateMonthlyBudgetStats_whenSubBudgetsNull_thenReturnEmptyList() {
        List<BudgetStats> result = budgetSetupEngine.createMonthlyBudgetStats(null);
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }


    @Test
    void testCreateBudgetStats_shouldReturnMonthlyBudgetStats()
    {

        BigDecimal monthlyAllocation = BigDecimal.valueOf(3250); // 39000 / 1
        // Setup mock behavior for each SubBudget
        for (SubBudget subBudget : subBudgets) {
            BudgetStats stats = new BudgetStats(
                    subBudget.getId(),
                    subBudget.getAllocatedAmount(),
                    BigDecimal.ZERO,                       // totalSpent
                    subBudget.getAllocatedAmount(),        // remaining
                    BigDecimal.ZERO,                       // totalSaved
                    BigDecimal.ZERO,                       // averageSpendingPerDay
                    BigDecimal.valueOf(100),               // healthScore
                    new DateRange(subBudget.getStartDate(), subBudget.getEndDate())
            );
            when(abstractBudgetStatisticsService.getBudgetStats(eq(subBudget)))
                    .thenReturn(Collections.singletonList(stats));
        }

        // Execute test
        List<BudgetStats> actual = budgetSetupEngine.createMonthlyBudgetStats(subBudgets);

        // Verify results
        assertNotNull(actual);
        assertEquals(12, actual.size());

        // Verify each month's stats
        for (int i = 0; i < actual.size(); i++) {
            BudgetStats actualStats = actual.get(i);
            SubBudget correspondingBudget = subBudgets.get(i);

            assertEquals(correspondingBudget.getId(), actualStats.getBudgetId());
            assertEquals(monthlyAllocation, actualStats.getTotalBudget());
            assertEquals(BigDecimal.ZERO, actualStats.getTotalSpent());
            assertEquals(monthlyAllocation, actualStats.getRemaining());
            assertEquals(BigDecimal.ZERO, actualStats.getTotalSaved());
            assertEquals(BigDecimal.ZERO, actualStats.getAverageSpendingPerDay());
            assertEquals(BigDecimal.valueOf(100), actualStats.getHealthScore());
            assertEquals(correspondingBudget.getStartDate(), actualStats.getDateRange().getStartDate());
            assertEquals(correspondingBudget.getEndDate(), actualStats.getDateRange().getEndDate());
        }

        // Verify the service was called for each SubBudget
        for (SubBudget subBudget : subBudgets) {
            verify(abstractBudgetStatisticsService).getBudgetStats(eq(subBudget));
        }
    }

    @Test
    void testCreateBudgetPeriodCategories_whenSubBudgetsListIsNull_thenReturnEmptyList()
    {
        List<BudgetPeriodCategory> budgetPeriodCategories = budgetSetupEngine.createBudgetPeriodCategories(null);
        assertEquals(0, budgetPeriodCategories.size());
    }

    @Test
    void testCreateBudgetPeriodCategories_whenSubBudgetsListIsEmpty_thenReturnEmptyList(){
        List<SubBudget> subBudgets = new ArrayList<>();
        List<BudgetPeriodCategory> budgetPeriodCategories = budgetSetupEngine.createBudgetPeriodCategories(subBudgets);
        assertEquals(0, budgetPeriodCategories.size());
    }

    @Test
    void testCreateBudgetPeriodCategories_shouldReturnBudgetPeriodCategoriesForValidSubBudgets()
    {
        List<BudgetPeriodCategory> expectedBudgetPeriodCategories = new ArrayList<>();
        List<SubBudget> subBudgetsList = subBudgets;
        List<BudgetSchedule> budgetSchedules = new ArrayList<>();
        // For each SubBudget, create its BudgetSchedule and expected categories
        for (SubBudget subBudget : subBudgetsList) {
            // Create a single BudgetSchedule for the SubBudget
            BudgetSchedule budgetSchedule = BudgetSchedule.builder()
                    .period(Period.MONTHLY)
                    .startDate(subBudget.getStartDate())
                    .endDate(subBudget.getEndDate())
                    .build();

            // Set the BudgetSchedule list in the SubBudget
            subBudget.setBudgetSchedule(Collections.singletonList(budgetSchedule));

            DateRange dateRange = new DateRange(subBudget.getStartDate(), subBudget.getEndDate());

            // Create sample categories
            BudgetPeriodCategory housing = new BudgetPeriodCategory(
                    "Housing",
                    BigDecimal.valueOf(1200),    // budgeted
                    BigDecimal.valueOf(1100),    // actual
                    dateRange,
                    BudgetStatus.GOOD
            );

            BudgetPeriodCategory transportation = new BudgetPeriodCategory(
                    "Transportation",
                    BigDecimal.valueOf(500),     // budgeted
                    BigDecimal.valueOf(600),     // actual
                    dateRange,
                    BudgetStatus.OVER_BUDGET
            );

            BudgetPeriodCategory utilities = new BudgetPeriodCategory(
                    "Utilities",
                    BigDecimal.valueOf(300),     // budgeted
                    BigDecimal.valueOf(200),     // actual
                    dateRange,
                    BudgetStatus.UNDER_UTILIZED
            );

            List<BudgetPeriodCategory> monthlyCategories = Arrays.asList(housing, transportation, utilities);
            expectedBudgetPeriodCategories.addAll(monthlyCategories);

            // Setup mock for the SubBudget and its BudgetSchedule
            when(budgetPeriodCategoryService.getBudgetPeriodCategories(
                    eq(subBudget),
                    eq(budgetSchedule)))
                    .thenReturn(monthlyCategories);
        }

        // Execute test
        List<BudgetPeriodCategory> actual = budgetSetupEngine.createBudgetPeriodCategories(subBudgetsList);

        // Verify results
        assertNotNull(actual);
        assertEquals(expectedBudgetPeriodCategories.size(), actual.size());

        // Verify each category
        for (int i = 0; i < actual.size(); i++) {
            BudgetPeriodCategory expectedCategory = expectedBudgetPeriodCategories.get(i);
            BudgetPeriodCategory actualCategory = actual.get(i);

            assertEquals(expectedCategory.getCategory(), actualCategory.getCategory());
            assertEquals(expectedCategory.getBudgeted(), actualCategory.getBudgeted());
            assertEquals(expectedCategory.getActual(), actualCategory.getActual());
            assertEquals(expectedCategory.getRemaining(), actualCategory.getRemaining());
            assertEquals(expectedCategory.isOverBudget(), actualCategory.isOverBudget());
            assertEquals(expectedCategory.getSpendingPercentage(), actualCategory.getSpendingPercentage(), 0.001);
            assertEquals(expectedCategory.getBudgetStatus(), actualCategory.getBudgetStatus());
            assertEquals(expectedCategory.getDateRange(), actualCategory.getDateRange());
        }

        // Verify service was called for each SubBudget with its BudgetSchedule
        for (SubBudget subBudget : subBudgetsList) {
            verify(budgetPeriodCategoryService).getBudgetPeriodCategories(
                    eq(subBudget),
                    eq(subBudget.getBudgetSchedule().get(0)));
        }
    }

    @Test
    void testCreateTopExpenseCategories_whenSubBudgetsListIsNull_thenReturnEmptyList(){
        List<ExpenseCategory> expenseCategories = budgetSetupEngine.createTopExpensesCategories(null);
        assertEquals(0, expenseCategories.size());
    }


}