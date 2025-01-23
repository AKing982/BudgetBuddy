package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.BudgetBuildException;
import com.app.budgetbuddy.services.BudgetScheduleService;
import com.app.budgetbuddy.services.BudgetService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@Slf4j
class BudgetBuilderServiceTest
{
    @Mock
    private BudgetService budgetService;

    @Mock
    private BudgetScheduleEngine budgetScheduleEngine;

    @Mock
    private BudgetCalculations budgetCalculations;

    @InjectMocks
    private BudgetBuilderService budgetBuilderService;

    private BudgetRegistration testBudgetRegistration;

    private BudgetRegistration budgetRegistrationMissingParams;

    @BeforeEach
    void setUp() {
        budgetBuilderService = new BudgetBuilderService(budgetService, budgetScheduleEngine, budgetCalculations);

        // Fully populated BudgetRegistration, including BudgetGoals
        testBudgetRegistration = new BudgetRegistration();
        testBudgetRegistration.setUserId(1L);
        testBudgetRegistration.setBudgetName("Test Budget");
        testBudgetRegistration.setBudgetMode(BudgetMode.SAVINGS_PLAN);
        testBudgetRegistration.setBudgetPeriod(Period.MONTHLY);

        // Here’s where you add your BudgetGoals record:
        // The constructor parameters must match your record definition:
        // public record BudgetGoals(
        //      Long budgetId, double targetAmount, double monthlyAllocation,
        //      double currentSavings, String goalType, String savingsFrequency, String status)
        BudgetGoals goals = new BudgetGoals(
                101L,       // budgetId
                5000.0,     // targetAmount
                500.0,      // monthlyAllocation
                250.0,      // currentSavings
                "LONG_TERM",// goalType
                "MONTHLY",  // savingsFrequency
                "ACTIVE"    // status
        );
        testBudgetRegistration.setBudgetGoals(goals);
        testBudgetRegistration.setBudgetDateRanges(Set.of(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025,1 ,31)),
                new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025,2, 28))));
        testBudgetRegistration.setTotalIncomeAmount(BigDecimal.valueOf(2000));
        testBudgetRegistration.setNumberOfMonths(1);
        testBudgetRegistration.setTotalBudgetsNeeded(1);

        // BudgetRegistration with missing parameters, including missing BudgetGoals
        budgetRegistrationMissingParams = new BudgetRegistration();
        budgetRegistrationMissingParams.setUserId(null);
        budgetRegistrationMissingParams.setBudgetName("");
        budgetRegistrationMissingParams.setBudgetMode(null);
        budgetRegistrationMissingParams.setBudgetPeriod(Period.MONTHLY);
        budgetRegistrationMissingParams.setBudgetGoals(null); // For missing goals
        budgetRegistrationMissingParams.setBudgetDateRanges(null);
        budgetRegistrationMissingParams.setTotalIncomeAmount(null);
        budgetRegistrationMissingParams.setNumberOfMonths(3);
        budgetRegistrationMissingParams.setTotalBudgetsNeeded(0);
    }

    @Test
    void testBuildBudgetFromRegistration_whenBudgetRegistrationIsNull_thenReturnEmptyOptional()
    {
        Optional<Budget> actual = budgetBuilderService.buildBudgetFromRegistration(null);
        assertTrue(actual.isEmpty());
    }

    @Test
    void buildBudgetFromRegistration_whenBudgetRegistrationParametersNull_thenThrowException()
    {
        assertThrows(BudgetBuildException.class, () -> {
            budgetBuilderService.buildBudgetFromRegistration(budgetRegistrationMissingParams);
        });
    }

    @Test
    void testBuildBudgetFromRegistration_whenValidBudgetRegistration_thenReturnBudget()
    {
        Budget budget = new Budget();
        budget.setId(1L);
        budget.setBudgetName("New Car Fund");
        budget.setActual(new BigDecimal("500.00"));        // Amount already saved or spent
        budget.setBudgetAmount(new BigDecimal("3000.00")); // Total planned budget
        budget.setBudgetYear(2025);
        budget.setUserId(1L);
        budget.setBudgetMode(BudgetMode.SAVINGS_PLAN);
        budget.setBudgetPeriod(Period.MONTHLY);
        budget.setBudgetStartDate(LocalDate.of(2025, 1, 1));

        // Create a monthly budget schedule for January
        BudgetSchedule januaryBudgetSchedule = new BudgetSchedule();
        januaryBudgetSchedule.setPeriod(Period.MONTHLY);
        januaryBudgetSchedule.setBudgetId(1L);
        januaryBudgetSchedule.setStatus("Active");
        januaryBudgetSchedule.setStartDate(LocalDate.of(2025, 1, 1));
        januaryBudgetSchedule.setEndDate(LocalDate.of(2025, 1, 31));
        januaryBudgetSchedule.setScheduleRange(new DateRange(
                LocalDate.of(2025, 1, 1),
                LocalDate.of(2025, 1, 31)
        ));
        januaryBudgetSchedule.setTotalPeriods(4); // e.g., planning for 4 months of savings
        januaryBudgetSchedule.initializeBudgetDateRanges();

        // Create a SavingsGoal object with realistic values
        SavingsGoal savingsGoal = new SavingsGoal();
        savingsGoal.setMonthlyAllocation(new BigDecimal("250.00"));       // Amount to save each month
        savingsGoal.setActualAllocationAmount(new BigDecimal("200.00"));  // Amount actually saved so far
        savingsGoal.setSavingsProgress(new BigDecimal("80.00"));          // Could be % or total saved
        savingsGoal.setSavingsTargetAmount(new BigDecimal("1000.00"));    // Final savings goal
        savingsGoal.setSavingsGoalReached(false);
        savingsGoal.setSavingsStartDate(LocalDate.of(2025, 1, 1));
        savingsGoal.setTotalMonthsToSave(4); // E.g., saving over 4 months
        savingsGoal.setSavingsEndDate(LocalDate.of(2025, 4, 30));

        // Attach the schedule(s) and savings goal to the budget
        budget.setBudgetSchedules(List.of(januaryBudgetSchedule));
        budget.setSavingsGoal(savingsGoal);

        // Set your expected and actual results
        Optional<Budget> expected = Optional.of(budget);
        Optional<Budget> actual = budgetBuilderService.buildBudgetFromRegistration(testBudgetRegistration);

        // Verify the result
        assertEquals(expected, actual);
    }




    @AfterEach
    void tearDown() {
    }
}