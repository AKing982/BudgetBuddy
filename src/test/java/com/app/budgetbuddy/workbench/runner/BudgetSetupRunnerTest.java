package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.workbench.budget.BudgetSetupEngine;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BudgetSetupRunnerTest
{
    @Mock
    private BudgetSetupEngine budgetSetupEngine;

    @Mock
    private BudgetGoalsService budgetGoalsService;

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private BudgetSetupRunner budgetSetupRunner;

    private BudgetRegistration budgetRegistration;
    private Budget currentBudget;
    private Budget previousYearBudget;
    private BudgetGoals budgetGoals;


    @BeforeEach
    void setUp() {

        // Setup budget registration
        budgetRegistration = new BudgetRegistration();
        budgetRegistration.setUserId(1L);
        budgetRegistration.setBudgetYear(2023);
        budgetRegistration.setBudgetName("Test Budget 2023");
        budgetRegistration.setTotalIncomeAmount(new BigDecimal("50000.00"));
        budgetRegistration.setPreviousIncomeAmount(new BigDecimal("48000.00"));
        budgetRegistration.setPreviousBudgetName("Test Budget 2022");
        budgetGoals = new BudgetGoals();
        budgetGoals.setBudgetId(101L);
        budgetGoals.setTargetAmount(5000.0);
        budgetGoals.setMonthlyAllocation(416.67); // 5000 / 12
        budgetRegistration.setBudgetGoals(budgetGoals);

        // Setup current budget
        currentBudget = new Budget();
        currentBudget.setId(101L);
        currentBudget.setUserId(1L);
        currentBudget.setBudgetYear(2023);
        currentBudget.setBudgetName("Test Budget 2023");
        currentBudget.setStartDate(LocalDate.of(2023, 1, 1));
        currentBudget.setEndDate(LocalDate.of(2023, 12, 31));

        // Setup previous year budget
        previousYearBudget = new Budget();
        previousYearBudget.setId(102L);
        previousYearBudget.setUserId(1L);
        previousYearBudget.setBudgetYear(2022);
        previousYearBudget.setBudgetName("Test Budget 2022");
        previousYearBudget.setStartDate(LocalDate.of(2022, 1, 1));
        previousYearBudget.setEndDate(LocalDate.of(2022, 12, 31));

        budgetSetupRunner = new BudgetSetupRunner(budgetSetupEngine, budgetGoalsService, entityManager);
    }

    @Test
    void testRunBudgetSetup_withBudgetStats_whenValidRegistration_shouldSetupSuccessfully() {
        // Arrange
        LocalDate currentDate = LocalDate.of(2023, 3, 1); // Up to Feb 2023
        try (MockedStatic<LocalDate> mockedLocalDate = Mockito.mockStatic(LocalDate.class, Mockito.CALLS_REAL_METHODS)) {
            mockedLocalDate.when(LocalDate::now).thenReturn(currentDate);

            // Mock budget creation
            when(budgetSetupEngine.createNewBudget(budgetRegistration))
                    .thenReturn(Optional.of(currentBudget));
            when(budgetSetupEngine.createPreviousYearBudget(
                    budgetRegistration.getPreviousIncomeAmount(),
                    budgetRegistration.getPreviousBudgetName(),
                    currentBudget))
                    .thenReturn(Optional.of(previousYearBudget));

            // Mock sub-budgets
            SubBudget janCurrent = new SubBudget();
            janCurrent.setId(1L);
            janCurrent.setStartDate(LocalDate.of(2023, 1, 1));
            janCurrent.setEndDate(LocalDate.of(2023, 1, 31));
            janCurrent.setAllocatedAmount(new BigDecimal("4166.67")); // 50000 / 12
            SubBudget febCurrent = new SubBudget();
            febCurrent.setId(2L);
            febCurrent.setStartDate(LocalDate.of(2023, 2, 1));
            febCurrent.setEndDate(LocalDate.of(2023, 2, 28));
            febCurrent.setAllocatedAmount(new BigDecimal("4166.67"));
            List<SubBudget> currentSubBudgets = Arrays.asList(janCurrent, febCurrent);

            SubBudget prevYearSub = new SubBudget();
            prevYearSub.setId(3L);
            prevYearSub.setStartDate(LocalDate.of(2022, 1, 1));
            prevYearSub.setEndDate(LocalDate.of(2022, 12, 31));
            prevYearSub.setAllocatedAmount(new BigDecimal("4000.00")); // 48000 / 12
            List<SubBudget> prevYearSubBudgets = Collections.singletonList(prevYearSub);

            when(budgetSetupEngine.createNewMonthlySubBudgetsForUser(currentBudget, budgetRegistration.getBudgetGoals()))
                    .thenReturn(currentSubBudgets);
            when(budgetSetupEngine.createSubBudgetTemplatesForYear(2022, previousYearBudget, budgetRegistration.getBudgetGoals()))
                    .thenReturn(prevYearSubBudgets);

            // Mock budget stats templates
            BudgetStats janStats = new BudgetStats(
                    1L, new BigDecimal("4166.67"), BigDecimal.ZERO, new BigDecimal("4166.67"),
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                    new DateRange(LocalDate.of(2023, 1, 1), LocalDate.of(2023, 1, 31)));
            BudgetStats febStats = new BudgetStats(
                    2L, new BigDecimal("4166.67"), BigDecimal.ZERO, new BigDecimal("4166.67"),
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                    new DateRange(LocalDate.of(2023, 2, 1), LocalDate.of(2023, 2, 28)));
            List<BudgetStats> currentStats = Arrays.asList(janStats, febStats);

            BudgetStats prevStats = new BudgetStats(
                    3L, new BigDecimal("4000.00"), BigDecimal.ZERO, new BigDecimal("4000.00"),
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                    new DateRange(LocalDate.of(2022, 1, 1), LocalDate.of(2022, 12, 31)));
            List<BudgetStats> prevStatsList = Collections.singletonList(prevStats);

            when(budgetSetupEngine.createBudgetStatistics(currentSubBudgets)).thenReturn(currentStats);
            when(budgetSetupEngine.createBudgetStatistics(prevYearSubBudgets)).thenReturn(prevStatsList);

            // Mock budget goals entities
            BudgetEntity currentBudgetEntity = new BudgetEntity();
            currentBudgetEntity.setId(101L);
            BudgetGoalsEntity currentGoalsEntity = new BudgetGoalsEntity();
            currentGoalsEntity.setBudget(currentBudgetEntity);
            currentGoalsEntity.setTargetAmount(5000.0);
            currentGoalsEntity.setMonthlyAllocation(416.67);

            BudgetEntity prevBudgetEntity = new BudgetEntity();
            prevBudgetEntity.setId(102L);
            BudgetGoalsEntity prevGoalsEntity = new BudgetGoalsEntity();
            prevGoalsEntity.setBudget(prevBudgetEntity);
            prevGoalsEntity.setTargetAmount(5000.0);
            prevGoalsEntity.setMonthlyAllocation(416.67);

            when(budgetGoalsService.findByBudgetId(101L)).thenReturn(Optional.of(currentGoalsEntity));
            when(budgetGoalsService.findByBudgetId(102L)).thenReturn(Optional.of(prevGoalsEntity));
            when(budgetGoalsService.convertToBudgetGoals(currentGoalsEntity)).thenReturn(budgetGoals);
            when(budgetGoalsService.convertToBudgetGoals(prevGoalsEntity)).thenReturn(budgetGoals);

            // Mock monthly budget goals
            MonthlyBudgetGoals janGoal = new MonthlyBudgetGoals();
            janGoal.setSubBudgetId(1L);
            MonthlyBudgetGoals febGoal = new MonthlyBudgetGoals();
            febGoal.setSubBudgetId(2L);
            List<MonthlyBudgetGoals> currentGoals = Arrays.asList(janGoal, febGoal);

            MonthlyBudgetGoals prevGoal = new MonthlyBudgetGoals();
            prevGoal.setSubBudgetId(3L);
            List<MonthlyBudgetGoals> prevGoals = Collections.singletonList(prevGoal);

            when(budgetSetupEngine.createMonthlyBudgetGoalsForSubBudgets(budgetGoals, currentSubBudgets))
                    .thenReturn(currentGoals);
            when(budgetSetupEngine.createMonthlyBudgetGoalsForSubBudgets(budgetGoals, prevYearSubBudgets))
                    .thenReturn(prevGoals);

            // Act
            boolean result = budgetSetupRunner.runBudgetSetup(budgetRegistration);

            // Assert
            assertTrue(result, "Budget setup should complete successfully");

            verify(budgetSetupEngine).createNewBudget(budgetRegistration);
            verify(budgetSetupEngine).createPreviousYearBudget(
                    budgetRegistration.getPreviousIncomeAmount(),
                    budgetRegistration.getPreviousBudgetName(),
                    currentBudget);
            verify(budgetSetupEngine).createNewMonthlySubBudgetsForUser(currentBudget, budgetRegistration.getBudgetGoals());
            verify(budgetSetupEngine).createSubBudgetTemplatesForYear(2022, previousYearBudget, budgetRegistration.getBudgetGoals());
            verify(budgetSetupEngine).createBudgetStatistics(currentSubBudgets);
            verify(budgetSetupEngine).createBudgetStatistics(prevYearSubBudgets);
            verify(budgetGoalsService).findByBudgetId(101L);
            verify(budgetGoalsService).findByBudgetId(102L);
            verify(budgetGoalsService).convertToBudgetGoals(currentGoalsEntity);
            verify(budgetGoalsService).convertToBudgetGoals(prevGoalsEntity);
            verify(budgetSetupEngine).createMonthlyBudgetGoalsForSubBudgets(budgetGoals, currentSubBudgets);
            verify(budgetSetupEngine).createMonthlyBudgetGoalsForSubBudgets(budgetGoals, prevYearSubBudgets);
            verify(budgetSetupEngine, times(2)).saveMonthlyBudgetGoals(anyList());
        }
    }

    @Test
    void testRunBudgetSetup_whenValidRegistration_shouldSetupBudgetsAndGoalsSuccessfully() {
        // Arrange
        LocalDate currentDate = LocalDate.of(2023, 3, 1); // Up to Feb 2023
        try (MockedStatic<LocalDate> mockedLocalDate = Mockito.mockStatic(LocalDate.class, Mockito.CALLS_REAL_METHODS)) {
            mockedLocalDate.when(LocalDate::now).thenReturn(currentDate);

            // Mock budget creation
            when(budgetSetupEngine.createNewBudget(budgetRegistration))
                    .thenReturn(Optional.of(currentBudget));
            when(budgetSetupEngine.createPreviousYearBudget(
                    budgetRegistration.getPreviousIncomeAmount(),
                    budgetRegistration.getPreviousBudgetName(),
                    currentBudget))
                    .thenReturn(Optional.of(previousYearBudget));

            // Mock sub-budgets
            SubBudget janCurrent = new SubBudget();
            janCurrent.setId(1L);
            janCurrent.setStartDate(LocalDate.of(2023, 1, 1));
            janCurrent.setEndDate(LocalDate.of(2023, 1, 31));
            SubBudget febCurrent = new SubBudget();
            febCurrent.setId(2L);
            febCurrent.setStartDate(LocalDate.of(2023, 2, 1));
            febCurrent.setEndDate(LocalDate.of(2023, 2, 28));
            List<SubBudget> currentSubBudgets = Arrays.asList(janCurrent, febCurrent);

            SubBudget prevYearSub = new SubBudget();
            prevYearSub.setId(3L);
            prevYearSub.setStartDate(LocalDate.of(2022, 1, 1));
            prevYearSub.setEndDate(LocalDate.of(2022, 12, 31));
            List<SubBudget> prevYearSubBudgets = Collections.singletonList(prevYearSub);

            when(budgetSetupEngine.createNewMonthlySubBudgetsForUser(currentBudget, budgetRegistration.getBudgetGoals()))
                    .thenReturn(currentSubBudgets);
            when(budgetSetupEngine.createSubBudgetTemplatesForYear(2022, previousYearBudget, budgetRegistration.getBudgetGoals()))
                    .thenReturn(prevYearSubBudgets);

            // Mock BudgetGoalsEntity for current year
            BudgetEntity currentBudgetEntity = new BudgetEntity();
            currentBudgetEntity.setId(101L);
            BudgetGoalsEntity currentGoalsEntity = new BudgetGoalsEntity();
            currentGoalsEntity.setBudget(currentBudgetEntity);
            currentGoalsEntity.setTargetAmount(5000.0);
            currentGoalsEntity.setMonthlyAllocation(416.67);

            // Mock BudgetGoalsEntity for previous year
            BudgetEntity prevBudgetEntity = new BudgetEntity();
            prevBudgetEntity.setId(102L);
            BudgetGoalsEntity prevGoalsEntity = new BudgetGoalsEntity();
            prevGoalsEntity.setBudget(prevBudgetEntity);
            prevGoalsEntity.setTargetAmount(5000.0);
            prevGoalsEntity.setMonthlyAllocation(416.67);

            when(budgetGoalsService.findByBudgetId(101L)).thenReturn(Optional.of(currentGoalsEntity));
            when(budgetGoalsService.findByBudgetId(102L)).thenReturn(Optional.of(prevGoalsEntity));
            when(budgetGoalsService.convertToBudgetGoals(currentGoalsEntity)).thenReturn(budgetGoals);
            when(budgetGoalsService.convertToBudgetGoals(prevGoalsEntity)).thenReturn(budgetGoals);

            // Mock monthly budget goals
            MonthlyBudgetGoals janGoal = new MonthlyBudgetGoals();
            janGoal.setSubBudgetId(1L);
            MonthlyBudgetGoals febGoal = new MonthlyBudgetGoals();
            febGoal.setSubBudgetId(2L);
            List<MonthlyBudgetGoals> currentGoals = Arrays.asList(janGoal, febGoal);

            MonthlyBudgetGoals prevGoal = new MonthlyBudgetGoals();
            prevGoal.setSubBudgetId(3L);
            List<MonthlyBudgetGoals> prevGoals = Collections.singletonList(prevGoal);

            when(budgetSetupEngine.createMonthlyBudgetGoalsForSubBudgets(budgetGoals, currentSubBudgets))
                    .thenReturn(currentGoals);
            when(budgetSetupEngine.createMonthlyBudgetGoalsForSubBudgets(budgetGoals, prevYearSubBudgets))
                    .thenReturn(prevGoals);


            // Act
            boolean result = budgetSetupRunner.runBudgetSetup(budgetRegistration);

            // Assert
            assertTrue(result, "Budget setup should complete successfully");

            verify(budgetSetupEngine).createNewBudget(budgetRegistration);
            verify(budgetSetupEngine).createPreviousYearBudget(
                    budgetRegistration.getPreviousIncomeAmount(),
                    budgetRegistration.getPreviousBudgetName(),
                    currentBudget);
            verify(budgetSetupEngine).createNewMonthlySubBudgetsForUser(currentBudget, budgetRegistration.getBudgetGoals());
            verify(budgetSetupEngine).createSubBudgetTemplatesForYear(2022, previousYearBudget, budgetRegistration.getBudgetGoals());
            verify(budgetGoalsService).findByBudgetId(101L);
            verify(budgetGoalsService).findByBudgetId(102L);
            verify(budgetGoalsService).convertToBudgetGoals(currentGoalsEntity);
            verify(budgetGoalsService).convertToBudgetGoals(prevGoalsEntity);
            verify(budgetSetupEngine).createMonthlyBudgetGoalsForSubBudgets(budgetGoals, currentSubBudgets);
            verify(budgetSetupEngine).createMonthlyBudgetGoalsForSubBudgets(budgetGoals, prevYearSubBudgets);
            verify(budgetSetupEngine, times(2)).saveMonthlyBudgetGoals(anyList());
        }
    }



    @AfterEach
    void tearDown() {
    }
}