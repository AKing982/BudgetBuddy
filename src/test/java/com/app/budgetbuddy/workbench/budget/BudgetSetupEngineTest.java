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

        budgetSetupEngine = new BudgetSetupEngine(budgetBuilderService, subBudgetBuilderService, monthlyBudgetGoalsBuilder);
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
//            when(monthlyBudgetGoalsBuilder.createBudgetGoal(eq(budgetGoals)))
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
//                .createBudgetGoal(eq(budgetGoals));
//    }


}