package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetEntity;
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
import java.time.YearMonth;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;

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
        testBudgetRegistration.setBudgetName("New Car Fund");
        testBudgetRegistration.setBudgetDescription("Saving for a new car");
        testBudgetRegistration.setBudgetMode(BudgetMode.SAVINGS_PLAN);
        testBudgetRegistration.setBudgetPeriod(Period.MONTHLY);
        testBudgetRegistration.setBudgetYear(2025);
        testBudgetRegistration.setBudgetStartDate(LocalDate.of(2025, 1, 1));

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
        testBudgetRegistration.setTotalIncomeAmount(BigDecimal.valueOf(3000));
        testBudgetRegistration.setNumberOfMonths(4);
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
        budget.setActual(new BigDecimal("0"));        // Amount already saved or spent
        budget.setBudgetAmount(new BigDecimal("2800.00")); // Total planned budget
        budget.setBudgetYear(2025);
        budget.setBudgetDescription("Saving for a new car");
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

        BudgetSchedule februaryBudgetSchedule = new BudgetSchedule();
        februaryBudgetSchedule.setPeriod(Period.MONTHLY);
        februaryBudgetSchedule.setBudgetId(1L);
        februaryBudgetSchedule.setStatus("Active");
        februaryBudgetSchedule.setStartDate(LocalDate.of(2025, 2, 1));
        februaryBudgetSchedule.setEndDate(LocalDate.of(2025, 2, 28));
        januaryBudgetSchedule.setScheduleRange(new DateRange(
                LocalDate.of(2025, 2, 1),
                LocalDate.of(2025, 2, 28)
        ));
        februaryBudgetSchedule.setTotalPeriods(4);
        februaryBudgetSchedule.initializeBudgetDateRanges();

        // Create a SavingsGoal object with realistic values
        // Instead of a separate SavingsGoal, use the new fields on Budget
        budget.setSavingsAmountAllocated(new BigDecimal("200.00")); // e.g., amount actually allocated so far
        budget.setSavingsProgress(new BigDecimal("80.00"));         // could be percentage or total saved
        budget.setTotalMonthsToSave(4);                             // e.g., saving over 4 months

        // Attach the schedule(s) and savings goal to the budget
        budget.setBudgetSchedules(List.of(januaryBudgetSchedule, februaryBudgetSchedule));

        // Set your expected and actual results
        Optional<Budget> expected = Optional.of(budget);

        Mockito.when(budgetCalculations.calculateActualMonthlyAllocation(anyDouble(), anyDouble(), anyDouble(), any(BigDecimal.class), anyInt()))
                .thenReturn(new BigDecimal("200.00"));

        Mockito.when(budgetCalculations.calculateSavingsProgress(any(BigDecimal.class), any(BigDecimal.class), any(BigDecimal.class)))
                .thenReturn(new BigDecimal("80.00"));

        Mockito.when(budgetScheduleEngine.createMonthBudgetSchedule(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Optional.of(januaryBudgetSchedule));

        // Build a mock BudgetEntity with the same data as the expected Budget
        BudgetEntity savedEntity = BudgetEntity.builder()
                .id(1L)
                .budgetName("New Car Fund")
                .budgetDescription("Saving for a new car")
                .budgetAmount(new BigDecimal("3000.00"))
                .budgetActualAmount(new BigDecimal("500.00"))
                .budgetMode(BudgetMode.SAVINGS_PLAN)
                .budgetPeriod(Period.MONTHLY)
                .budgetYear(2025)
                .budgetStartDate(LocalDate.of(2025, 1, 1))
                .actualAllocationAmount(new BigDecimal("200.00"))
                .savingsProgress(new BigDecimal("80.00"))
                .totalMonthsToSave(4)
                // fill in other fields if needed
                .build();

        Mockito.when(budgetService.saveBudget(any(Budget.class)))
                .thenReturn(Optional.of(savedEntity));

        Optional<Budget> actual = budgetBuilderService.buildBudgetFromRegistration(testBudgetRegistration);

        // Multiple asserts to pinpoint mismatches:
        assertEquals(expected.get().getId(), actual.get().getId(), "Budget ID mismatch");
        assertEquals(expected.get().getBudgetAmount(), actual.get().getBudgetAmount(), "Budget amount mismatch");
        assertEquals(expected.get().getActual(), actual.get().getActual(), "Actual mismatch");
        assertEquals(expected.get().getUserId(), actual.get().getUserId(), "User ID mismatch");
        assertEquals(expected.get().getBudgetName(), actual.get().getBudgetName(), "Budget Name mismatch");
        assertEquals(expected.get().getBudgetDescription(), actual.get().getBudgetDescription(), "Budget Description mismatch");
        assertEquals(expected.get().getBudgetYear(), actual.get().getBudgetYear(), "Budget Year mismatch");
        assertEquals(expected.get().getBudgetStartDate(), actual.get().getBudgetStartDate(), "Budget Start Date mismatch");
        assertEquals(expected.get().getBudgetPeriod(), actual.get().getBudgetPeriod(), "Budget Period mismatch");
        assertEquals(expected.get().getBudgetMode(), actual.get().getBudgetMode(), "Budget Mode mismatch");
        assertEquals(expected.get().getSavingsAmountAllocated(), actual.get().getSavingsAmountAllocated(), "Savings Amount Allocated mismatch");
        assertEquals(expected.get().getSavingsProgress(), actual.get().getSavingsProgress(), "Savings Progress mismatch");
        assertEquals(expected.get().getTotalMonthsToSave(), actual.get().getTotalMonthsToSave(), "Total Months to Save mismatch");
        assertEquals(expected.get().getCreatedDate(), actual.get().getCreatedDate(), "Created Date mismatch");

        // If you have categories or schedules, you can similarly compare them. For example:
        assertEquals(expected.get().getControlledBudgetCategories(), actual.get().getControlledBudgetCategories(),
                "Controlled Budget Categories mismatch");
        assertEquals(expected.get().getBudgetSchedules().size(), actual.get().getBudgetSchedules().size(),
                "Budget Schedules mismatch");
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

    @Test
    void testCreateMonthlyBudgetDateRanges_whenDateRangesSetIsNull_thenReturnEmptyList(){
        Map<BudgetMonth, List<DateRange>> actual = budgetBuilderService.createMonthlyBudgetDateRanges(null);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateMonthlyBudgetDateRanges_whenDateRangesSetIsEmpty_thenReturnEmptyList(){
        Map<BudgetMonth, List<DateRange>> actual = budgetBuilderService.createMonthlyBudgetDateRanges(Set.of());
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateMonthlyBudgetDateRanges_whenDateRangesIsValid_thenReturnBudgetStartAndEndDates(){
        Set<DateRange> januaryFebMarchDateRanges = new HashSet<>();
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 1, 8), LocalDate.of(2025, 1, 14)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 21)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 1, 22), LocalDate.of(2025, 1, 28)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 1, 29), LocalDate.of(2025, 1, 31)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 7)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 2, 8), LocalDate.of(2025, 2, 14)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 2, 15), LocalDate.of(2025, 2, 21)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 2, 22), LocalDate.of(2025, 2, 28)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 7)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 3, 8), LocalDate.of(2025, 3, 14)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 3, 15), LocalDate.of(2025, 3, 21)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 3, 22), LocalDate.of(2025, 3, 28)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 3, 29), LocalDate.of(2025, 3, 31)));

        Map<BudgetMonth, List<DateRange>> budgetMonthDateRanges = new HashMap<>();
        BudgetMonth januaryMonth = new BudgetMonth(YearMonth.of(2025, 1));
        List<DateRange> januaryDateRanges = List.of(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7)),
                new DateRange(LocalDate.of(2025, 1, 8), LocalDate.of(2025, 1, 14)),
                        new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 21)),
                                new DateRange(LocalDate.of(2025, 1, 22), LocalDate.of(2025, 1, 28)),
                                        new DateRange(LocalDate.of(2025, 1, 29), LocalDate.of(2025, 1, 31)));
        BudgetMonth februaryMonth = new BudgetMonth(YearMonth.of(2025, 2));
        List<DateRange> februaryDateRanges = List.of(
                new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 7)),
                new DateRange(LocalDate.of(2025, 2, 8), LocalDate.of(2025, 2, 14)),
                new DateRange(LocalDate.of(2025, 2, 15), LocalDate.of(2025, 2, 21)),
                new DateRange(LocalDate.of(2025, 2, 22), LocalDate.of(2025, 2, 28))
        );
        BudgetMonth marchMonth = new BudgetMonth(YearMonth.of(2025, 3));
        List<DateRange> marchDateRanges = List.of(
                new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 7)),
                new DateRange(LocalDate.of(2025, 3, 8), LocalDate.of(2025, 3, 14)),
                new DateRange(LocalDate.of(2025, 3, 15), LocalDate.of(2025, 3, 21)),
                new DateRange(LocalDate.of(2025, 3, 22), LocalDate.of(2025, 3, 28)),
                new DateRange(LocalDate.of(2025, 3, 29), LocalDate.of(2025, 3, 31))
        );
        budgetMonthDateRanges.put(januaryMonth, januaryDateRanges);
        budgetMonthDateRanges.put(februaryMonth, februaryDateRanges);
        budgetMonthDateRanges.put(marchMonth, marchDateRanges);

        Map<BudgetMonth, List<DateRange>> actual = budgetBuilderService.createMonthlyBudgetDateRanges(januaryFebMarchDateRanges);
        assertNotNull(actual);
        assertEquals(budgetMonthDateRanges.size(), actual.size());
        for (Map.Entry<BudgetMonth, List<DateRange>> expectedEntry : actual.entrySet()) {
            BudgetMonth expectedMonth = expectedEntry.getKey();
            List<DateRange> expectedRanges = expectedEntry.getValue();

            // 1) Ensure the month is present in the actual map
            assertTrue(actual.containsKey(expectedMonth),
                    "Missing month in actual result: " + expectedMonth);

            // 2) Compare the list of ranges
            List<DateRange> actualRanges = actual.get(expectedMonth);
            assertNotNull(actualRanges,
                    "List of ranges for " + expectedMonth + " should not be null");
            assertEquals(expectedRanges.size(), actualRanges.size(),
                    "Number of date ranges does not match for " + expectedMonth);

            // 3) Compare contents -- if order doesn't matter, ensure your DateRange has proper equals.
            assertEquals(expectedRanges, actualRanges,
                    "Date ranges differ for month: " + expectedMonth);
        }
    }

    @Test
    void testCreateMonthlyBudgetDateRanges_whenDateRangesIsFoundNull_thenSkipDateRangeAndReturnBudgetDateRanges()
    {
        Set<DateRange> januaryFebMarchDateRanges = new HashSet<>();
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 1, 8), LocalDate.of(2025, 1, 14)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 21)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 1, 22), LocalDate.of(2025, 1, 28)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 1, 29), LocalDate.of(2025, 1, 31)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 7)));
        januaryFebMarchDateRanges.add(null);
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 2, 15), LocalDate.of(2025, 2, 21)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 2, 22), LocalDate.of(2025, 2, 28)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 7)));
        januaryFebMarchDateRanges.add(null);
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 3, 15), LocalDate.of(2025, 3, 21)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 3, 22), LocalDate.of(2025, 3, 28)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 3, 29), LocalDate.of(2025, 3, 31)));

        Map<BudgetMonth, List<DateRange>> budgetMonthDateRanges = new HashMap<>();
        BudgetMonth januaryMonth = new BudgetMonth(YearMonth.of(2025, 1));
        List<DateRange> januaryDateRanges = List.of(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7)),
                new DateRange(LocalDate.of(2025, 1, 8), LocalDate.of(2025, 1, 14)),
                new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 21)),
                new DateRange(LocalDate.of(2025, 1, 22), LocalDate.of(2025, 1, 28)),
                new DateRange(LocalDate.of(2025, 1, 29), LocalDate.of(2025, 1, 31)));
        BudgetMonth februaryMonth = new BudgetMonth(YearMonth.of(2025, 2));
        List<DateRange> februaryDateRanges = List.of(
                new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 7)),
                new DateRange(LocalDate.of(2025, 2, 15), LocalDate.of(2025, 2, 21)),
                new DateRange(LocalDate.of(2025, 2, 22), LocalDate.of(2025, 2, 28))
        );
        BudgetMonth marchMonth = new BudgetMonth(YearMonth.of(2025, 3));
        List<DateRange> marchDateRanges = List.of(
                new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 7)),
                new DateRange(LocalDate.of(2025, 3, 15), LocalDate.of(2025, 3, 21)),
                new DateRange(LocalDate.of(2025, 3, 22), LocalDate.of(2025, 3, 28)),
                new DateRange(LocalDate.of(2025, 3, 29), LocalDate.of(2025, 3, 31))
        );
        budgetMonthDateRanges.put(januaryMonth, januaryDateRanges);
        budgetMonthDateRanges.put(februaryMonth, februaryDateRanges);
        budgetMonthDateRanges.put(marchMonth, marchDateRanges);

        Map<BudgetMonth, List<DateRange>> actual = budgetBuilderService.createMonthlyBudgetDateRanges(januaryFebMarchDateRanges);
        assertNotNull(actual);
        assertEquals(budgetMonthDateRanges.size(), actual.size());
        for (Map.Entry<BudgetMonth, List<DateRange>> expectedEntry : actual.entrySet()) {
            BudgetMonth expectedMonth = expectedEntry.getKey();
            List<DateRange> expectedRanges = expectedEntry.getValue();

            // 1) Ensure the month is present in the actual map
            assertTrue(actual.containsKey(expectedMonth),
                    "Missing month in actual result: " + expectedMonth);

            // 2) Compare the list of ranges
            List<DateRange> actualRanges = actual.get(expectedMonth);
            assertNotNull(actualRanges,
                    "List of ranges for " + expectedMonth + " should not be null");
            assertEquals(expectedRanges.size(), actualRanges.size(),
                    "Number of date ranges does not match for " + expectedMonth);

            // 3) Compare contents -- if order doesn't matter, ensure your DateRange has proper equals.
            assertEquals(expectedRanges, actualRanges,
                    "Date ranges differ for month: " + expectedMonth);
        }
    }

    @Test
    void testCreateMonthlyBudgetDateRanges_whenStartDatesAreNull_thenSkipAndReturnBudgetDateRanges()
    {
        Set<DateRange> januaryFebMarchDateRanges = new HashSet<>();
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 1, 8), LocalDate.of(2025, 1, 14)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 21)));
        januaryFebMarchDateRanges.add(new DateRange(null, LocalDate.of(2025, 1, 28)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 1, 29), LocalDate.of(2025, 1, 31)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 7)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 2, 8), LocalDate.of(2025, 2, 14)));
        januaryFebMarchDateRanges.add(new DateRange(null, LocalDate.of(2025, 2, 21)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 2, 22), LocalDate.of(2025, 2, 28)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 7)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 3, 8), LocalDate.of(2025, 3, 14)));
        januaryFebMarchDateRanges.add(new DateRange(null, LocalDate.of(2025, 3, 21)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 3, 22), LocalDate.of(2025, 3, 28)));
        januaryFebMarchDateRanges.add(new DateRange(LocalDate.of(2025, 3, 29), LocalDate.of(2025, 3, 31)));

        Map<BudgetMonth, List<DateRange>> budgetMonthDateRanges = new HashMap<>();
        BudgetMonth januaryMonth = new BudgetMonth(YearMonth.of(2025, 1));
        List<DateRange> januaryDateRanges = List.of(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7)),
                new DateRange(LocalDate.of(2025, 1, 8), LocalDate.of(2025, 1, 14)),
                new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 21)),
                new DateRange(LocalDate.of(2025, 1, 29), LocalDate.of(2025, 1, 31)));
        BudgetMonth februaryMonth = new BudgetMonth(YearMonth.of(2025, 2));
        List<DateRange> februaryDateRanges = List.of(
                new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 7)),
                new DateRange(LocalDate.of(2025, 2, 8), LocalDate.of(2025, 2, 14)),
                new DateRange(LocalDate.of(2025, 2, 22), LocalDate.of(2025, 2, 28))
        );
        BudgetMonth marchMonth = new BudgetMonth(YearMonth.of(2025, 3));
        List<DateRange> marchDateRanges = List.of(
                new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 7)),
                new DateRange(LocalDate.of(2025, 3, 8), LocalDate.of(2025, 3, 14)),
                new DateRange(LocalDate.of(2025, 3, 22), LocalDate.of(2025, 3, 28)),
                new DateRange(LocalDate.of(2025, 3, 29), LocalDate.of(2025, 3, 31))
        );
        budgetMonthDateRanges.put(januaryMonth, januaryDateRanges);
        budgetMonthDateRanges.put(februaryMonth, februaryDateRanges);
        budgetMonthDateRanges.put(marchMonth, marchDateRanges);

        Map<BudgetMonth, List<DateRange>> actual = budgetBuilderService.createMonthlyBudgetDateRanges(januaryFebMarchDateRanges);
        assertNotNull(actual);
        assertEquals(budgetMonthDateRanges.size(), actual.size());
        for (Map.Entry<BudgetMonth, List<DateRange>> expectedEntry : actual.entrySet()) {
            BudgetMonth expectedMonth = expectedEntry.getKey();
            List<DateRange> expectedRanges = expectedEntry.getValue();

            // 1) Ensure the month is present in the actual map
            assertTrue(actual.containsKey(expectedMonth),
                    "Missing month in actual result: " + expectedMonth);

            // 2) Compare the list of ranges
            List<DateRange> actualRanges = actual.get(expectedMonth);
            assertNotNull(actualRanges,
                    "List of ranges for " + expectedMonth + " should not be null");
            assertEquals(expectedRanges.size(), actualRanges.size(),
                    "Number of date ranges does not match for " + expectedMonth);

            // 3) Compare contents -- if order doesn't matter, ensure your DateRange has proper equals.
            assertEquals(expectedRanges, actualRanges,
                    "Date ranges differ for month: " + expectedMonth);
        }
    }

    @Test
    void testGetBudgetStartAndEndDateCriteria_whenBudgetDateRangeMapIsNull_thenReturnEmptyList(){
        List<DateRange> actual = budgetBuilderService.getBudgetStartAndEndDateCriteria(null);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGetBudgetStartAndEndDateCriteria_whenBudgetDateRangeMapIsEmpty_thenReturnEmptyList(){
        List<DateRange> actual = budgetBuilderService.getBudgetStartAndEndDateCriteria(new HashMap<>());
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGetBudgetStartAndEndDateCriteria_whenBudgetDateRangeMapIsNotEmpty_thenReturnDateRanges()
    {
        Map<BudgetMonth, List<DateRange>> budgetMonthDateRanges = new HashMap<>();
        BudgetMonth januaryMonth = new BudgetMonth(YearMonth.of(2025, 1));
        List<DateRange> januaryDateRanges = List.of(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7)),
                new DateRange(LocalDate.of(2025, 1, 8), LocalDate.of(2025, 1, 14)),
                new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 21)),
                new DateRange(LocalDate.of(2025, 1, 22), LocalDate.of(2025, 1, 28)),
                new DateRange(LocalDate.of(2025, 1, 29), LocalDate.of(2025, 1, 31)));
        BudgetMonth februaryMonth = new BudgetMonth(YearMonth.of(2025, 2));
        List<DateRange> februaryDateRanges = List.of(
                new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 7)),
                new DateRange(LocalDate.of(2025, 2, 8), LocalDate.of(2025, 2, 14)),
                new DateRange(LocalDate.of(2025, 2, 15), LocalDate.of(2025, 2, 21)),
                new DateRange(LocalDate.of(2025, 2, 22), LocalDate.of(2025, 2, 28))
        );
        BudgetMonth marchMonth = new BudgetMonth(YearMonth.of(2025, 3));
        List<DateRange> marchDateRanges = List.of(
                new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 7)),
                new DateRange(LocalDate.of(2025, 3, 8), LocalDate.of(2025, 3, 14)),
                new DateRange(LocalDate.of(2025, 3, 15), LocalDate.of(2025, 3, 21)),
                new DateRange(LocalDate.of(2025, 3, 22), LocalDate.of(2025, 3, 28)),
                new DateRange(LocalDate.of(2025, 3, 29), LocalDate.of(2025, 3, 31))
        );
        budgetMonthDateRanges.put(januaryMonth, januaryDateRanges);
        budgetMonthDateRanges.put(februaryMonth, februaryDateRanges);
        budgetMonthDateRanges.put(marchMonth, marchDateRanges);

        List<DateRange> expectedDateRanges = List.of(
                new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025,1,31)),
                new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)),
                new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31))
        );
        List<DateRange> actual = budgetBuilderService.getBudgetStartAndEndDateCriteria(budgetMonthDateRanges);
        assertNotNull(actual, "The result should not be null");
        assertEquals(expectedDateRanges.size(), actual.size(),
                "The number of collapsed date ranges should match");

        for (int i = 0; i < actual.size(); i++) {
            DateRange expected = expectedDateRanges.get(i);
            DateRange actualRange = actual.get(i);

            // Compare start date
            assertEquals(expected.getStartDate(), actualRange.getStartDate(),
                    "Start date at index " + i + " doesn't match");
            // Compare end date
            assertEquals(expected.getEndDate(), actualRange.getEndDate(),
                    "End date at index " + i + " doesn't match");
        }
    }

    @Test
    void testCreateBudgetByPeriod_whenUserIdIsNull_thenReturnEmptyOptional(){
        LocalDate monthStart = LocalDate.of(2025, 1, 1);
        LocalDate monthEnd = LocalDate.of(2025, 1, 31);
        Period period = Period.MONTHLY;
        Optional<Budget> actual = budgetBuilderService.createMonthBudget(null, monthStart, monthEnd);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateBudgetByPeriod_whenMonthStartIsNull_thenReturnEmptyOptional(){
        LocalDate monthEnd = LocalDate.of(2025, 1, 31);
        Long userId = 1L;
        Period period = Period.MONTHLY;
        Optional<Budget> actual = budgetBuilderService.createMonthBudget(userId, null, monthEnd);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateBudgetByPeriod_whenCriteriaValid_thenReturnBudget()
    {
        Long userId = 1L;
        LocalDate monthStart = LocalDate.of(2025, 1, 1);
        LocalDate monthEnd = LocalDate.of(2025, 1, 31);
        Period period = Period.MONTHLY;

        Budget expectedBudget = new Budget();
        expectedBudget.setUserId(userId);
        expectedBudget.setId(1L);
        expectedBudget.setBudgetPeriod(period);
        expectedBudget.setBudgetYear(2025);
        expectedBudget.setBudgetStartDate(monthStart);
        expectedBudget.setBudgetName("Savings Plan for January");
        expectedBudget.setBudgetDescription("Savings Plan for January");
        expectedBudget.setControlledBudgetCategories(List.of());
        expectedBudget.setSavingsAmountAllocated(new BigDecimal("250"));
        expectedBudget.setTotalMonthsToSave(1);
        expectedBudget.setSavingsProgress(new BigDecimal("100"));
        expectedBudget.setBudgetAmount(new BigDecimal("3010"));
        expectedBudget.setActual(new BigDecimal("1609"));

        BudgetSchedule januaryBudgetSchedule = new BudgetSchedule();
        januaryBudgetSchedule.setBudgetId(1L);
        januaryBudgetSchedule.setEndDate(monthEnd);
        januaryBudgetSchedule.setStartDate(monthStart);
        januaryBudgetSchedule.setTotalPeriods(4);
        januaryBudgetSchedule.setStatus("Active");
        januaryBudgetSchedule.setScheduleRange(new DateRange(monthStart, monthEnd));
        januaryBudgetSchedule.setPeriod(Period.MONTHLY);
        januaryBudgetSchedule.initializeBudgetDateRanges();
        expectedBudget.setBudgetSchedules(List.of(januaryBudgetSchedule));

        Optional<Budget> expectedBudgetOptional = Optional.of(expectedBudget);
        Optional<Budget> actual = budgetBuilderService.createMonthBudget(userId, monthStart, monthEnd);
        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(expectedBudgetOptional.get(), actual.get());
    }


    @AfterEach
    void tearDown() {
    }
}