package com.app.budgetbuddy.workbench.budget;


import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.SubBudgetService;
import com.app.budgetbuddy.workbench.subBudget.SubBudgetBuilderService;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;

@ExtendWith(MockitoExtension.class)
class SubBudgetBuilderServiceTest
{
    @Mock
    private SubBudgetService subBudgetService;

    @Mock
    private BudgetScheduleEngine budgetScheduleEngine;

    @Mock
    private BudgetCalculations budgetCalculations;

    @InjectMocks
    private SubBudgetBuilderService subBudgetBuilderService;

    private Budget budget;

    private BudgetGoals budgetGoals;

    @BeforeEach
    void setUp()
    {
        budget = new Budget();
        budget.setStartDate(LocalDate.of(2025,1 ,1));
        budget.setEndDate(LocalDate.of(2025,12, 31));
        budget.setBudgetPeriod(Period.MONTHLY);
        budget.setBudgetMode(BudgetMode.SAVINGS_PLAN);
        budget.setBudgetName("Savings Budget Plan");
        budget.setBudgetDescription("Savings Budget Plan");
        budget.setTotalMonthsToSave(12);
        budget.setUserId(1L);
        budget.setId(1L);
        budget.setSavingsProgress(BigDecimal.ZERO);
        budget.setSavingsAmountAllocated(BigDecimal.ZERO);
        budget.setBudgetAmount(new BigDecimal("39120"));
        budget.setActual(new BigDecimal("1609"));

        budgetGoals = new BudgetGoals();
        budgetGoals.setBudgetId(1L);
        budgetGoals.setGoalType("Savings Plan");
        budgetGoals.setTargetAmount(2500);
        budgetGoals.setSavingsFrequency("Monthly");
        budgetGoals.setMonthlyAllocation(250);
        budgetGoals.setCurrentSavings(150);

        subBudgetBuilderService = new SubBudgetBuilderService(subBudgetService, budgetCalculations, budgetScheduleEngine);
    }

    @Test
    void testCreateNewMonthSubBudget_whenBudgetIsNull_thenReturnEmptyOptional(){
        BigDecimal totalIncome = new BigDecimal("3260");
        MonthlyBudgetGoals monthlyBudgetGoals = new MonthlyBudgetGoals();
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        LocalDate endDate = LocalDate.of(2025, 1, 31);
        Optional<SubBudget> actual = subBudgetBuilderService.createNewMonthSubBudget(null, startDate, endDate, totalIncome, budgetGoals);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateNewMonthSubBudget_whenTotalIncomeIsNull_thenReturnEmptyOptional(){
        Budget budget = new Budget();
        MonthlyBudgetGoals monthlyBudgetGoals = new MonthlyBudgetGoals();
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        LocalDate endDate = LocalDate.of(2025, 1, 31);

        Optional<SubBudget> actual = subBudgetBuilderService.createNewMonthSubBudget(budget, startDate, endDate,null, budgetGoals);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateNewMonthSubBudget_whenMonthlyBudgetGoalsIsNull_thenReturnEmptyOptional(){
        Budget budget = new Budget();
        BigDecimal totalIncome = new BigDecimal("3260");
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        LocalDate endDate = LocalDate.of(2025, 1, 31);
        Optional<SubBudget> actual = subBudgetBuilderService.createNewMonthSubBudget(budget, startDate, endDate, totalIncome, null);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateNewMonthSubBudget_whenBudgetValid_thenReturnJanuarySubBudget(){
        BigDecimal totalIncome = new BigDecimal("3260");
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        LocalDate endDate = LocalDate.of(2025, 1, 31);

        SubBudget expectedSubBudget = new SubBudget();
        expectedSubBudget.setActive(true);
        expectedSubBudget.setAllocatedAmount(new BigDecimal("3260"));
        expectedSubBudget.setSubSavingsTarget(new BigDecimal("250"));
        expectedSubBudget.setSubSavingsAmount(new BigDecimal("120"));
        expectedSubBudget.setBudget(budget);
        expectedSubBudget.setSpentOnBudget(new BigDecimal("300"));
        expectedSubBudget.setSubBudgetName("January Budget");
        expectedSubBudget.setStartDate(LocalDate.of(2025, 1, 1));
        expectedSubBudget.setEndDate(LocalDate.of(2025, 1, 31));

        BudgetSchedule januaryBudgetSchedule = new BudgetSchedule();
        januaryBudgetSchedule.setBudgetId(1L);
        januaryBudgetSchedule.setPeriod(Period.MONTHLY);
        januaryBudgetSchedule.setStartDate(startDate);
        januaryBudgetSchedule.setEndDate(endDate);
        januaryBudgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
        januaryBudgetSchedule.setStatus("Active");
        januaryBudgetSchedule.setTotalPeriods(4);
        List<BudgetScheduleRange> januaryBudgetScheduleRanges = generateJanuaryBudgetScheduleRanges();
        januaryBudgetSchedule.setBudgetScheduleRanges(januaryBudgetScheduleRanges);
        expectedSubBudget.setBudgetSchedule(List.of(januaryBudgetSchedule));

        Mockito.when(budgetCalculations.calculateActualMonthlyAllocation(anyDouble(), anyDouble(), anyDouble(), any(BigDecimal.class), anyInt()))
                .thenReturn(new BigDecimal("250"));

        Mockito.when(budgetCalculations.calculateTotalBudgetForSubBudget(any(Budget.class), anyDouble(), anyInt()))
                .thenReturn(new BigDecimal("3260"));

        Mockito.when(budgetCalculations.calculateMonthlySubBudgetSavingsTargetAmount(anyDouble(), anyInt(), anyDouble(), anyDouble()))
                        .thenReturn(new BigDecimal("250"));

        Mockito.when(budgetScheduleEngine.createMonthSubBudgetSchedule(any(SubBudget.class)))
                .thenReturn(Optional.of(januaryBudgetSchedule));

        Optional<SubBudget> expectedSubBudgetOptional = Optional.of(expectedSubBudget);
        Optional<SubBudget> actual = subBudgetBuilderService.createNewMonthSubBudget(budget, startDate, endDate, totalIncome, budgetGoals);
        SubBudget actualSubBudget = actual.get();

        // Assertions: Check each attribute separately
        assertEquals(expectedSubBudget.getSubBudgetName(), actualSubBudget.getSubBudgetName(), "SubBudget name mismatch");
        assertEquals(expectedSubBudget.getStartDate(), actualSubBudget.getStartDate(), "Start date mismatch");
        assertEquals(expectedSubBudget.getEndDate(), actualSubBudget.getEndDate(), "End date mismatch");
        assertEquals(expectedSubBudget.getAllocatedAmount(), actualSubBudget.getAllocatedAmount(), "Allocated amount mismatch");
        assertEquals(expectedSubBudget.getSubSavingsTarget(), actualSubBudget.getSubSavingsTarget(), "Sub savings target mismatch");
        assertEquals(expectedSubBudget.getSubSavingsAmount(), actualSubBudget.getSubSavingsAmount(), "Sub savings amount mismatch");
        assertEquals(expectedSubBudget.getSpentOnBudget(), actualSubBudget.getSpentOnBudget(), "Spent on budget mismatch");
        assertEquals(expectedSubBudget.isActive(), actualSubBudget.isActive(), "SubBudget active status mismatch");
        assertEquals(expectedSubBudget.getBudget(), actualSubBudget.getBudget(), "Budget mismatch");

        // Assertions: Check budget schedules
        assertNotNull(actualSubBudget.getBudgetSchedule(), "Budget schedule should not be null");
        assertEquals(1, actualSubBudget.getBudgetSchedule().size(), "Expected only one budget schedule");

        BudgetSchedule actualSchedule = actualSubBudget.getBudgetSchedule().get(0);
        assertEquals(januaryBudgetSchedule.getBudgetId(), actualSchedule.getBudgetId(), "Budget ID mismatch");
        assertEquals(januaryBudgetSchedule.getPeriod(), actualSchedule.getPeriod(), "Period mismatch");
        assertEquals(januaryBudgetSchedule.getStartDate(), actualSchedule.getStartDate(), "Schedule start date mismatch");
        assertEquals(januaryBudgetSchedule.getEndDate(), actualSchedule.getEndDate(), "Schedule end date mismatch");
        assertEquals(januaryBudgetSchedule.getScheduleRange(), actualSchedule.getScheduleRange(), "Schedule range mismatch");
        assertEquals(januaryBudgetSchedule.getStatus(), actualSchedule.getStatus(), "Status mismatch");
        assertEquals(januaryBudgetSchedule.getTotalPeriods(), actualSchedule.getTotalPeriods(), "Total periods mismatch");

        // Assertions: Check budget schedule ranges
        assertNotNull(actualSchedule.getBudgetScheduleRanges(), "Budget schedule ranges should not be null");
        assertEquals(januaryBudgetScheduleRanges.size(), actualSchedule.getBudgetScheduleRanges().size(), "Budget schedule range count mismatch");

        for (int i = 0; i < januaryBudgetScheduleRanges.size(); i++) {
            BudgetScheduleRange expectedRange = januaryBudgetScheduleRanges.get(i);
            BudgetScheduleRange actualRange = actualSchedule.getBudgetScheduleRanges().get(i);

            assertEquals(expectedRange.getStartRange(), actualRange.getStartRange(), "Budget schedule range start date mismatch");
            assertEquals(expectedRange.getEndRange(), actualRange.getEndRange(), "Budget schedule range end date mismatch");
            assertEquals(expectedRange.getBudgetedAmount(), actualRange.getBudgetedAmount(), "Budgeted amount mismatch");
            assertEquals(expectedRange.getSpentOnRange(), actualRange.getSpentOnRange(), "Spent amount mismatch");
            assertEquals(expectedRange.getRangeType(), actualRange.getRangeType(), "Range type mismatch");
            assertEquals(expectedRange.isSingleDate(), actualRange.isSingleDate(), "Single date flag mismatch");
        }
    }

    private List<BudgetScheduleRange> generateJanuaryBudgetScheduleRanges(){
        List<BudgetScheduleRange> budgetScheduleRanges = new ArrayList<>();
        BudgetScheduleRange januaryFirstWeek = new BudgetScheduleRange();
        januaryFirstWeek.setBudgetedAmount(new BigDecimal("120"));
        januaryFirstWeek.setStartRange(LocalDate.of(2025, 1, 1));
        januaryFirstWeek.setEndRange(LocalDate.of(2025, 1, 7));
        januaryFirstWeek.setSpentOnRange(new BigDecimal("95"));
        januaryFirstWeek.setRangeType("Week");
        januaryFirstWeek.setSingleDate(false);

        BudgetScheduleRange januarySecondWeek = new BudgetScheduleRange();
        januarySecondWeek.setBudgetDateRange(new DateRange(LocalDate.of(2025, 1, 8), LocalDate.of(2025, 1, 14)));
        januarySecondWeek.setSingleDate(false);
        januarySecondWeek.setBudgetedAmount(new BigDecimal("120"));
        januarySecondWeek.setStartRange(LocalDate.of(2025, 1, 8));
        januarySecondWeek.setEndRange(LocalDate.of(2025, 1, 14));
        januarySecondWeek.setSpentOnRange(new BigDecimal("100"));

        BudgetScheduleRange januaryThirdWeek = new BudgetScheduleRange();
        januaryThirdWeek.setStartRange(LocalDate.of(2025, 1, 15));
        januaryThirdWeek.setEndRange(LocalDate.of(2025, 1, 22));
        januaryThirdWeek.setBudgetedAmount(new BigDecimal("120"));
        januaryThirdWeek.setBudgetDateRange(new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 22)));
        januaryThirdWeek.setRangeType("Week");
        januaryThirdWeek.setSpentOnRange(new BigDecimal("85"));
        januaryThirdWeek.setSingleDate(false);

        BudgetScheduleRange januaryFourthWeek = new BudgetScheduleRange();
        januaryFourthWeek.setSingleDate(false);
        januaryFourthWeek.setStartRange(LocalDate.of(2025, 1, 23));
        januaryFourthWeek.setEndRange(LocalDate.of(2025, 1, 31));
        januaryFourthWeek.setSpentOnRange(new BigDecimal("85"));
        januaryFourthWeek.setBudgetDateRange(new DateRange(LocalDate.of(2025, 1, 23), LocalDate.of(2025, 1, 31)));
        januaryFourthWeek.setRangeType("Week");

        budgetScheduleRanges.add(januaryFirstWeek);
        budgetScheduleRanges.add(januarySecondWeek);
        budgetScheduleRanges.add(januaryThirdWeek);
        budgetScheduleRanges.add(januaryFourthWeek);
        return budgetScheduleRanges;
    }


    @AfterEach
    void tearDown() {
    }
}