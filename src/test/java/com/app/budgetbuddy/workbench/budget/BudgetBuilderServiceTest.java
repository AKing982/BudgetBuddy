package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.BudgetBuildException;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.services.BudgetScheduleService;
import com.app.budgetbuddy.services.BudgetService;
import com.app.budgetbuddy.workbench.subBudget.SubBudgetBuilderService;
import com.app.budgetbuddy.workbench.subBudget.SubBudgetConverterUtil;
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
    private SubBudgetBuilderService subBudgetBuilderService;

    @Mock
    private BudgetCalculations budgetCalculations;

    @Mock
    private SubBudgetConverterUtil subBudgetConverterUtil;

    @Mock
    private BudgetGoalsService budgetGoalsService;

    @InjectMocks
    private BudgetBuilderService budgetBuilderService;

    private BudgetRegistration testBudgetRegistration;

    private BudgetRegistration budgetRegistrationMissingParams;

    private Budget budget;

    @BeforeEach
    void setUp() {

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
        budget.setSubBudgets(generateTestSubBudgets());
        budget.setBudgetAmount(new BigDecimal("39120"));
        budget.setActual(new BigDecimal("1609"));

        budgetBuilderService = new BudgetBuilderService(budgetService,budgetCalculations, subBudgetBuilderService, subBudgetConverterUtil, budgetGoalsService);

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
                250.0,      // currentSavings,
                "Savings Plan",
                "Savings Plan",
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
        // Create SubBudgets for January and February
        SubBudget januarySubBudget = new SubBudget();
        januarySubBudget.setId(1L);
        januarySubBudget.setSubBudgetName("January New Car Fund");
        januarySubBudget.setSpentOnBudget(BigDecimal.ZERO);
        januarySubBudget.setAllocatedAmount(new BigDecimal("2800.00"));
        januarySubBudget.setBudget(budget);
        januarySubBudget.setActive(true);
        januarySubBudget.setSubSavingsAmount(new BigDecimal("120"));
        januarySubBudget.setSubSavingsTarget(new BigDecimal("250"));

        SubBudget februarySubBudget = new SubBudget();
        februarySubBudget.setId(2L);
        februarySubBudget.setSubBudgetName("February New Car Fund");
        februarySubBudget.setSpentOnBudget(BigDecimal.ZERO);
        februarySubBudget.setAllocatedAmount(new BigDecimal("2800.00"));
        februarySubBudget.setBudget(budget);
        februarySubBudget.setActive(true);
        februarySubBudget.setSubSavingsAmount(new BigDecimal("120"));
        februarySubBudget.setSubSavingsTarget(new BigDecimal("250"));

        // Create Budget Schedules for each month
        BudgetSchedule januaryBudgetSchedule = new BudgetSchedule();
        januaryBudgetSchedule.setPeriodType(Period.MONTHLY);
        januaryBudgetSchedule.setSubBudgetId(1L);
        januaryBudgetSchedule.setStatus("Active");
        januaryBudgetSchedule.setStartDate(LocalDate.of(2025, 1, 1));
        januaryBudgetSchedule.setEndDate(LocalDate.of(2025, 1, 31));
        januaryBudgetSchedule.setScheduleRange(new DateRange(
                LocalDate.of(2025, 1, 1),
                LocalDate.of(2025, 1, 31)
        ));
        januaryBudgetSchedule.setTotalPeriods(4);
        januaryBudgetSchedule.initializeBudgetDateRanges();

        BudgetSchedule februaryBudgetSchedule = new BudgetSchedule();
        februaryBudgetSchedule.setPeriodType(Period.MONTHLY);
        februaryBudgetSchedule.setSubBudgetId(2L); // Correcting SubBudget ID
        februaryBudgetSchedule.setStatus("Active");
        februaryBudgetSchedule.setStartDate(LocalDate.of(2025, 2, 1));
        februaryBudgetSchedule.setEndDate(LocalDate.of(2025, 2, 28));
        februaryBudgetSchedule.setScheduleRange(new DateRange( // Fixing incorrect range assignment
                LocalDate.of(2025, 2, 1),
                LocalDate.of(2025, 2, 28)
        ));
        februaryBudgetSchedule.setTotalPeriods(4);
        februaryBudgetSchedule.initializeBudgetDateRanges();

        // Set savings details in Budget
        budget.setSavingsAmountAllocated(new BigDecimal("200.00"));
        budget.setSavingsProgress(new BigDecimal("80.00"));
        budget.setTotalMonthsToSave(4);
        budget.setSubBudgets(List.of(januarySubBudget, februarySubBudget));

        // Define expected Budget
        Optional<Budget> expected = Optional.of(budget);

        // **Mocking Services**
        Mockito.when(budgetCalculations.calculateActualMonthlyAllocation(anyDouble(), anyDouble(), anyDouble(), any(BigDecimal.class), anyInt()))
                .thenReturn(new BigDecimal("200.00"));

        Mockito.when(budgetCalculations.calculateSavingsProgress(any(BigDecimal.class), any(BigDecimal.class), any(BigDecimal.class)))
                .thenReturn(new BigDecimal("80.00"));

        // Fix: Ensure the correct entity is returned from `saveBudget`
        BudgetEntity savedBudgetEntity = new BudgetEntity();
        savedBudgetEntity.setId(1L);
        savedBudgetEntity.setBudgetAmount(new BigDecimal("5600.00"));
        savedBudgetEntity.setUser(UserEntity.builder().id(1L).build());
        savedBudgetEntity.setSavingsProgress(new BigDecimal("80.00"));
        savedBudgetEntity.setTotalMonthsToSave(4);

        Mockito.when(budgetService.saveBudget(any(Budget.class)))
                .thenReturn(Optional.of(savedBudgetEntity));

        // **Invoke the method under test**
        Optional<Budget> actual = budgetBuilderService.buildBudgetFromRegistration(testBudgetRegistration);

        // **Assertions**
        assertTrue(actual.isPresent(), "Budget should be present");
        assertEquals(expected.get().getBudgetAmount(), actual.get().getBudgetAmount(), "Budget amount mismatch");
        assertEquals(expected.get().getUserId(), actual.get().getUserId(), "User ID mismatch");
        assertEquals(expected.get().getSavingsAmountAllocated(), actual.get().getSavingsAmountAllocated(), "Savings Amount Allocated mismatch");
        assertEquals(expected.get().getSavingsProgress(), actual.get().getSavingsProgress(), "Savings Progress mismatch");
        assertEquals(expected.get().getTotalMonthsToSave(), actual.get().getTotalMonthsToSave(), "Total Months to Save mismatch");

        // **Check SubBudgets**
        assertNotNull(actual.get().getSubBudgets(), "SubBudgets should not be null");
        assertEquals(expected.get().getSubBudgets().size(), actual.get().getSubBudgets().size(), "SubBudget count mismatch");

        for (int i = 0; i < expected.get().getSubBudgets().size(); i++) {
            SubBudget expectedSubBudget = expected.get().getSubBudgets().get(i);
            SubBudget actualSubBudget = actual.get().getSubBudgets().get(i);

            assertEquals(expectedSubBudget.getSubBudgetName(), actualSubBudget.getSubBudgetName(), "SubBudget name mismatch");
            assertEquals(expectedSubBudget.getAllocatedAmount(), actualSubBudget.getAllocatedAmount(), "Allocated amount mismatch");
            assertEquals(expectedSubBudget.getSpentOnBudget(), actualSubBudget.getSpentOnBudget(), "Spent on budget mismatch");
            assertEquals(expectedSubBudget.getSubSavingsAmount(), actualSubBudget.getSubSavingsAmount(), "SubSavings amount mismatch");
            assertEquals(expectedSubBudget.getSubSavingsTarget(), actualSubBudget.getSubSavingsTarget(), "SubSavings target mismatch");
            assertEquals(expectedSubBudget.isActive(), actualSubBudget.isActive(), "SubBudget active status mismatch");
        }
    }



//    @Test
//    void testCreateBudgetSchedules_whenJanuaryBudgetAndMonthlyPeriod_thenReturnBudgetSchedules(){
//        List<DateRange> januaryDateRanges = new ArrayList<>();
//        januaryDateRanges.add(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7)));
//        januaryDateRanges.add(new DateRange(LocalDate.of(2025, 1,8), LocalDate.of(2025, 1, 14)));
//        januaryDateRanges.add(new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 21)));
//        januaryDateRanges.add(new DateRange(LocalDate.of(2025, 1, 22), LocalDate.of(2025, 1, 28)));
//        januaryDateRanges.add(new DateRange(LocalDate.of(2025, 1, 29), LocalDate.of(2025, 1, 31)));
//
//        Long userId = 1L;
//        Period period = Period.MONTHLY;
//
//        LocalDate monthStart = LocalDate.of(2025, 1, 1);
//        LocalDate monthEnd = LocalDate.of(2025, 1, 31);
//
//        BudgetSchedule januaryBudgetSchedule = new BudgetSchedule();
//        januaryBudgetSchedule.setPeriod(period);
//        januaryBudgetSchedule.setBudgetId(1L);
//        januaryBudgetSchedule.setStatus("Active");
//        januaryBudgetSchedule.setStartDate(LocalDate.of(2025, 1, 1));
//        januaryBudgetSchedule.setEndDate(LocalDate.of(2025, 1, 31));
//        januaryBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
//        januaryBudgetSchedule.setTotalPeriods(5);
//        januaryBudgetSchedule.initializeBudgetDateRanges();
//
//        Mockito.when(budgetScheduleEngine.createMonthBudgetSchedule(anyLong(), any(LocalDate.class), any(LocalDate.class)))
//                .thenReturn(Optional.of(januaryBudgetSchedule));
//
//        List<BudgetSchedule> expected = List.of(januaryBudgetSchedule);
//        List<BudgetSchedule> actual = budgetBuilderService.createBudgetSchedules(monthStart, monthEnd, userId);
//        assertNotNull(actual);
//        assertEquals(expected.size(), actual.size());
//        for(int i = 0; i < actual.size(); i++){
//            assertEquals(expected.get(i).getBudgetDateRanges().size(), actual.get(i).getBudgetDateRanges().size());
//            assertEquals(expected.get(i).getBudgetId(), actual.get(i).getBudgetId());
//            assertEquals(expected.get(i).getScheduleRange().getStartDate(), actual.get(i).getScheduleRange().getStartDate());
//            assertEquals(expected.get(i).getScheduleRange().getEndDate(), actual.get(i).getScheduleRange().getEndDate());
//            assertEquals(expected.get(i).getTotalPeriods(), actual.get(i).getTotalPeriods());
//            assertEquals(expected.get(i).getPeriod(), actual.get(i).getPeriod());
//            assertEquals(expected.get(i).getStatus(), actual.get(i).getStatus());
//        }
//    }

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

//
//    @Test
//    void testCreateNewMonthBudget_whenCriteriaValid_thenReturnBudget()
//    {
//        Long userId = 1L;
//        LocalDate monthStart = LocalDate.of(2025, 1, 1);
//        LocalDate monthEnd = LocalDate.of(2025, 1, 31);
//        BigDecimal totalIncome = new BigDecimal("3260");
//
//        Budget expectedBudget = new Budget();
//        expectedBudget.setUserId(userId);
//        expectedBudget.setId(1L);
//        expectedBudget.setBudgetPeriod(Period.MONTHLY);
//        expectedBudget.setBudgetStartDate(monthStart);
//        expectedBudget.setBudgetName("Savings Plan for January");
//        expectedBudget.setBudgetDescription("Savings Plan for January");
//        expectedBudget.setSavingsAmountAllocated(new BigDecimal("250"));
//        expectedBudget.setTotalMonthsToSave(1);
//        expectedBudget.setSavingsProgress(new BigDecimal("100"));
//        expectedBudget.setBudgetAmount(new BigDecimal("3010"));
//        expectedBudget.setActual(new BigDecimal("1609"));
//
//        BudgetSchedule januaryBudgetSchedule = new BudgetSchedule();
//        januaryBudgetSchedule.setBudgetId(1L);
//        januaryBudgetSchedule.setEndDate(monthEnd);
//        januaryBudgetSchedule.setStartDate(monthStart);
//        januaryBudgetSchedule.setTotalPeriods(4);
//        januaryBudgetSchedule.setStatus("Active");
//        januaryBudgetSchedule.setScheduleRange(new DateRange(monthStart, monthEnd));
//        januaryBudgetSchedule.setPeriod(Period.MONTHLY);
//        januaryBudgetSchedule.initializeBudgetDateRanges();
//
//        MonthlyBudgetGoals januaryBudgetGoals = new MonthlyBudgetGoals();
//        januaryBudgetGoals.setMonth(new BudgetMonth(2025, 1));
//        januaryBudgetGoals.setUserId(1L);
//        januaryBudgetGoals.setMonthlyStatus("Active");
//        januaryBudgetGoals.setMonthlySavingsTarget(250);
//        januaryBudgetGoals.setMonthlyContributed(150);
//        januaryBudgetGoals.setRemainingAmount(100);
//
//        List<Budget> pastBudgets = new ArrayList<>();
//
//        Optional<Budget> expectedBudgetOptional = Optional.of(expectedBudget);
//        Optional<Budget> actual = budgetBuilderService.createNewMonthBudget(pastBudgets, userId, monthStart, monthEnd, totalIncome, januaryBudgetGoals);
//        assertNotNull(actual);
//        assertTrue(actual.isPresent());
//        assertEquals(expectedBudgetOptional.get(), actual.get());
//    }

    private List<SubBudget> generateTestSubBudgets(){
        List<SubBudget> subBudgets = new ArrayList<>();
        // Generate a SubBudget for each month (1 through 12)
        for (int month = 1; month <= 12; month++) {
            // You can build month-based naming or logic here:
            YearMonth yearMonth = YearMonth.of(2025, month);  // example year 2025
            String subBudgetName = yearMonth.getMonth().name() + " SubBudget";

            // Example values for allocatedAmount, subSavingsTarget, etc.
            BigDecimal allocatedAmount = BigDecimal.valueOf(1000 + (month * 10));
            BigDecimal subSavingsTarget = BigDecimal.valueOf(200 + (month * 5));
            BigDecimal subSavingsAmount = BigDecimal.ZERO;
            BigDecimal spentOnBudget = BigDecimal.ZERO;

            // You can keep these lists empty if you're just testing
            List<BudgetSchedule> scheduleList = new ArrayList<>();
            List<ControlledBudgetCategory> categoryList = new ArrayList<>();

            LocalDate startMonth = YearMonth.now().atDay(1);
            LocalDate endMonth = YearMonth.now().atEndOfMonth();

            SubBudget subBudget = new SubBudget(
                    // id
                    (long) month,
                    // subBudgetName
                    subBudgetName,
                    // allocatedAmount
                    allocatedAmount,
                    // subSavingsTarget
                    subSavingsTarget,
                    // subSavingsAmount
                    subSavingsAmount,
                    // spentOnBudget
                    spentOnBudget,
                    // Parent Budget reference
                    budget,
                    startMonth,
                    endMonth,
                    // BudgetSchedule list
                    scheduleList,
                    // ControlledBudgetCategory list
                    categoryList,
                    // isActive
                    true
            );

            subBudgets.add(subBudget);
        }

        return subBudgets;
    }


    @AfterEach
    void tearDown() {
    }
}