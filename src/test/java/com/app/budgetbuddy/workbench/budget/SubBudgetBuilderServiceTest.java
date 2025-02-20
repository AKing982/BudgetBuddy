package com.app.budgetbuddy.workbench.budget;


import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BudgetService;
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
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
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

    @Mock
    private BudgetService budgetService;

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
        budget.setBudgetYear(2025);
        budget.setIncome(new BigDecimal("39120"));
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

        subBudgetBuilderService = new SubBudgetBuilderService(subBudgetService, budgetCalculations, budgetScheduleEngine, budgetService);
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
        januaryBudgetSchedule.setSubBudgetId(1L);
        januaryBudgetSchedule.setPeriod(Period.MONTHLY);
        januaryBudgetSchedule.setStartDate(startDate);
        januaryBudgetSchedule.setEndDate(endDate);
        januaryBudgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
        januaryBudgetSchedule.setStatus("Active");
        januaryBudgetSchedule.setTotalPeriods(4);
        List<BudgetScheduleRange> januaryBudgetScheduleRanges = generateJanuaryBudgetScheduleRanges();
        januaryBudgetSchedule.setBudgetScheduleRanges(januaryBudgetScheduleRanges);
        expectedSubBudget.setBudgetSchedule(List.of(januaryBudgetSchedule));

//        Mockito.when(budgetCalculations.calculateActualMonthlyAllocation(anyDouble(), anyDouble(), anyDouble(), any(BigDecimal.class), anyInt()))
//                .thenReturn(new BigDecimal("250"));

        Mockito.when(budgetCalculations.calculateTotalBudgetForSubBudget(any(Budget.class), anyDouble(), anyInt()))
                .thenReturn(new BigDecimal("3260"));

        Mockito.when(budgetCalculations.calculateMonthlySubBudgetSavingsTargetAmount(anyDouble(), anyInt(), anyDouble(), anyDouble()))
                        .thenReturn(new BigDecimal("250"));

        Mockito.when(budgetCalculations.calculateSubBudgetSavings(any(DateRange.class), anyLong()))
                        .thenReturn(new BigDecimal("120"));

        Mockito.when(budgetCalculations.calculateSubBudgetSpending(any(DateRange.class), anyLong()))
                        .thenReturn(new BigDecimal("300"));

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
        assertEquals(januaryBudgetSchedule.getSubBudgetId(), actualSchedule.getSubBudgetId(), "Budget ID mismatch");
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

    @Test
    void testCreateNewMonthSubBudget_whenNoBudgetDataForNewMonth_thenReturnSubBudget()
    {
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        LocalDate endDate = LocalDate.of(2025, 1, 31);
        BigDecimal monthlyIncome = BigDecimal.valueOf(3260);
        SubBudget expectedSubBudget = new SubBudget();
        expectedSubBudget.setSpentOnBudget(BigDecimal.ZERO);
        expectedSubBudget.setBudget(budget);
        expectedSubBudget.setStartDate(startDate);
        expectedSubBudget.setEndDate(endDate);
        expectedSubBudget.setAllocatedAmount(monthlyIncome);
        expectedSubBudget.setSubSavingsAmount(BigDecimal.ZERO);
        expectedSubBudget.setSubBudgetName("January Budget");
        expectedSubBudget.setActive(true);
        expectedSubBudget.setSubSavingsTarget(new BigDecimal("250"));

        List<BudgetSchedule> budgetSchedules = new ArrayList<>();
        BudgetSchedule januaryBudgetSchedule = new BudgetSchedule();
        januaryBudgetSchedule.setSubBudgetId(budget.getId());
        januaryBudgetSchedule.setStatus("Active");
        januaryBudgetSchedule.setTotalPeriods(4);
        januaryBudgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
        januaryBudgetSchedule.setPeriod(Period.MONTHLY);

        List<BudgetScheduleRange> budgetScheduleRanges = generateJanuaryBudgetScheduleRangesNoData();
        januaryBudgetSchedule.setBudgetScheduleRanges(budgetScheduleRanges);
        budgetSchedules.add(januaryBudgetSchedule);

        Optional<SubBudget> expectedSubBudgetOptional = Optional.of(expectedSubBudget);

        Mockito.when(budgetCalculations.calculateSubBudgetSavings(any(DateRange.class), anyLong()))
                        .thenReturn(new BigDecimal("0"));

        Mockito.when(budgetCalculations.calculateMonthlySubBudgetSavingsTargetAmount(anyDouble(), anyInt(), anyDouble(), anyDouble()))
                        .thenReturn(new BigDecimal("250"));

        Mockito.when(budgetCalculations.calculateSubBudgetSpending(any(DateRange.class), anyLong()))
                        .thenReturn(BigDecimal.ZERO);

        Mockito.when(budgetCalculations.calculateTotalBudgetForSubBudget(any(Budget.class), anyDouble(), anyInt()))
                        .thenReturn(new BigDecimal("3260"));

        Mockito.when(budgetScheduleEngine.createMonthSubBudgetSchedule(any(SubBudget.class)))
                .thenReturn(Optional.of(januaryBudgetSchedule));

        // Act: Call the method under test
        Optional<SubBudget> actualOptional = subBudgetBuilderService.createNewMonthSubBudget(budget, startDate, endDate, monthlyIncome, budgetGoals);

        // Assert: Ensure the sub-budget was created
        assertTrue(actualOptional.isPresent(), "Expected sub-budget to be present, but it was empty");
        SubBudget actualSubBudget = actualOptional.get();

        // Assert: Check each attribute
        assertEquals(expectedSubBudget.getSubBudgetName(), actualSubBudget.getSubBudgetName(), "Sub-budget name mismatch");
        assertEquals(expectedSubBudget.getStartDate(), actualSubBudget.getStartDate(), "Start date mismatch");
        assertEquals(expectedSubBudget.getEndDate(), actualSubBudget.getEndDate(), "End date mismatch");
        assertEquals(expectedSubBudget.getAllocatedAmount(), actualSubBudget.getAllocatedAmount(), "Allocated amount mismatch");
        assertEquals(expectedSubBudget.getSubSavingsAmount(), actualSubBudget.getSubSavingsAmount(), "Sub-savings amount mismatch");
        assertEquals(expectedSubBudget.getSubSavingsTarget(), actualSubBudget.getSubSavingsTarget(), "Sub-savings target mismatch");
        assertEquals(expectedSubBudget.getSpentOnBudget(), actualSubBudget.getSpentOnBudget(), "Spent on budget mismatch");
        assertEquals(expectedSubBudget.isActive(), actualSubBudget.isActive(), "Sub-budget active status mismatch");
        assertEquals(expectedSubBudget.getBudget(), actualSubBudget.getBudget(), "Budget mismatch");

        // Assert: Check budget schedules
        assertNotNull(actualSubBudget.getBudgetSchedule(), "Budget schedule should not be null");
        assertEquals(1, actualSubBudget.getBudgetSchedule().size(), "Expected one budget schedule");

        BudgetSchedule actualSchedule = actualSubBudget.getBudgetSchedule().get(0);
        assertEquals(januaryBudgetSchedule.getSubBudgetId(), actualSchedule.getSubBudgetId(), "Budget ID mismatch");
        assertEquals(januaryBudgetSchedule.getStatus(), actualSchedule.getStatus(), "Status mismatch");
        assertEquals(januaryBudgetSchedule.getPeriod(), actualSchedule.getPeriod(), "Period mismatch");
        assertEquals(januaryBudgetSchedule.getStartDate(), actualSchedule.getStartDate(), "Schedule start date mismatch");
        assertEquals(januaryBudgetSchedule.getEndDate(), actualSchedule.getEndDate(), "Schedule end date mismatch");
        assertEquals(januaryBudgetSchedule.getScheduleRange(), actualSchedule.getScheduleRange(), "Schedule range mismatch");
        assertEquals(januaryBudgetSchedule.getTotalPeriods(), actualSchedule.getTotalPeriods(), "Total periods mismatch");

        // Assert: Check budget schedule ranges
        assertNotNull(actualSchedule.getBudgetScheduleRanges(), "Budget schedule ranges should not be null");
        assertEquals(budgetScheduleRanges.size(), actualSchedule.getBudgetScheduleRanges().size(), "Budget schedule range count mismatch");

        for (int i = 0; i < budgetScheduleRanges.size(); i++) {
            BudgetScheduleRange expectedRange = budgetScheduleRanges.get(i);
            BudgetScheduleRange actualRange = actualSchedule.getBudgetScheduleRanges().get(i);

            assertEquals(expectedRange.getStartRange(), actualRange.getStartRange(), "Budget schedule range start date mismatch");
            assertEquals(expectedRange.getEndRange(), actualRange.getEndRange(), "Budget schedule range end date mismatch");
            assertEquals(expectedRange.getBudgetedAmount(), actualRange.getBudgetedAmount(), "Budgeted amount mismatch");
            assertEquals(expectedRange.getSpentOnRange(), actualRange.getSpentOnRange(), "Spent amount mismatch");
            assertEquals(expectedRange.getRangeType(), actualRange.getRangeType(), "Range type mismatch");
            assertEquals(expectedRange.isSingleDate(), actualRange.isSingleDate(), "Single date flag mismatch");
        }



    }

    @Test
    void testCreateMonthlySubBudgets_whenBudgetIsNull_thenReturnEmptyList() {
        List<SubBudget> actual = subBudgetBuilderService.createMonthlySubBudgets(null, budgetGoals);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateMonthlySubBudgets_whenBudgetAndGoalsValid_thenReturnSubBudgets(){

        // Build expected sub-budgets using the helper method
        List<SubBudget> expectedSubBudgets = List.of(
                buildSubBudgetForMonth(budget, 0),
                buildSubBudgetForMonth(budget, 1),
                buildSubBudgetForMonth(budget, 2),
                buildSubBudgetForMonth(budget, 3),
                buildSubBudgetForMonth(budget, 4),
                buildSubBudgetForMonth(budget, 5),
                buildSubBudgetForMonth(budget, 6),
                buildSubBudgetForMonth(budget, 7),
                buildSubBudgetForMonth(budget, 8),
                buildSubBudgetForMonth(budget, 9),
                buildSubBudgetForMonth(budget, 10),
                buildSubBudgetForMonth(budget, 11)
        );

        // Mocking budget calculations
        Mockito.when(budgetCalculations.calculateTotalBudgetForSubBudget(any(Budget.class), anyDouble(), anyInt()))
                .thenReturn(new BigDecimal("3260")); // Monthly allocation

        Mockito.when(budgetCalculations.calculateMonthlySubBudgetSavingsTargetAmount(anyDouble(), anyInt(), anyDouble(), anyDouble()))
                .thenReturn(new BigDecimal("250")); // Monthly savings target

        Mockito.when(budgetCalculations.calculateSubBudgetSavings(any(DateRange.class), any(Long.class)))
                .thenReturn(new BigDecimal("120")); // Monthly sub-savings amount

        Mockito.when(budgetCalculations.calculateSubBudgetSpending(any(DateRange.class), any(Long.class)))
                .thenReturn(BigDecimal.ZERO); // No spending in test scenario

        Mockito.when(budgetScheduleEngine.createMonthSubBudgetSchedule(any(SubBudget.class)))
                .thenAnswer(invocation -> {
                    SubBudget subBudget = invocation.getArgument(0);
                    return Optional.of(buildMockBudgetSchedule(subBudget));
                });

        // Act: Call the method under test
        List<SubBudget> actualSubBudgets = subBudgetBuilderService.createMonthlySubBudgets(budget, budgetGoals);

        // Assert: Check if the correct number of sub-budgets are created
        assertNotNull(actualSubBudgets, "Sub-budgets list should not be null");
        assertEquals(12, actualSubBudgets.size(), "Should create 12 sub-budgets for each month");

        // Verify each sub-budget's attributes
        for (int i = 0; i < 12; i++) {
            SubBudget expected = expectedSubBudgets.get(i);
            SubBudget actual = actualSubBudgets.get(i);

            System.out.println("Comparing sub-budget for month " + (i + 1));
            System.out.println("Expected Start Date: " + expected.getStartDate() + " | Actual Start Date: " + actual.getStartDate());
            System.out.println("Expected End Date: " + expected.getEndDate() + " | Actual End Date: " + actual.getEndDate());

            assertEquals(expected.getSubBudgetName(), actual.getSubBudgetName(), "Sub-budget name mismatch for month " + (i + 1));
            assertEquals(expected.getStartDate(), actual.getStartDate(), "Start date mismatch for month " + (i + 1));
            assertEquals(expected.getEndDate(), actual.getEndDate(), "End date mismatch for month " + (i + 1));
            assertEquals(expected.getAllocatedAmount(), actual.getAllocatedAmount(), "Allocated amount mismatch for month " + (i + 1));
            assertEquals(expected.getSubSavingsTarget(), actual.getSubSavingsTarget(), "Sub-savings target mismatch for month " + (i + 1));
            assertEquals(expected.getSubSavingsAmount(), actual.getSubSavingsAmount(), "Sub-savings amount mismatch for month " + (i + 1));
            assertEquals(expected.getSpentOnBudget(), actual.getSpentOnBudget(), "Spent on budget mismatch for month " + (i + 1));
            assertEquals(expected.isActive(), actual.isActive(), "Sub-budget active status mismatch for month " + (i + 1));
            assertEquals(expected.getBudget(), actual.getBudget(), "Budget mismatch for month " + (i + 1));
        }
    }

    @Test
    void testCreateSubBudgetTemplates_whenYearIsNegative_thenReturnEmptyList(){
        int year = -1;
        List<SubBudget> actual = subBudgetBuilderService.createSubBudgetTemplates(year, budget, budgetGoals);
        assertNotNull(actual);
        assertEquals(0, actual.size());
    }

    @Test
    void testCreateSubBudgetTemplates_whenBudgetIsNull_thenReturnEmptyList(){
        final int year = 2024;
        List<SubBudget> actual = subBudgetBuilderService.createSubBudgetTemplates(year, null, budgetGoals);
        assertNotNull(actual);
        assertEquals(0, actual.size());
    }

    @Test
    void testCreateSubBudgetTemplates_whenBudgetGoalsNull_thenReturnEmptyList(){
        final int year = 2024;
        List<SubBudget> actual = subBudgetBuilderService.createSubBudgetTemplates(year, budget, null);
        assertNotNull(actual);
        assertEquals(0, actual.size());
    }

    @Test
    void testCreateSubBudgetTemplates_shouldReturnSubBudgetsFor2024Year()
    {
        final int year = 2024;

        Budget budget = new Budget();
        budget.setStartDate(LocalDate.of(2024,1 ,1));
        budget.setEndDate(LocalDate.of(2024,12, 31));
        budget.setBudgetPeriod(Period.MONTHLY);
        budget.setBudgetMode(BudgetMode.SAVINGS_PLAN);
        budget.setBudgetName("Savings Budget Plan");
        budget.setBudgetDescription("Savings Budget Plan");
        budget.setTotalMonthsToSave(12);
        budget.setUserId(1L);
        budget.setId(1L);
        budget.setBudgetYear(2024);
        budget.setIncome(new BigDecimal("39120"));
        budget.setSavingsProgress(BigDecimal.ZERO);
        budget.setSavingsAmountAllocated(BigDecimal.ZERO);
        budget.setBudgetAmount(new BigDecimal("39120"));
        budget.setActual(new BigDecimal("1609"));

        List<SubBudget> result = subBudgetBuilderService.createSubBudgetTemplates(year, budget, budgetGoals);
        // Verify results
        assertNotNull(result);
        assertEquals(12, result.size(), "Should create 12 monthly sub-budgets");

        // Verify each month's SubBudget
        for (int month = 0; month < 12; month++) {
            SubBudget subBudget = result.get(month);
            LocalDate expectedStartDate = LocalDate.of(2024, month + 1, 1);
            LocalDate expectedEndDate = expectedStartDate.withDayOfMonth(expectedStartDate.lengthOfMonth());

            assertEquals(expectedStartDate, subBudget.getStartDate(),
                    "Start date mismatch for month " + (month + 1));
            assertEquals(expectedEndDate, subBudget.getEndDate(),
                    "End date mismatch for month " + (month + 1));
            assertEquals(new BigDecimal("3260.00"), subBudget.getAllocatedAmount(),
                    "Allocated amount mismatch for month " + (month + 1));
            assertEquals(new BigDecimal("208.33"), subBudget.getSubSavingsTarget(),
                    "Savings target mismatch for month " + (month + 1));
            assertEquals(budget, subBudget.getBudget(),
                    "Budget reference mismatch for month " + (month + 1));
            assertEquals("2024-" + String.format("%02d", month + 1) + " Budget",
                    subBudget.getSubBudgetName(),
                    "Budget name mismatch for month " + (month + 1));
            assertEquals(2024, subBudget.getYear(),
                    "Year mismatch for month " + (month + 1));
            assertTrue(subBudget.isActive(),
                    "SubBudget should be active for month " + (month + 1));
            assertEquals(BigDecimal.ZERO, subBudget.getSpentOnBudget(),
                    "Initial spent amount should be zero for month " + (month + 1));
            assertEquals(BigDecimal.ZERO, subBudget.getSubSavingsAmount(),
                    "Initial savings amount should be zero for month " + (month + 1));
        }
    }

    private BudgetSchedule buildMockBudgetSchedule(SubBudget subBudget) {
        return BudgetSchedule.builder()
                .subBudgetId(subBudget.getBudget().getId())
                .period(Period.MONTHLY)
                .startDate(subBudget.getStartDate())
                .endDate(subBudget.getEndDate())
                .scheduleRange(new DateRange(subBudget.getStartDate(), subBudget.getEndDate()))
                .status("Active")
                .totalPeriods(4)
                .budgetScheduleRanges(new ArrayList<>()) // You can mock actual ranges if needed
                .build();
    }

    private SubBudget buildSubBudgetForMonth(Budget budget, int monthOffset) {
        LocalDate monthStart = budget.getStartDate().plusMonths(monthOffset).withDayOfMonth(1);
        LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());

        // ✅ Correct month formatting: Capitalize first letter only
        String monthName = monthStart.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
        String subBudgetName = monthName + " Budget"; // "January Budget", "February Budget", etc.

        System.out.println("Building SubBudget for Month: " + monthStart.getMonth());
        System.out.println("Start Date: " + monthStart);
        System.out.println("End Date: " + monthEnd); // Debug output

        return SubBudget.buildSubBudget(
                true,
                new BigDecimal("3260"), // Monthly allocated amount
                new BigDecimal("250"),  // Mocked savings target per month
                new BigDecimal("120"),  // Mocked sub savings per month
                budget,
                BigDecimal.ZERO,  // No spending
                subBudgetName,
                monthStart,
                monthEnd
        );
    }

    private List<BudgetScheduleRange> generateJanuaryBudgetScheduleRangesNoData(){
        List<BudgetScheduleRange> budgetScheduleRanges = new ArrayList<>();
        BudgetScheduleRange januaryFirstWeek = new BudgetScheduleRange();
        januaryFirstWeek.setBudgetedAmount(new BigDecimal("120"));
        januaryFirstWeek.setStartRange(LocalDate.of(2025, 1, 1));
        januaryFirstWeek.setEndRange(LocalDate.of(2025, 1, 7));
        januaryFirstWeek.setSpentOnRange(BigDecimal.ZERO);
        januaryFirstWeek.setRangeType("Week");
        januaryFirstWeek.setSingleDate(false);

        BudgetScheduleRange januarySecondWeek = new BudgetScheduleRange();
        januarySecondWeek.setBudgetDateRange(new DateRange(LocalDate.of(2025, 1, 8), LocalDate.of(2025, 1, 14)));
        januarySecondWeek.setSingleDate(false);
        januarySecondWeek.setBudgetedAmount(new BigDecimal("120"));
        januarySecondWeek.setStartRange(LocalDate.of(2025, 1, 8));
        januarySecondWeek.setEndRange(LocalDate.of(2025, 1, 14));
        januarySecondWeek.setSpentOnRange(BigDecimal.ZERO);

        BudgetScheduleRange januaryThirdWeek = new BudgetScheduleRange();
        januaryThirdWeek.setStartRange(LocalDate.of(2025, 1, 15));
        januaryThirdWeek.setEndRange(LocalDate.of(2025, 1, 22));
        januaryThirdWeek.setBudgetedAmount(new BigDecimal("120"));
        januaryThirdWeek.setBudgetDateRange(new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 22)));
        januaryThirdWeek.setRangeType("Week");
        januaryThirdWeek.setSpentOnRange(BigDecimal.ZERO);
        januaryThirdWeek.setSingleDate(false);

        BudgetScheduleRange januaryFourthWeek = new BudgetScheduleRange();
        januaryFourthWeek.setSingleDate(false);
        januaryFourthWeek.setStartRange(LocalDate.of(2025, 1, 23));
        januaryFourthWeek.setEndRange(LocalDate.of(2025, 1, 31));
        januaryFourthWeek.setSpentOnRange(BigDecimal.ZERO);
        januaryFourthWeek.setBudgetDateRange(new DateRange(LocalDate.of(2025, 1, 23), LocalDate.of(2025, 1, 31)));
        januaryFourthWeek.setRangeType("Week");

        budgetScheduleRanges.add(januaryFirstWeek);
        budgetScheduleRanges.add(januarySecondWeek);
        budgetScheduleRanges.add(januaryThirdWeek);
        budgetScheduleRanges.add(januaryFourthWeek);
        return budgetScheduleRanges;
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