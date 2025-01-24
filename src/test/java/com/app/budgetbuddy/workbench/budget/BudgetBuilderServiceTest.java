package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.BudgetBuildException;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.services.BudgetScheduleService;
import com.app.budgetbuddy.services.BudgetService;
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
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;

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
        // Instead of a separate SavingsGoal, use the new fields on Budget
        budget.setSavingsAmountAllocated(new BigDecimal("200.00")); // e.g., amount actually allocated so far
        budget.setSavingsProgress(new BigDecimal("80.00"));         // could be percentage or total saved
        budget.setTotalMonthsToSave(4);                             // e.g., saving over 4 months


        // Attach the schedule(s) and savings goal to the budget
        budget.setBudgetSchedules(List.of(januaryBudgetSchedule));

        // Set your expected and actual results
        Optional<Budget> expected = Optional.of(budget);
        Optional<Budget> actual = budgetBuilderService.buildBudgetFromRegistration(testBudgetRegistration);

        // Verify the result
        assertEquals(expected, actual);
    }

    @Test
    void testCreateBudgetSchedules_whenMonthEndNull_thenReturnEmptyBudgetSchedules()
    {
        List<BudgetSchedule> actual = budgetBuilderService.createBudgetSchedules(LocalDate.of(2025, 1, 1), null, 1L, Period.MONTHLY);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateBudgetSchedules_whenUserIdInvalid_thenThrowException(){
        List<BudgetSchedule> actual = budgetBuilderService.createBudgetSchedules(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31), -1L, Period.MONTHLY);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateBudgetSchedules_whenJanuaryBudgetAndMonthlyPeriod_thenReturnBudgetSchedules(){
        List<DateRange> januaryDateRanges = new ArrayList<>();
        januaryDateRanges.add(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7)));
        januaryDateRanges.add(new DateRange(LocalDate.of(2025, 1,8), LocalDate.of(2025, 1, 14)));
        januaryDateRanges.add(new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 21)));
        januaryDateRanges.add(new DateRange(LocalDate.of(2025, 1, 22), LocalDate.of(2025, 1, 28)));
        januaryDateRanges.add(new DateRange(LocalDate.of(2025, 1, 29), LocalDate.of(2025, 1, 31)));

        Long userId = 1L;
        Period period = Period.MONTHLY;

        LocalDate monthStart = LocalDate.of(2025, 1, 1);
        LocalDate monthEnd = LocalDate.of(2025, 1, 31);

        BudgetSchedule januaryBudgetSchedule = new BudgetSchedule();
        januaryBudgetSchedule.setPeriod(period);
        januaryBudgetSchedule.setBudgetId(1L);
        januaryBudgetSchedule.setStatus("Active");
        januaryBudgetSchedule.setStartDate(LocalDate.of(2025, 1, 1));
        januaryBudgetSchedule.setEndDate(LocalDate.of(2025, 1, 31));
        januaryBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        januaryBudgetSchedule.setTotalPeriods(5);
        januaryBudgetSchedule.initializeBudgetDateRanges();

        Mockito.when(budgetScheduleEngine.createMonthBudgetSchedule(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Optional.of(januaryBudgetSchedule));

        List<BudgetSchedule> expected = List.of(januaryBudgetSchedule);
        List<BudgetSchedule> actual = budgetBuilderService.createBudgetSchedules(monthStart, monthEnd, userId, period);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for(int i = 0; i < actual.size(); i++){
            assertEquals(expected.get(i).getBudgetDateRanges().size(), actual.get(i).getBudgetDateRanges().size());
            assertEquals(expected.get(i).getBudgetId(), actual.get(i).getBudgetId());
            assertEquals(expected.get(i).getScheduleRange().getStartDate(), actual.get(i).getScheduleRange().getStartDate());
            assertEquals(expected.get(i).getScheduleRange().getEndDate(), actual.get(i).getScheduleRange().getEndDate());
            assertEquals(expected.get(i).getTotalPeriods(), actual.get(i).getTotalPeriods());
            assertEquals(expected.get(i).getPeriod(), actual.get(i).getPeriod());
            assertEquals(expected.get(i).getStatus(), actual.get(i).getStatus());
        }
    }


    @AfterEach
    void tearDown() {
    }
}