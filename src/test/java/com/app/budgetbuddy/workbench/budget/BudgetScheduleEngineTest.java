package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.BudgetScheduleException;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.BudgetScheduleService;
import com.app.budgetbuddy.services.BudgetService;
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
class BudgetScheduleEngineTest {

    @InjectMocks
    private BudgetScheduleEngine budgetScheduleEngine;

    @Mock
    private BudgetService budgetService;

    @Mock
    private BudgetScheduleService budgetScheduleService;

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
        budget.setSavingsProgress(BigDecimal.ZERO);
        budget.setSavingsAmountAllocated(BigDecimal.ZERO);
        budget.setSubBudgets(generateTestSubBudgets());
        budget.setBudgetAmount(new BigDecimal("39120"));
        budget.setActual(new BigDecimal("1609"));

        budgetScheduleEngine = new BudgetScheduleEngine(budgetService, budgetScheduleService);
    }

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

            LocalDate startDate = yearMonth.atDay(1);
            LocalDate endDate = yearMonth.atEndOfMonth();

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
                    startDate,
                    endDate,
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

//    @Test
//    void testCreateMonthSubBudgetSchedule_whenBudgetIsNull_thenReturnEmptyOptional() {
//        LocalDate startDate = LocalDate.of(2025, 1, 1);
//        LocalDate endDate = LocalDate.of(2025, 12, 31);
//        Optional<BudgetSchedule> actual = budgetScheduleEngine.createMonthSubBudgetSchedule(null, startDate, endDate);
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testCreateMonthSubBudgetSchedule_whenStartDateIsNull_thenReturnEmptyOptional() {
//        LocalDate endDate = LocalDate.of(2025, 1, 1);
//        Optional<BudgetSchedule> actual = budgetScheduleEngine.createMonthSubBudgetSchedule(1L, null, endDate);
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testCreateMonthSubBudgetSchedule_whenEndDateIsNull_thenReturnEmptyOptional() {
//        LocalDate startDate = LocalDate.of(2025, 1, 1);
//        Optional<BudgetSchedule> actual = budgetScheduleEngine.createMonthSubBudgetSchedule(1L, startDate, null);
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testCreateMonthSubBudgetSchedule_whenJanuaryBudgetStartDateBeginningOfMonthAndEndDateLastDayOfMonth_thenReturnBudgetSchedule(){
//        LocalDate startDate = LocalDate.of(2025, 1, 1);
//        LocalDate endDate = LocalDate.of(2025, 1, 31);
//        Long userId = 1L;
//
//        BudgetSchedule budgetSchedule = new BudgetSchedule();
//        budgetSchedule.setStartDate(startDate);
//        budgetSchedule.setEndDate(endDate);
//        budgetSchedule.setPeriod(Period.MONTHLY);
//        budgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
//        budgetSchedule.setBudgetId(1L);
//        budgetSchedule.setStatus("Active");
//        budgetSchedule.setTotalPeriods(4);
//        budgetSchedule.initializeBudgetDateRanges();
//
//        BudgetScheduleRange budgetScheduleRange1 = new BudgetScheduleRange();
//        budgetScheduleRange1.setSingleDate(false);
//        budgetScheduleRange1.setStartRange(LocalDate.of(2025, 1, 1));
//        budgetScheduleRange1.setEndRange(LocalDate.of(2025, 1, 7));
//        budgetScheduleRange1.setBudgetedAmount(new BigDecimal("140"));
//        budgetScheduleRange1.setSpentOnRange(new BigDecimal("95"));
//        budgetScheduleRange1.setRangeType("Week");
//        budgetScheduleRange1.setBudgetDateRange(new DateRange(LocalDate.of(2025, 1, 1),  LocalDate.of(2025, 1, 7)));
//
//        BudgetScheduleRange budgetScheduleRange2 = new BudgetScheduleRange();
//        budgetScheduleRange2.setSingleDate(false);
//        budgetScheduleRange2.setStartRange(LocalDate.of(2025, 1, 8));
//        budgetScheduleRange2.setEndRange(LocalDate.of(2025, 1, 14));
//        budgetScheduleRange2.setBudgetedAmount(new BigDecimal("140"));
//        budgetScheduleRange2.setSpentOnRange(new BigDecimal("95"));
//        budgetScheduleRange2.setRangeType("Week");
//        budgetScheduleRange2.setBudgetDateRange(new DateRange(LocalDate.of(2025, 1, 7),  LocalDate.of(2025, 1, 14)));
//
//        BudgetScheduleRange budgetScheduleRange3 = new BudgetScheduleRange();
//        budgetScheduleRange3.setSingleDate(false);
//        budgetScheduleRange3.setStartRange(LocalDate.of(2025, 1, 15));
//        budgetScheduleRange3.setEndRange(LocalDate.of(2025, 1, 22));
//        budgetScheduleRange3.setBudgetedAmount(new BigDecimal("140"));
//        budgetScheduleRange3.setSpentOnRange(new BigDecimal("95"));
//        budgetScheduleRange3.setRangeType("Week");
//        budgetScheduleRange3.setBudgetDateRange(new DateRange(LocalDate.of(2025, 1, 15),  LocalDate.of(2025, 1, 22)));
//
//        BudgetScheduleRange budgetScheduleRange4 = new BudgetScheduleRange();
//        budgetScheduleRange4.setSingleDate(false);
//        budgetScheduleRange4.setStartRange(LocalDate.of(2025, 1, 23));
//        budgetScheduleRange4.setEndRange(LocalDate.of(2025, 1, 31));
//        budgetScheduleRange4.setBudgetedAmount(new BigDecimal("140"));
//        budgetScheduleRange4.setSpentOnRange(new BigDecimal("95"));
//        budgetScheduleRange4.setRangeType("Week");
//        budgetScheduleRange4.setBudgetDateRange(new DateRange(LocalDate.of(2025, 1, 23),  LocalDate.of(2025, 1, 31)));
//
//        budgetSchedule.setBudgetScheduleRanges(List.of(budgetScheduleRange1, budgetScheduleRange2, budgetScheduleRange3, budgetScheduleRange4));
//        Optional<BudgetSchedule> expectedBudgetSchedule = Optional.of(budgetSchedule);
//
//        Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
//                .thenReturn(budget);
//
//        Optional<BudgetSchedule> actual = budgetScheduleEngine.createMonthSubBudgetSchedule(userId, startDate, endDate);
//        assertTrue(actual.isPresent());
//        assertEquals(expectedBudgetSchedule.get().getBudgetId(), actual.get().getBudgetId());
//        assertEquals(expectedBudgetSchedule.get().getPeriod(), actual.get().getPeriod());
//        assertEquals(expectedBudgetSchedule.get().getStatus(), actual.get().getStatus());
//        assertEquals(expectedBudgetSchedule.get().getTotalPeriods(), actual.get().getTotalPeriods());
//        assertEquals(expectedBudgetSchedule.get().getStartDate(), actual.get().getStartDate());
//        assertEquals(expectedBudgetSchedule.get().getEndDate(), actual.get().getEndDate());
//        assertEquals(expectedBudgetSchedule.get().getBudgetScheduleRanges().size(), actual.get().getBudgetScheduleRanges().size());
//    }
//
//    @Test
//    void testCreateMonthSubBudgetSchedule_whenJanuaryBudgetStartDateOffsetAndEndDateOffset_thenReturnBudgetSchedule(){
//        LocalDate startDate = LocalDate.of(2025, 1, 5);
//        LocalDate endDate = LocalDate.of(2025, 2, 5);
//        Long userId = 1L;
//
//        BudgetSchedule budgetSchedule = new BudgetSchedule();
//        budgetSchedule.setStartDate(startDate);
//        budgetSchedule.setEndDate(endDate);
//        budgetSchedule.setPeriod(Period.MONTHLY);
//        budgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
//        budgetSchedule.setBudgetId(1L);
//        budgetSchedule.setStatus("Active");
//        budgetSchedule.setTotalPeriods(4);
//        budgetSchedule.initializeBudgetDateRanges();
//        Optional<BudgetSchedule> expectedBudgetSchedule = Optional.of(budgetSchedule);
//
//  /*      Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
//                .thenReturn(createTestBudget(startDate, endDate, Period.MONTHLY));*/
//
//        Optional<BudgetSchedule> actual = budgetScheduleEngine.createMonthSubBudgetSchedule(userId, startDate, endDate);
//        assertTrue(actual.isPresent());
//        assertEquals(expectedBudgetSchedule.get().getBudgetId(), actual.get().getBudgetId());
//        assertEquals(expectedBudgetSchedule.get().getPeriod(), actual.get().getPeriod());
//        assertEquals(expectedBudgetSchedule.get().getStatus(), actual.get().getStatus());
//        assertEquals(expectedBudgetSchedule.get().getTotalPeriods(), actual.get().getTotalPeriods());
//        assertEquals(expectedBudgetSchedule.get().getStartDate(), actual.get().getStartDate());
//        assertEquals(expectedBudgetSchedule.get().getEndDate(), actual.get().getEndDate());
//        assertEquals(expectedBudgetSchedule.get().getBudgetScheduleRanges().size(), actual.get().getBudgetScheduleRanges().size());
//    }
//
//    @Test
//    void testCreateMonthSubBudgetSchedule_whenNoBudgetSchedulesTiedToBudget_thenCreateNewBudgetScheduleAndReturn(){
//        LocalDate startDate = LocalDate.of(2025, 1, 1);
//        LocalDate endDate = LocalDate.of(2025, 1, 31);
//        Long userId = 1L;
//
//        BudgetSchedule budgetSchedule = new BudgetSchedule();
//        budgetSchedule.setStartDate(startDate);
//        budgetSchedule.setEndDate(endDate);
//        budgetSchedule.setPeriod(Period.MONTHLY);
//        budgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
//        budgetSchedule.setBudgetId(1L);
//        budgetSchedule.setStatus("Active");
//        budgetSchedule.setTotalPeriods(4);
//        budgetSchedule.initializeBudgetDateRanges();
//        Optional<BudgetSchedule> expectedBudgetSchedule = Optional.of(budgetSchedule);
//
////        Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
////                .thenReturn(createTestBudgetNoSchedule());
//
//        Optional<BudgetSchedule> actual = budgetScheduleEngine.createMonthSubBudgetSchedule(userId, startDate, endDate);
//        assertTrue(actual.isPresent());
//        assertEquals(expectedBudgetSchedule.get().getBudgetId(), actual.get().getBudgetId());
//        assertEquals(expectedBudgetSchedule.get().getPeriod(), actual.get().getPeriod());
//        assertEquals(expectedBudgetSchedule.get().getStatus(), actual.get().getStatus());
//        assertEquals(expectedBudgetSchedule.get().getTotalPeriods(), actual.get().getTotalPeriods());
//        assertEquals(expectedBudgetSchedule.get().getStartDate(), actual.get().getStartDate());
//        assertEquals(expectedBudgetSchedule.get().getEndDate(), actual.get().getEndDate());
//        assertEquals(expectedBudgetSchedule.get().getBudgetScheduleRanges().size(), actual.get().getBudgetScheduleRanges().size());
//    }
//
//    @Test
//    void testCreateMonthSubBudgetSchedule_whenBudgetHasMultipleBudgetSchedulesFindFebSchedule_thenReturnBudgetSchedule(){
//        LocalDate startDate = LocalDate.of(2025, 2, 1);
//        LocalDate endDate = LocalDate.of(2025, 2, 28);
//        Long userId = 1L;
//
//        BudgetSchedule budgetSchedule = new BudgetSchedule();
//        budgetSchedule.setStartDate(startDate);
//        budgetSchedule.setEndDate(endDate);
//        budgetSchedule.setPeriod(Period.MONTHLY);
//        budgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
//        budgetSchedule.setBudgetId(1L);
//        budgetSchedule.setStatus("Active");
//        budgetSchedule.setTotalPeriods(4);
//        budgetSchedule.initializeBudgetDateRanges();
//        Optional<BudgetSchedule> expectedBudgetSchedule = Optional.of(budgetSchedule);
//
////        Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
////                .thenReturn(createTestBudgetWithMultipleSchedules());
//
//        Optional<BudgetSchedule> actual = budgetScheduleEngine.createMonthSubBudgetSchedule(userId, startDate, endDate);
//        assertTrue(actual.isPresent());
//        assertEquals(expectedBudgetSchedule.get().getBudgetId(), actual.get().getBudgetId());
//        assertEquals(expectedBudgetSchedule.get().getPeriod(), actual.get().getPeriod());
//        assertEquals(expectedBudgetSchedule.get().getStatus(), actual.get().getStatus());
//        assertEquals(expectedBudgetSchedule.get().getTotalPeriods(), actual.get().getTotalPeriods());
//        assertEquals(expectedBudgetSchedule.get().getStartDate(), actual.get().getStartDate());
//        assertEquals(expectedBudgetSchedule.get().getEndDate(), actual.get().getEndDate());
//        assertEquals(expectedBudgetSchedule.get().getBudgetScheduleRanges().size(), actual.get().getBudgetScheduleRanges().size());
//    }
//
//    @Test
//    void testCreateMonthSubBudgetSchedule_whenBudgetHasNullBudgetSchedulesForMonth_thenReturnEmptyOptional(){
//        LocalDate startDate = LocalDate.of(2025, 1, 1);
//        LocalDate endDate = LocalDate.of(2025, 1, 31);
//        Long userId = 1L;
//
////        Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
////                .thenReturn(createTestBudgetWithNullBudgetSchedule());
//
//        Optional<BudgetSchedule> actual = budgetScheduleEngine.createMonthSubBudgetSchedule(userId, startDate, endDate);
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testCreateMonthSubBudgetSchedule_whenStartDateAndEndDateOverlapsBudgetSchedulePeriod_thenReturnBudgetSchedule(){
//        LocalDate startDate = LocalDate.of(2025, 1, 7);
//        LocalDate endDate = LocalDate.of(2025, 1, 31);
//        Long userId = 1L;
//
//        BudgetSchedule budgetSchedule = new BudgetSchedule();
//        budgetSchedule.setStartDate(LocalDate.of(2025, 1, 1));
//        budgetSchedule.setEndDate(endDate);
//        budgetSchedule.setPeriod(Period.MONTHLY);
//        budgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 1, 1), endDate));
//        budgetSchedule.setBudgetId(1L);
//        budgetSchedule.setStatus("Active");
//        budgetSchedule.setTotalPeriods(4);
//        budgetSchedule.initializeBudgetDateRanges();
//        Optional<BudgetSchedule> expectedBudgetSchedule = Optional.of(budgetSchedule);
//
////        Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
////                .thenReturn(createTestBudgetWithMultipleSchedules());
//
//        Optional<BudgetSchedule> actual = budgetScheduleEngine.createMonthSubBudgetSchedule(userId, startDate, endDate);
//        assertTrue(actual.isPresent());
//        assertEquals(expectedBudgetSchedule.get().getBudgetId(), actual.get().getBudgetId());
//        assertEquals(expectedBudgetSchedule.get().getPeriod(), actual.get().getPeriod());
//        assertEquals(expectedBudgetSchedule.get().getStatus(), actual.get().getStatus());
//        assertEquals(expectedBudgetSchedule.get().getTotalPeriods(), actual.get().getTotalPeriods());
//        assertEquals(expectedBudgetSchedule.get().getStartDate(), actual.get().getStartDate());
//        assertEquals(expectedBudgetSchedule.get().getEndDate(), actual.get().getEndDate());
//        assertEquals(expectedBudgetSchedule.get().getBudgetScheduleRanges().size(), actual.get().getBudgetScheduleRanges().size());
//    }
//
//    @Test
//    void testCreateMonthSubBudgetSchedule_whenNoBudgetScheduleFoundInList_thenReturnBudgetScheduleFromDB(){
//        LocalDate startDate = LocalDate.of(2025, 1, 1);
//        LocalDate endDate = LocalDate.of(2025, 1, 31);
//        Long userId = 1L;
//
//        BudgetSchedule budgetSchedule = new BudgetSchedule();
//        budgetSchedule.setStartDate(startDate);
//        budgetSchedule.setEndDate(endDate);
//        budgetSchedule.setPeriod(Period.MONTHLY);
//        budgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
//        budgetSchedule.setBudgetId(1L);
//        budgetSchedule.setStatus("Active");
//        budgetSchedule.setTotalPeriods(4);
//        budgetSchedule.initializeBudgetDateRanges();
//
//        Optional<BudgetSchedule> expectedBudgetSchedule = Optional.of(budgetSchedule);
//
////        Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
////                .thenReturn(createTestBudgetWithMissingSchedule());
////
////        Mockito.when(budgetScheduleService.getBudgetScheduleByDate(anyLong(), any(LocalDate.class), any(LocalDate.class)))
////                .thenReturn(Optional.of(budgetSchedule));
//
//        Optional<BudgetSchedule> actual = budgetScheduleEngine.createMonthSubBudgetSchedule(userId, startDate, endDate);
//        assertTrue(actual.isPresent());
//        assertEquals(expectedBudgetSchedule.get().getBudgetId(), actual.get().getBudgetId());
//        assertEquals(expectedBudgetSchedule.get().getPeriod(), actual.get().getPeriod());
//        assertEquals(expectedBudgetSchedule.get().getStatus(), actual.get().getStatus());
//        assertEquals(expectedBudgetSchedule.get().getTotalPeriods(), actual.get().getTotalPeriods());
//        assertEquals(expectedBudgetSchedule.get().getStartDate(), actual.get().getStartDate());
//        assertEquals(expectedBudgetSchedule.get().getEndDate(), actual.get().getEndDate());
//        assertEquals(expectedBudgetSchedule.get().getBudgetScheduleRanges().size(), actual.get().getBudgetScheduleRanges().size());
//    }
//
//    @Test
//    void testCreateFutureBudgetSchedules_whenStartMonthIsNull_thenReturnEmptyBudgetScheduleList(){
//        Long userId = 1L;
//        LocalDate startDate = null;
//        int numberOfMonths = 2;
//
//        Period period = Period.MONTHLY;
//        List<BudgetSchedule> actual = budgetScheduleEngine.createBudgetSchedules(userId, startDate, true, numberOfMonths);
//        assertTrue(actual.isEmpty());
//    }

    @Test
    void testCreateFutureBudgetSchedules_whenNumberOfMonthsIsNegative_thenThrowException(){
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        int numberOfMonths = -1;
        Period period = Period.MONTHLY;

        assertThrows(IllegalArgumentException.class, () -> {
            budgetScheduleEngine.createBudgetSchedules(userId, startDate, true, numberOfMonths);
        });
    }

    @Test
    void testCreateFutureBudgetSchedules_CreateBudgetSchedulesForTwoMonthsFromCurrent_thenReturnBudgetSchedules(){
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        int numberOfMonths = 2;

        List<BudgetSchedule> expectedBudgetSchedules = new ArrayList<>();

        BudgetSchedule januaryBudgetSchedule = new BudgetSchedule();
        januaryBudgetSchedule.setStartDate(startDate);
        januaryBudgetSchedule.setEndDate(LocalDate.of(2025, 1, 31));
        januaryBudgetSchedule.setPeriod(Period.MONTHLY);
        januaryBudgetSchedule.setScheduleRange(new DateRange(startDate, LocalDate.of(2025, 1, 31)));
        januaryBudgetSchedule.setBudgetId(1L);
        januaryBudgetSchedule.setStatus("Active");
        januaryBudgetSchedule.setTotalPeriods(4);
        januaryBudgetSchedule.initializeBudgetDateRanges();

        BudgetSchedule febuaryBudgetSchedule = new BudgetSchedule();
        febuaryBudgetSchedule.setStartDate(LocalDate.of(2025, 2, 1));
        febuaryBudgetSchedule.setEndDate(LocalDate.of(2025, 2, 28));
        febuaryBudgetSchedule.setPeriod(Period.MONTHLY);
        febuaryBudgetSchedule.setBudgetId(1L);
        febuaryBudgetSchedule.setStatus("Active");
        febuaryBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)));
        febuaryBudgetSchedule.setTotalPeriods(4);
        febuaryBudgetSchedule.initializeBudgetDateRanges();

        BudgetSchedule marchBudgetSchedule = new BudgetSchedule();
        marchBudgetSchedule.setStartDate(LocalDate.of(2025, 3, 1));
        marchBudgetSchedule.setEndDate(LocalDate.of(2025, 3, 31));
        marchBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)));
        marchBudgetSchedule.setPeriod(Period.MONTHLY);
        marchBudgetSchedule.setBudgetId(1L);
        marchBudgetSchedule.setStatus("Active");
        marchBudgetSchedule.setTotalPeriods(4);
        marchBudgetSchedule.initializeBudgetDateRanges();

        expectedBudgetSchedules.add(januaryBudgetSchedule);
        expectedBudgetSchedules.add(febuaryBudgetSchedule);
        expectedBudgetSchedules.add(marchBudgetSchedule);

        Period period = Period.MONTHLY;
        List<BudgetSchedule> actual = budgetScheduleEngine.createBudgetSchedules(userId, startDate, true, numberOfMonths);
        assertNotNull(actual);
        assertEquals(expectedBudgetSchedules.size(), actual.size());
        for (int i = 0; i < actual.size(); i++) {
            BudgetSchedule expected = expectedBudgetSchedules.get(i);
            BudgetSchedule actualSchedule = actual.get(i);

            String month = expected.getStartDate().getMonth().toString();

            assertEquals(expected.getBudgetId(), actualSchedule.getBudgetId(), "Mismatch in BudgetId for " + month);
            assertEquals(expected.getPeriod(), actualSchedule.getPeriod(), "Mismatch in Period for " + month);
            assertEquals(expected.getStatus(), actualSchedule.getStatus(), "Mismatch in Status for " + month);
            assertEquals(expected.getTotalPeriods(), actualSchedule.getTotalPeriods(), "Mismatch in TotalPeriods for " + month);
            assertEquals(expected.getStartDate(), actualSchedule.getStartDate(), "Mismatch in StartDate for " + month);
            assertEquals(expected.getEndDate(), actualSchedule.getEndDate(), "Mismatch in EndDate for " + month);
            assertEquals(expected.getBudgetScheduleRanges().size(), actualSchedule.getBudgetScheduleRanges().size(), "Mismatch in BudgetDateRanges size for " + month);
        }
    }

    @Test
    void testCreateFutureBudgetSchedules_whenBudgetScheduleForCurrentMonthButNoBudgetSchedulesForTwoMonths_thenReturnFutureBudgetSchedules(){
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        int numberOfMonths = 2;
        List<BudgetSchedule> expectedBudgetSchedules = new ArrayList<>();

        BudgetSchedule februaryBudgetSchedule = new BudgetSchedule();
        februaryBudgetSchedule.setStartDate(LocalDate.of(2025, 2, 1));
        februaryBudgetSchedule.setEndDate(LocalDate.of(2025, 2, 28));
        februaryBudgetSchedule.setPeriod(Period.MONTHLY);
        februaryBudgetSchedule.setBudgetId(1L);
        februaryBudgetSchedule.setStatus("Active");
        februaryBudgetSchedule.setTotalPeriods(4);
        februaryBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)));
        februaryBudgetSchedule.initializeBudgetDateRanges();

        BudgetSchedule marchBudgetSchedule = new BudgetSchedule();
        marchBudgetSchedule.setStartDate(LocalDate.of(2025, 3, 1));
        marchBudgetSchedule.setEndDate(LocalDate.of(2025, 3, 31));
        marchBudgetSchedule.setPeriod(Period.MONTHLY);
        marchBudgetSchedule.setBudgetId(1L);
        marchBudgetSchedule.setStatus("Active");
        marchBudgetSchedule.setTotalPeriods(4);
        marchBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)));
        marchBudgetSchedule.initializeBudgetDateRanges();
        expectedBudgetSchedules.add(februaryBudgetSchedule);
        expectedBudgetSchedules.add(marchBudgetSchedule);

//        Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
//                .thenReturn(createFebruaryBudget());
//
//        Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
//                .thenReturn(createMarchBudget());

        Period period = Period.MONTHLY;
        List<BudgetSchedule> actual = budgetScheduleEngine.createBudgetSchedules(userId, startDate, true, numberOfMonths);
        assertNotNull(actual);
        assertEquals(expectedBudgetSchedules.size(), actual.size());
        for (int i = 0; i < actual.size(); i++) {
            BudgetSchedule expected = expectedBudgetSchedules.get(i);
            BudgetSchedule actualSchedule = actual.get(i);
            String month = expected.getStartDate().getMonth().toString();
            assertEquals(expected.getBudgetId(), actualSchedule.getBudgetId(), "Mismatch in BudgetId for " + month);
            assertEquals(expected.getPeriod(), actualSchedule.getPeriod(), "Mismatch in Period for " + month);
            assertEquals(expected.getStatus(), actualSchedule.getStatus(), "Mismatch in Status for " + month);
            assertEquals(expected.getStartDate(), actualSchedule.getStartDate(), "Mismatch in StartDate for " + month);
            assertEquals(expected.getEndDate(), actualSchedule.getEndDate(), "Mismatch in EndDate for " + month);
            assertEquals(expected.getScheduleRange().getStartDate(), actualSchedule.getScheduleRange().getStartDate(), "Mismatch in ScheduleRange for " + month);
        }
    }

    @Test
    void testBuildScheduleByDate_whenStartDateIsNull_thenReturnEmptyList(){
        LocalDate endDate = LocalDate.of(2025, 1, 31);
        Period period = Period.MONTHLY;
        Long budgetId = 1L;
        Optional<BudgetSchedule> actual = budgetScheduleEngine.createSingleBudgetSchedule(null, endDate, budgetId);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildScheduleByDate_whenEndDateIsNull_thenReturnEmptyList(){
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        Period period = Period.MONTHLY;
        Long budgetId = 1L;
        Optional<BudgetSchedule> actual = budgetScheduleEngine.createSingleBudgetSchedule(startDate, null, budgetId);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildScheduleByDate_whenBudgetIdIsNegative_thenThrowException(){
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        LocalDate endDate = LocalDate.of(2025, 1, 31);
        Period period = Period.MONTHLY;
        Long budgetId = -1L;
        assertThrows(IllegalArgumentException.class, () -> {
            budgetScheduleEngine.createSingleBudgetSchedule(startDate, endDate, budgetId);
        });
    }

    @Test
    void testBuildScheduleByDate_whenStartDateIsFebruary_thenReturnBudgetSchedule(){
        LocalDate startDate = LocalDate.of(2025, 2, 1);
        LocalDate endDate = LocalDate.of(2025, 2, 28);
        Long budgetId = 1L;

        BudgetSchedule februaryBudgetSchedule = new BudgetSchedule();
        februaryBudgetSchedule.setStartDate(startDate);
        februaryBudgetSchedule.setEndDate(endDate);
        februaryBudgetSchedule.setPeriod(Period.MONTHLY);
        februaryBudgetSchedule.setBudgetId(1L);
        februaryBudgetSchedule.setStatus("Active");
        februaryBudgetSchedule.setTotalPeriods(4);
        februaryBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)));
        februaryBudgetSchedule.initializeBudgetDateRanges();

        Optional<BudgetSchedule> expectedBudgetSchedule = Optional.of(februaryBudgetSchedule);
        Optional<BudgetSchedule> actual = budgetScheduleEngine.createSingleBudgetSchedule(startDate, endDate, budgetId);
        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(expectedBudgetSchedule.get().getScheduleRange().getStartDate(), actual.get().getScheduleRange().getStartDate());
        assertEquals(expectedBudgetSchedule.get().getScheduleRange().getEndDate(), actual.get().getScheduleRange().getEndDate());
        assertEquals(expectedBudgetSchedule.get().getBudgetId(), actual.get().getBudgetId(), "Mismatch in BudgetId for " + budgetId);
        assertEquals(expectedBudgetSchedule.get().getPeriod(), actual.get().getPeriod(), "Mismatch in Period for " + budgetId);
        assertEquals(expectedBudgetSchedule.get().getStatus(), actual.get().getStatus(), "Mismatch in Status for " + budgetId);
        assertEquals(expectedBudgetSchedule.get().getBudgetScheduleRanges().size(), actual.get().getBudgetScheduleRanges().size(), "Mismatch in BudgetDateRanges for " + budgetId);
    }

    @Test
    void testCreateMissingBudgetSchedules_whenMapIsNull_thenReturnEmptyList(){
        Map<Long, List<DateRange>> budgetDateRanges = new HashMap<>();
        List<BudgetSchedule> budgetSchedules = budgetScheduleEngine.createMissingBudgetSchedules(budgetDateRanges);
        assertNotNull(budgetSchedules);
        assertTrue(budgetSchedules.isEmpty());
    }

    @Test
    void testCreateMissingBudgetSchedules_whenListOfDateRangesIsEmpty_thenReturnEmptyList(){
        Map<Long, List<DateRange>> budgetDateRanges = new HashMap<>();
        List<DateRange> dateRanges = new ArrayList<>();
        budgetDateRanges.put(2L, dateRanges);

        List<BudgetSchedule> actual = budgetScheduleEngine.createMissingBudgetSchedules(budgetDateRanges);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateMissingBudgetSchedules_whenDateRangeHasNullStartDate_thenThrowException(){
        Map<Long, List<DateRange>> budgetDateRanges = new HashMap<>();
        List<DateRange> dateRanges = new ArrayList<>();
        dateRanges.add(new DateRange(null, LocalDate.of(2025, 1, 28)));
        budgetDateRanges.put(2L, dateRanges);

        assertThrows(IllegalDateException.class, () -> {
            budgetScheduleEngine.createMissingBudgetSchedules(budgetDateRanges);
        });
    }

    @Test
    void testCreateMissingBudgetSchedules_whenDateRangeHasNullEndDate_thenThrowException(){
        Map<Long, List<DateRange>> budgetDateRanges = new HashMap<>();
        List<DateRange> dateRanges = new ArrayList<>();
        dateRanges.add(new DateRange(LocalDate.of(2025, 1, 1), null));
        budgetDateRanges.put(2L, dateRanges);
        assertThrows(IllegalDateException.class, () -> {
            budgetScheduleEngine.createMissingBudgetSchedules(budgetDateRanges);
        });
    }

    @Test
    void testCreateMissingBudgetSchedules_whenBudgetIdAndDateRangesValid_thenReturnBudgetSchedules(){
        Map<Long, List<DateRange>> budgetDateRanges = new HashMap<>();
        List<DateRange> dateRanges = new ArrayList<>();
        dateRanges.add(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        dateRanges.add(new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)));
        budgetDateRanges.put(2L, dateRanges);

        BudgetSchedule januaryBudgetSchedule = new BudgetSchedule();
        januaryBudgetSchedule.setStartDate(LocalDate.of(2025, 1, 1));
        januaryBudgetSchedule.setEndDate(LocalDate.of(2025, 1, 31));
        januaryBudgetSchedule.setPeriod(Period.MONTHLY);
        januaryBudgetSchedule.setBudgetId(2L);
        januaryBudgetSchedule.setStatus("Active");
        januaryBudgetSchedule.setTotalPeriods(4);
        januaryBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        januaryBudgetSchedule.initializeBudgetDateRanges();

        BudgetSchedule februaryBudgetSchedule = new BudgetSchedule();
        februaryBudgetSchedule.setStartDate(LocalDate.of(2025, 2, 1));
        februaryBudgetSchedule.setEndDate(LocalDate.of(2025, 2, 28));
        februaryBudgetSchedule.setPeriod(Period.MONTHLY);
        februaryBudgetSchedule.setBudgetId(2L);
        februaryBudgetSchedule.setStatus("Active");
        februaryBudgetSchedule.setTotalPeriods(4);
        februaryBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)));
        februaryBudgetSchedule.initializeBudgetDateRanges();

        List<BudgetSchedule> expectedBudgetSchedules = new ArrayList<>();
        expectedBudgetSchedules.add(januaryBudgetSchedule);
        expectedBudgetSchedules.add(februaryBudgetSchedule);

        List<BudgetSchedule> actual = budgetScheduleEngine.createMissingBudgetSchedules(budgetDateRanges);
        assertNotNull(actual);
        assertEquals(expectedBudgetSchedules.size(), actual.size());
        for (int i = 0; i < actual.size(); i++) {
            BudgetSchedule expected = expectedBudgetSchedules.get(i);
            BudgetSchedule actualSchedule = actual.get(i);
            String month = expected.getStartDate().getMonth().toString();
            assertEquals(expected.getBudgetId(), actualSchedule.getBudgetId(), "Mismatch in BudgetId for " + month);
            assertEquals(expected.getPeriod(), actualSchedule.getPeriod(), "Mismatch in Period for " + month);
            assertEquals(expected.getStatus(), actualSchedule.getStatus(), "Mismatch in Status for " + month);
            assertEquals(expected.getStartDate(), actualSchedule.getStartDate(), "Mismatch in StartDate for " + month);
            assertEquals(expected.getEndDate(), actualSchedule.getEndDate(), "Mismatch in EndDate for " + month);
            assertEquals(expected.getScheduleRange().getStartDate(), actualSchedule.getScheduleRange().getStartDate(), "Mismatch in ScheduleRange for " + month);
            assertEquals(expected.getBudgetScheduleRanges().size(), actualSchedule.getBudgetScheduleRanges().size(), "Mismatch in BudgetDateRanges for " + month);
        }
    }

    @Test
    void testCreateBudgetSchedules_whenIsFeatureEnabledFalse_AndCreateBudgetSchedulesForPreviousTwoMonthsFromCurrent_thenReturnBudgetSchedules(){
        Long userId = 1L;
        LocalDate startMonth = LocalDate.of(2025, 1, 1);
        int numberOfMonths = 2;
        Period period = Period.MONTHLY;

        BudgetSchedule januaryBudgetSchedule = new BudgetSchedule();
        januaryBudgetSchedule.setStartDate(startMonth);
        januaryBudgetSchedule.setEndDate(LocalDate.of(2025, 1, 31));
        januaryBudgetSchedule.setPeriod(period);
        januaryBudgetSchedule.setBudgetId(2L);
        januaryBudgetSchedule.setStatus("Active");
        januaryBudgetSchedule.setTotalPeriods(4);
        januaryBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        januaryBudgetSchedule.initializeBudgetDateRanges();

        BudgetSchedule decemberBudgetSchedule = new BudgetSchedule();
        decemberBudgetSchedule.setStartDate(LocalDate.of(2024, 12, 1));
        decemberBudgetSchedule.setEndDate(LocalDate.of(2024, 12, 31));
        decemberBudgetSchedule.setPeriod(period);
        decemberBudgetSchedule.setBudgetId(2L);
        decemberBudgetSchedule.setStatus("Active");
        decemberBudgetSchedule.setTotalPeriods(4);
        decemberBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2024, 12, 1), LocalDate.of(2024, 12, 31)));
        decemberBudgetSchedule.initializeBudgetDateRanges();

        BudgetSchedule novemberBudgetSchedule = new BudgetSchedule();
        novemberBudgetSchedule.setStartDate(LocalDate.of(2024, 11, 1));
        novemberBudgetSchedule.setEndDate(LocalDate.of(2024, 11, 30));
        novemberBudgetSchedule.setPeriod(period);
        novemberBudgetSchedule.setBudgetId(2L);
        novemberBudgetSchedule.setStatus("Active");
        novemberBudgetSchedule.setTotalPeriods(4);
        novemberBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 30)));
        novemberBudgetSchedule.initializeBudgetDateRanges();

        List<BudgetSchedule> expectedBudgetSchedules = new ArrayList<>();
        expectedBudgetSchedules.add(januaryBudgetSchedule);
        expectedBudgetSchedules.add(decemberBudgetSchedule);
        expectedBudgetSchedules.add(novemberBudgetSchedule);

//        Mockito.when(budgetService.loadUserBudgetForPeriod(userId, LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)))
//                .thenReturn(createJanuaryBudget());
//
//        Mockito.when(budgetService.loadUserBudgetForPeriod(userId, LocalDate.of(2024, 12, 1), LocalDate.of(2024, 12, 31)))
//                .thenReturn(createBudgetForMonth(LocalDate.of(2024, 12, 1), LocalDate.of(2024, 12, 31), 2L, "December"));
//
//        Mockito.when(budgetService.loadUserBudgetForPeriod(userId, LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 30)))
//                .thenReturn(createBudgetForMonth(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 30), 2L, "November"));

        List<BudgetSchedule> actual = budgetScheduleEngine.createBudgetSchedules(userId, startMonth, false, numberOfMonths);
        assertNotNull(actual);
        assertEquals(expectedBudgetSchedules.size(), actual.size());
        for (int i = 0; i < actual.size(); i++) {
            BudgetSchedule expected = expectedBudgetSchedules.get(i);
            BudgetSchedule actualSchedule = actual.get(i);
            String month = expected.getStartDate().getMonth().toString();
            assertEquals(expected.getBudgetId(), actualSchedule.getBudgetId(), "Mismatch in BudgetId for " + month);
            assertEquals(expected.getPeriod(), actualSchedule.getPeriod(), "Mismatch in Period for " + month);
            assertEquals(expected.getStatus(), actualSchedule.getStatus(), "Mismatch in Status for " + month);
            assertEquals(expected.getStartDate(), actualSchedule.getStartDate(), "Mismatch in StartDate for " + month);
            assertEquals(expected.getEndDate(), actualSchedule.getEndDate(), "Mismatch in EndDate for " + month);
            assertEquals(expected.getScheduleRange().getStartDate(), actualSchedule.getScheduleRange().getStartDate(), "Mismatch in ScheduleRange for " + month);
            assertEquals(expected.getBudgetScheduleRanges().size(), actualSchedule.getBudgetScheduleRanges().size(), "Mismatch in BudgetDateRanges for " + month);
        }
    }

    @Test
    void testCreateBudgetSchedules_whenPeriodIsQuarterlyAndFutureEnabled_thenReturnBudgetSchedulesForThreeMonths(){
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        int numberOfMonths = 3;
        List<BudgetSchedule> expectedBudgetSchedules = new ArrayList<>();

        BudgetSchedule februaryBudgetSchedule = new BudgetSchedule();
        februaryBudgetSchedule.setStartDate(LocalDate.of(2025, 2, 1));
        februaryBudgetSchedule.setEndDate(LocalDate.of(2025, 2, 28));
        februaryBudgetSchedule.setPeriod(Period.QUARTERLY);
        februaryBudgetSchedule.setBudgetId(1L);
        februaryBudgetSchedule.setStatus("Active");
        februaryBudgetSchedule.setTotalPeriods(4);
        februaryBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)));
        februaryBudgetSchedule.initializeBudgetDateRanges();

        BudgetSchedule marchBudgetSchedule = new BudgetSchedule();
        marchBudgetSchedule.setStartDate(LocalDate.of(2025, 3, 1));
        marchBudgetSchedule.setEndDate(LocalDate.of(2025, 3, 31));
        marchBudgetSchedule.setPeriod(Period.QUARTERLY);
        marchBudgetSchedule.setBudgetId(1L);
        marchBudgetSchedule.setStatus("Active");
        marchBudgetSchedule.setTotalPeriods(4);
        marchBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)));
        marchBudgetSchedule.initializeBudgetDateRanges();

        BudgetSchedule aprilBudgetSchedule = new BudgetSchedule();
        aprilBudgetSchedule.setStartDate(LocalDate.of(2025, 4, 1));
        aprilBudgetSchedule.setEndDate(LocalDate.of(2025, 4, 30));
        aprilBudgetSchedule.setPeriod(Period.QUARTERLY);
        aprilBudgetSchedule.setBudgetId(2L);
        aprilBudgetSchedule.setStatus("Active");
        aprilBudgetSchedule.setTotalPeriods(4);
        aprilBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 30)));
        aprilBudgetSchedule.initializeBudgetDateRanges();

        expectedBudgetSchedules.add(februaryBudgetSchedule);
        expectedBudgetSchedules.add(marchBudgetSchedule);
        expectedBudgetSchedules.add(aprilBudgetSchedule);

        List<BudgetSchedule> actual = budgetScheduleEngine.createBudgetSchedules(userId, startDate, true, numberOfMonths);
        assertNotNull(actual);
        assertEquals(expectedBudgetSchedules.size(), actual.size());
        for (int i = 0; i < actual.size(); i++) {
            BudgetSchedule expected = expectedBudgetSchedules.get(i);
            BudgetSchedule actualSchedule = actual.get(i);
            String month = expected.getStartDate().getMonth().toString();
            assertEquals(expected.getBudgetId(), actualSchedule.getBudgetId(), "Mismatch in BudgetId for " + month);
            assertEquals(expected.getPeriod(), actualSchedule.getPeriod(), "Mismatch in Period for " + month);
            assertEquals(expected.getStatus(), actualSchedule.getStatus(), "Mismatch in Status for " + month);
            assertEquals(expected.getStartDate(), actualSchedule.getStartDate(), "Mismatch in StartDate for " + month);
            assertEquals(expected.getEndDate(), actualSchedule.getEndDate(), "Mismatch in EndDate for " + month);
            assertEquals(expected.getScheduleRange().getStartDate(), actualSchedule.getScheduleRange().getStartDate(), "Mismatch in ScheduleRange for " + month);
            assertEquals(expected.getBudgetScheduleRanges().size(), actualSchedule.getBudgetScheduleRanges().size(), "Mismatch in BudgetDateRanges for " + month);
        }

    }

    private SubBudget createJanuarySubBudget(){

        SubBudget januarySubBudget = new SubBudget();
        januarySubBudget.setBudget(budget);
        januarySubBudget.setActive(true);
        januarySubBudget.setAllocatedAmount(new BigDecimal("3260"));
        januarySubBudget.setSubBudgetName("January Savings Budget");
        januarySubBudget.setSpentOnBudget(new BigDecimal("1607"));
        januarySubBudget.setSubSavingsAmount(new BigDecimal("120"));
        januarySubBudget.setSubSavingsTarget(new BigDecimal("250"));

        BudgetSchedule monthBudgetSchedule = new BudgetSchedule();
        monthBudgetSchedule.setStartDate(LocalDate.of(2025, 1, 1));
        monthBudgetSchedule.setEndDate(LocalDate.of(2025, 1, 31));
        monthBudgetSchedule.setPeriod(Period.MONTHLY);
        monthBudgetSchedule.setBudgetId(2L);
        monthBudgetSchedule.setStatus("Active");
        monthBudgetSchedule.setTotalPeriods(4);
        monthBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        monthBudgetSchedule.initializeBudgetDateRanges();

        januarySubBudget.setBudgetSchedule(List.of(monthBudgetSchedule));
        return januarySubBudget;
    }

    @Test
    void testGroupBudgetSchedulesByBudgetId_whenBudgetSchedulesIsEmpty_thenReturnEmptyMap(){
        List<BudgetSchedule> budgetSchedules = new ArrayList<>();
        Map<Long, List<BudgetSchedule>> actual = budgetScheduleEngine.groupBudgetSchedulesByBudgetId(budgetSchedules);
        assertNotNull(actual);
        assertEquals(0, actual.size());
    }

    @Test
    void testGroupBudgetSchedulesByBudgetId_whenBudgetSchedulesValid_thenReturnGroupedBudgetSchedules(){
        List<BudgetSchedule> budgetSchedules = new ArrayList<>();

        BudgetSchedule februaryBudgetSchedule = new BudgetSchedule();
        februaryBudgetSchedule.setStartDate(LocalDate.of(2025, 2, 1));
        februaryBudgetSchedule.setEndDate(LocalDate.of(2025, 2, 28));
        februaryBudgetSchedule.setPeriod(Period.QUARTERLY);
        februaryBudgetSchedule.setBudgetId(2L);
        februaryBudgetSchedule.setStatus("Active");
        februaryBudgetSchedule.setTotalPeriods(4);
        februaryBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)));
        februaryBudgetSchedule.initializeBudgetDateRanges();

        BudgetSchedule marchBudgetSchedule = new BudgetSchedule();
        marchBudgetSchedule.setStartDate(LocalDate.of(2025, 3, 1));
        marchBudgetSchedule.setEndDate(LocalDate.of(2025, 3, 31));
        marchBudgetSchedule.setPeriod(Period.QUARTERLY);
        marchBudgetSchedule.setBudgetId(2L);
        marchBudgetSchedule.setStatus("Active");
        marchBudgetSchedule.setTotalPeriods(4);
        marchBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)));
        marchBudgetSchedule.initializeBudgetDateRanges();

        budgetSchedules.add(februaryBudgetSchedule);
        budgetSchedules.add(marchBudgetSchedule);

        Map<Long, List<BudgetSchedule>> expectedGroupedBudgetSchedules = new HashMap<>();
        expectedGroupedBudgetSchedules.put(2L, budgetSchedules);

        Map<Long, List<BudgetSchedule>> actual = budgetScheduleEngine.groupBudgetSchedulesByBudgetId(budgetSchedules);
        assertNotNull(actual);
        assertEquals(expectedGroupedBudgetSchedules.size(), actual.size());
        for (Map.Entry<Long, List<BudgetSchedule>> entry : expectedGroupedBudgetSchedules.entrySet()) {
            Long expectedBudgetId = entry.getKey();
            List<BudgetSchedule> expectedSchedules = entry.getValue();
            List<BudgetSchedule> actualSchedules = actual.get(expectedBudgetId);

            assertNotNull(actualSchedules, "Missing schedules for BudgetId: " + expectedBudgetId);
            assertEquals(expectedSchedules.size(), actualSchedules.size(), "Mismatch in number of schedules for BudgetId: " + expectedBudgetId);

            for (int i = 0; i < expectedSchedules.size(); i++) {
                BudgetSchedule expected = expectedSchedules.get(i);
                BudgetSchedule actualSchedule = actualSchedules.get(i);
                String month = expected.getStartDate().getMonth().toString();

                assertEquals(expected.getBudgetId(), actualSchedule.getBudgetId(), "Mismatch in BudgetId for " + month);
                assertEquals(expected.getPeriod(), actualSchedule.getPeriod(), "Mismatch in Period for " + month);
                assertEquals(expected.getStatus(), actualSchedule.getStatus(), "Mismatch in Status for " + month);
                assertEquals(expected.getStartDate(), actualSchedule.getStartDate(), "Mismatch in StartDate for " + month);
                assertEquals(expected.getEndDate(), actualSchedule.getEndDate(), "Mismatch in EndDate for " + month);
                assertEquals(expected.getScheduleRange().getStartDate(), actualSchedule.getScheduleRange().getStartDate(), "Mismatch in ScheduleRange StartDate for " + month);
                assertEquals(expected.getScheduleRange().getEndDate(), actualSchedule.getScheduleRange().getEndDate(), "Mismatch in ScheduleRange EndDate for " + month);
                assertEquals(expected.getBudgetScheduleRanges().size(), actualSchedule.getBudgetScheduleRanges().size(), "Mismatch in BudgetDateRanges for " + month);
            }
        }
    }


    private SubBudget createSubBudgetForMonth(LocalDate startDate, LocalDate endDate, Long budgetId, String month)
    {
        SubBudget subBudgetForMonth = new SubBudget();
        subBudgetForMonth.setBudget(budget);
        subBudgetForMonth.setActive(true);
        subBudgetForMonth.setAllocatedAmount(new BigDecimal("3260"));
        subBudgetForMonth.setSubBudgetName("Savings budget for month: " + month);
        subBudgetForMonth.setSubSavingsAmount(new BigDecimal("120"));
        subBudgetForMonth.setSubSavingsTarget(new BigDecimal("250"));
        subBudgetForMonth.setSpentOnBudget(new BigDecimal("1020"));

        BudgetSchedule monthBudgetSchedule = new BudgetSchedule();
        monthBudgetSchedule.setStartDate(startDate);
        monthBudgetSchedule.setEndDate(endDate);
        monthBudgetSchedule.setPeriod(Period.MONTHLY);
        monthBudgetSchedule.setBudgetId(budgetId);
        monthBudgetSchedule.setStatus("Active");
        monthBudgetSchedule.setTotalPeriods(4);
        monthBudgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
        monthBudgetSchedule.initializeBudgetDateRanges();

        subBudgetForMonth.setBudgetSchedule(List.of(monthBudgetSchedule));
        return subBudgetForMonth;
    }

    private SubBudget createFebruarySubBudget()
    {
        SubBudget februarySubBudget = new SubBudget();
        februarySubBudget.setBudget(budget);
        februarySubBudget.setActive(true);
        februarySubBudget.setAllocatedAmount(new BigDecimal("3260"));
        februarySubBudget.setSubBudgetName("Savings budget for February");
        februarySubBudget.setSubSavingsAmount(new BigDecimal("120"));
        februarySubBudget.setSubSavingsTarget(new BigDecimal("250"));
        februarySubBudget.setSpentOnBudget(new BigDecimal("1020"));

        LocalDate febStartDate = LocalDate.of(2025, 2, 1);
        LocalDate febEndDate = LocalDate.of(2025, 2, 28);

        BudgetSchedule febSchedule = new BudgetSchedule(
                2L,
                budget.getId(),
                febStartDate,
                febEndDate,
                Period.MONTHLY,
                4,
                "Active"
        );
        febSchedule.initializeBudgetDateRanges();
        februarySubBudget.setBudgetSchedule(List.of(febSchedule));
        return februarySubBudget;
    }

    private SubBudget createMarchSubBudget()
    {
        SubBudget marchSubBudget = new SubBudget();
        marchSubBudget.setBudget(budget);
        marchSubBudget.setActive(true);
        marchSubBudget.setAllocatedAmount(new BigDecimal("3260"));
        marchSubBudget.setSubBudgetName("Savings budget for March");
        marchSubBudget.setSubSavingsAmount(new BigDecimal("120"));
        marchSubBudget.setSubSavingsTarget(new BigDecimal("250"));
        marchSubBudget.setSpentOnBudget(new BigDecimal("1020"));

        LocalDate marchStartDate = LocalDate.of(2025, 3, 1);
        LocalDate marchEndDate = LocalDate.of(2025, 3, 31);
        BudgetSchedule marchSchedule = new BudgetSchedule(
                3L,
                budget.getId(),
                marchStartDate,
                marchEndDate,
                Period.MONTHLY,
                4,
                "Active"
        );
        marchSchedule.initializeBudgetDateRanges();
        marchSubBudget.setBudgetSchedule(List.of(marchSchedule));
        return marchSubBudget;
    }

    private SubBudget createTestBudgetWithMissingSchedule(){

        SubBudget subBudget = new SubBudget();
        subBudget.setBudget(budget);
        subBudget.setActive(true);
        subBudget.setAllocatedAmount(new BigDecimal("3260"));
        subBudget.setSubBudgetName("Savings budget for Test");
        subBudget.setSubSavingsAmount(new BigDecimal("120"));
        subBudget.setSubSavingsTarget(new BigDecimal("250"));
        subBudget.setSpentOnBudget(new BigDecimal("1020"));

        LocalDate febStartDate = LocalDate.of(2025, 2, 1);
        LocalDate febEndDate = LocalDate.of(2025, 2, 28);

        LocalDate marchStartDate = LocalDate.of(2025, 3, 1);
        LocalDate marchEndDate = LocalDate.of(2025, 3, 31);

        BudgetSchedule febSchedule = new BudgetSchedule(
                2L,
                budget.getId(),
                febStartDate,
                febEndDate,
                Period.MONTHLY,
                4,
                "Active"
        );
        BudgetSchedule marchSchedule = new BudgetSchedule(
                3L,
                budget.getId(),
                marchStartDate,
                marchEndDate,
                Period.MONTHLY,
                4,
                "Active"
        );
        febSchedule.initializeBudgetDateRanges();
        marchSchedule.initializeBudgetDateRanges();
        subBudget.setBudgetSchedule(Arrays.asList(febSchedule, marchSchedule));
        return subBudget;
    }

    private SubBudget createTestSubBudgetWithNullBudgetSchedule()
    {
        SubBudget subBudget = new SubBudget();
        subBudget.setBudget(budget);
        subBudget.setActive(true);
        subBudget.setAllocatedAmount(new BigDecimal("3260"));
        subBudget.setSubBudgetName("Savings budget for Test");
        subBudget.setSubSavingsAmount(new BigDecimal("120"));
        subBudget.setSubSavingsTarget(new BigDecimal("250"));
        subBudget.setSpentOnBudget(new BigDecimal("1020"));

        LocalDate febStartDate = LocalDate.of(2025, 2, 1);
        LocalDate febEndDate = LocalDate.of(2025, 2, 28);

        LocalDate marchStartDate = LocalDate.of(2025, 3, 1);
        LocalDate marchEndDate = LocalDate.of(2025, 3, 31);

        BudgetSchedule febSchedule = new BudgetSchedule(
                2L,
                budget.getId(),
                febStartDate,
                febEndDate,
                Period.MONTHLY,
                4,
                "Active"
        );
        BudgetSchedule marchSchedule = new BudgetSchedule(
                3L,
                budget.getId(),
                marchStartDate,
                marchEndDate,
                Period.MONTHLY,
                4,
                "Active"
        );
        febSchedule.initializeBudgetDateRanges();
        marchSchedule.initializeBudgetDateRanges();
        subBudget.setBudgetSchedule(Arrays.asList(null, febSchedule, marchSchedule));
        return subBudget;
    }

    private SubBudget createTestSubBudgetWithMultipleSchedules(){

        SubBudget subBudget = new SubBudget();
        subBudget.setBudget(budget);
        subBudget.setActive(true);
        subBudget.setAllocatedAmount(new BigDecimal("9780"));
        subBudget.setSubBudgetName("Savings budget for Test");
        subBudget.setSubSavingsAmount(new BigDecimal("650"));
        subBudget.setSubSavingsTarget(new BigDecimal("1500"));
        subBudget.setSpentOnBudget(new BigDecimal("3020"));

        LocalDate janStartDate = LocalDate.of(2025, 1, 1);
        LocalDate janEndDate = LocalDate.of(2025, 1, 31);

        LocalDate febStartDate = LocalDate.of(2025, 2, 1);
        LocalDate febEndDate = LocalDate.of(2025, 2, 28);

        LocalDate marchStartDate = LocalDate.of(2025, 3, 1);
        LocalDate marchEndDate = LocalDate.of(2025, 3, 31);

        // Add exactly one BudgetSchedule to match the method's logic
        BudgetSchedule janSchedule = new BudgetSchedule(
                1L,
                budget.getId(),
                janStartDate,
                janEndDate,
                Period.MONTHLY,
                4,
                "Active"
        );

        BudgetSchedule febSchedule = new BudgetSchedule(
                2L,
                budget.getId(),
                febStartDate,
                febEndDate,
                Period.MONTHLY,
                4,
                "Active"
        );
        BudgetSchedule marchSchedule = new BudgetSchedule(
                3L,
                budget.getId(),
                marchStartDate,
                marchEndDate,
                Period.MONTHLY,
                4,
                "Active"
        );
        janSchedule.initializeBudgetDateRanges();
        febSchedule.initializeBudgetDateRanges();
        marchSchedule.initializeBudgetDateRanges();
        subBudget.setBudgetSchedule(List.of(janSchedule, febSchedule, marchSchedule));
        return subBudget;
    }

    private SubBudget createTestSubBudgetNoSchedule()
    {
        SubBudget subBudget = new SubBudget();
        subBudget.setBudget(budget);
        subBudget.setActive(true);
        subBudget.setAllocatedAmount(new BigDecimal("3260"));
        subBudget.setSubBudgetName("Savings budget for Test");
        subBudget.setSubSavingsAmount(new BigDecimal("120"));
        subBudget.setSubSavingsTarget(new BigDecimal("250"));
        subBudget.setSpentOnBudget(new BigDecimal("1020"));

        subBudget.setBudgetSchedule(List.of());
        return subBudget;
    }

    private SubBudget createTestSubBudget(LocalDate startDate, LocalDate endDate, Period period) {
        SubBudget subBudget = new SubBudget();
        subBudget.setBudget(budget);
        subBudget.setActive(true);
        subBudget.setAllocatedAmount(new BigDecimal("3260"));
        subBudget.setSubBudgetName("Savings budget for Test");
        subBudget.setSubSavingsAmount(new BigDecimal("120"));
        subBudget.setSubSavingsTarget(new BigDecimal("250"));
        subBudget.setSpentOnBudget(new BigDecimal("1020"));

        // Add exactly one BudgetSchedule to match the method's logic
        BudgetSchedule schedule = new BudgetSchedule(
                1L,
                budget.getId(),
                startDate,
                endDate,
                period,
                4,
                "Active"
        );
        schedule.initializeBudgetDateRanges();
        subBudget.setBudgetSchedule(List.of(schedule));
        return subBudget;
    }


    private BudgetSchedule createTestBudgetSchedule(){
        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setBudgetId(1L);
        budgetSchedule.setStartDate(LocalDate.of(2025, 1, 1));
        budgetSchedule.setEndDate(LocalDate.of(2025, 12, 31));
        budgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31)));
        budgetSchedule.setStatus("Active");
        budgetSchedule.setPeriod(Period.MONTHLY);
        return budgetSchedule;
    }

    @AfterEach
    void tearDown() {
    }
}