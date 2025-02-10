package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.BudgetScheduleException;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.BudgetScheduleService;
import com.app.budgetbuddy.services.BudgetService;
import com.app.budgetbuddy.services.SubBudgetService;
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

    @Mock
    private SubBudgetService subBudgetService;

    @Mock
    private BudgetScheduleRangeBuilderService budgetScheduleRangeBuilderService;

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

        budgetScheduleEngine = new BudgetScheduleEngine(budgetService, budgetScheduleService, budgetScheduleRangeBuilderService, subBudgetService);
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

    @Test
    void testCreateMonthSubBudgetSchedule_whenJanuarySubBudget_thenReturnJanuaryBudgetSchedule()
    {
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2025,1 ,1);
        LocalDate endDate = LocalDate.of(2025,12, 31);
        BigDecimal subBudgetSavingsTarget = new BigDecimal("2500");
        BigDecimal spentOnSubBudget = new BigDecimal("1609");
        BigDecimal subSavingsAmount = new BigDecimal("150");

        SubBudget januarySubBudget = new SubBudget();
        januarySubBudget.setStartDate(startDate);
        januarySubBudget.setEndDate(endDate);
        januarySubBudget.setActive(true);
        januarySubBudget.setBudget(budget);
        januarySubBudget.setId(1L);
        januarySubBudget.setAllocatedAmount(new BigDecimal("3260"));
        januarySubBudget.setSubSavingsTarget(subBudgetSavingsTarget);
        januarySubBudget.setSubSavingsAmount(subSavingsAmount);
        januarySubBudget.setSpentOnBudget(spentOnSubBudget);
        januarySubBudget.setSubBudgetName("January Savings Budget");

        BudgetSchedule januaryBudgetSchedule = new BudgetSchedule();
        januaryBudgetSchedule.setStartDate(startDate);
        januaryBudgetSchedule.setEndDate(endDate);
        januaryBudgetSchedule.setPeriod(Period.MONTHLY);
        januaryBudgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
        januaryBudgetSchedule.setStatus("Active");
        januaryBudgetSchedule.setTotalPeriods(4);
        januaryBudgetSchedule.setSubBudgetId(1L);
        januaryBudgetSchedule.initializeBudgetDateRanges();

        januarySubBudget.setBudgetSchedule(List.of(januaryBudgetSchedule));

        List<BudgetScheduleRange> budgetScheduleRanges = generateJanuaryBudgetScheduleRanges();
        januaryBudgetSchedule.setBudgetScheduleRanges(budgetScheduleRanges);

        Optional<BudgetSchedule> expectedBudgetSchedule = Optional.of(januaryBudgetSchedule);
        Optional<BudgetSchedule> actual = budgetScheduleEngine.createMonthSubBudgetSchedule(januarySubBudget);
        assertNotNull(actual);
        assertEquals(expectedBudgetSchedule.get().getSubBudgetId(), actual.get().getSubBudgetId());
        assertEquals(expectedBudgetSchedule.get().getBudgetScheduleRanges().size(), actual.get().getBudgetScheduleRanges().size());
        assertEquals(expectedBudgetSchedule.get().getPeriod(), actual.get().getPeriod());
        assertEquals(expectedBudgetSchedule.get().getScheduleRange().getStartDate(), actual.get().getStartDate());
        assertEquals(expectedBudgetSchedule.get().getScheduleRange().getEndDate(), actual.get().getScheduleRange().getEndDate());
        assertEquals(expectedBudgetSchedule.get().getStatus(), actual.get().getStatus());
        assertEquals(expectedBudgetSchedule.get().getTotalPeriods(), actual.get().getTotalPeriods());

    }

    @Test
    void testCreateMonthlyBudgetSchedules_whenNumberOfMonthsIsNegative_thenThrowException(){
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        int numberOfMonths = -1;
        Period period = Period.MONTHLY;

        assertThrows(IllegalArgumentException.class, () -> {
            budgetScheduleEngine.createMonthlyBudgetSchedules(userId, startDate, true, numberOfMonths);
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
        januaryBudgetSchedule.setSubBudgetId(1L);
        januaryBudgetSchedule.setStatus("Active");
        januaryBudgetSchedule.setTotalPeriods(4);
        januaryBudgetSchedule.initializeBudgetDateRanges();

        BudgetSchedule febuaryBudgetSchedule = new BudgetSchedule();
        febuaryBudgetSchedule.setStartDate(LocalDate.of(2025, 2, 1));
        febuaryBudgetSchedule.setEndDate(LocalDate.of(2025, 2, 28));
        febuaryBudgetSchedule.setPeriod(Period.MONTHLY);
        febuaryBudgetSchedule.setSubBudgetId(1L);
        febuaryBudgetSchedule.setStatus("Active");
        febuaryBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)));
        febuaryBudgetSchedule.setTotalPeriods(4);
        febuaryBudgetSchedule.initializeBudgetDateRanges();

        BudgetSchedule marchBudgetSchedule = new BudgetSchedule();
        marchBudgetSchedule.setStartDate(LocalDate.of(2025, 3, 1));
        marchBudgetSchedule.setEndDate(LocalDate.of(2025, 3, 31));
        marchBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)));
        marchBudgetSchedule.setPeriod(Period.MONTHLY);
        marchBudgetSchedule.setSubBudgetId(1L);
        marchBudgetSchedule.setStatus("Active");
        marchBudgetSchedule.setTotalPeriods(4);
        marchBudgetSchedule.initializeBudgetDateRanges();

        expectedBudgetSchedules.add(januaryBudgetSchedule);
        expectedBudgetSchedules.add(febuaryBudgetSchedule);
        expectedBudgetSchedules.add(marchBudgetSchedule);

        Period period = Period.MONTHLY;
        List<BudgetSchedule> actual = budgetScheduleEngine.createMonthlyBudgetSchedules(userId, startDate, true, numberOfMonths);
        assertNotNull(actual);
        assertEquals(expectedBudgetSchedules.size(), actual.size());
        for (int i = 0; i < actual.size(); i++) {
            BudgetSchedule expected = expectedBudgetSchedules.get(i);
            BudgetSchedule actualSchedule = actual.get(i);

            String month = expected.getStartDate().getMonth().toString();

            assertEquals(expected.getSubBudgetId(), actualSchedule.getSubBudgetId(), "Mismatch in BudgetId for " + month);
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
        februaryBudgetSchedule.setSubBudgetId(1L);
        februaryBudgetSchedule.setStatus("Active");
        februaryBudgetSchedule.setTotalPeriods(4);
        februaryBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)));
        februaryBudgetSchedule.initializeBudgetDateRanges();

        BudgetSchedule marchBudgetSchedule = new BudgetSchedule();
        marchBudgetSchedule.setStartDate(LocalDate.of(2025, 3, 1));
        marchBudgetSchedule.setEndDate(LocalDate.of(2025, 3, 31));
        marchBudgetSchedule.setPeriod(Period.MONTHLY);
        marchBudgetSchedule.setSubBudgetId(1L);
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
        List<BudgetSchedule> actual = budgetScheduleEngine.createMonthlyBudgetSchedules(userId, startDate, true, numberOfMonths);
        assertNotNull(actual);
        assertEquals(expectedBudgetSchedules.size(), actual.size());
        for (int i = 0; i < actual.size(); i++) {
            BudgetSchedule expected = expectedBudgetSchedules.get(i);
            BudgetSchedule actualSchedule = actual.get(i);
            String month = expected.getStartDate().getMonth().toString();
            assertEquals(expected.getSubBudgetId(), actualSchedule.getSubBudgetId(), "Mismatch in BudgetId for " + month);
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
        SubBudget subBudget = new SubBudget();
        Optional<BudgetSchedule> actual = budgetScheduleEngine.createSingleBudgetSchedule(null, endDate, subBudget);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildScheduleByDate_whenEndDateIsNull_thenReturnEmptyList(){
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        Period period = Period.MONTHLY;
        Long budgetId = 1L;
        SubBudget subBudget = new SubBudget();
        Optional<BudgetSchedule> actual = budgetScheduleEngine.createSingleBudgetSchedule(startDate, null, subBudget);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildScheduleByDate_whenStartDateIsFebruary_thenReturnBudgetSchedule(){
        LocalDate startDate = LocalDate.of(2025, 2, 1);
        LocalDate endDate = LocalDate.of(2025, 2, 28);
        Long budgetId = 1L;

        SubBudget februarySubBudget = new SubBudget();
        februarySubBudget.setStartDate(startDate);
        februarySubBudget.setEndDate(endDate);
        februarySubBudget.setActive(true);
        februarySubBudget.setAllocatedAmount(new BigDecimal("3260"));
        februarySubBudget.setBudget(budget);
        februarySubBudget.setSpentOnBudget(new BigDecimal("1609"));
        februarySubBudget.setSubBudgetName("February Budget");
        februarySubBudget.setSubSavingsAmount(new BigDecimal("120"));
        februarySubBudget.setSubSavingsTarget(new BigDecimal("250"));

        BudgetSchedule februaryBudgetSchedule = new BudgetSchedule();
        februaryBudgetSchedule.setStartDate(startDate);
        februaryBudgetSchedule.setEndDate(endDate);
        februaryBudgetSchedule.setPeriod(Period.MONTHLY);
        februaryBudgetSchedule.setSubBudgetId(1L);
        februaryBudgetSchedule.setStatus("Active");
        februaryBudgetSchedule.setTotalPeriods(4);
        februaryBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)));
        februaryBudgetSchedule.initializeBudgetDateRanges();

        Optional<BudgetSchedule> expectedBudgetSchedule = Optional.of(februaryBudgetSchedule);
        Optional<BudgetSchedule> actual = budgetScheduleEngine.createSingleBudgetSchedule(startDate, endDate, februarySubBudget);
        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(expectedBudgetSchedule.get().getScheduleRange().getStartDate(), actual.get().getScheduleRange().getStartDate());
        assertEquals(expectedBudgetSchedule.get().getScheduleRange().getEndDate(), actual.get().getScheduleRange().getEndDate());
        assertEquals(expectedBudgetSchedule.get().getSubBudgetId(), actual.get().getSubBudgetId(), "Mismatch in BudgetId for " + budgetId);
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
        januaryBudgetSchedule.setSubBudgetId(2L);
        januaryBudgetSchedule.setStatus("Active");
        januaryBudgetSchedule.setTotalPeriods(4);
        januaryBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        januaryBudgetSchedule.initializeBudgetDateRanges();

        BudgetSchedule februaryBudgetSchedule = new BudgetSchedule();
        februaryBudgetSchedule.setStartDate(LocalDate.of(2025, 2, 1));
        februaryBudgetSchedule.setEndDate(LocalDate.of(2025, 2, 28));
        februaryBudgetSchedule.setPeriod(Period.MONTHLY);
        februaryBudgetSchedule.setSubBudgetId(2L);
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
            assertEquals(expected.getSubBudgetId(), actualSchedule.getSubBudgetId(), "Mismatch in BudgetId for " + month);
            assertEquals(expected.getPeriod(), actualSchedule.getPeriod(), "Mismatch in Period for " + month);
            assertEquals(expected.getStatus(), actualSchedule.getStatus(), "Mismatch in Status for " + month);
            assertEquals(expected.getStartDate(), actualSchedule.getStartDate(), "Mismatch in StartDate for " + month);
            assertEquals(expected.getEndDate(), actualSchedule.getEndDate(), "Mismatch in EndDate for " + month);
            assertEquals(expected.getScheduleRange().getStartDate(), actualSchedule.getScheduleRange().getStartDate(), "Mismatch in ScheduleRange for " + month);
            assertEquals(expected.getBudgetScheduleRanges().size(), actualSchedule.getBudgetScheduleRanges().size(), "Mismatch in BudgetDateRanges for " + month);
        }
    }

    @Test
    void testCreateBudgetSchedules_whenIsFutureEnabledFalse_AndCreateBudgetSchedulesForPreviousTwoMonthsFromCurrent_thenReturnBudgetSchedules(){
        Long userId = 1L;
        LocalDate startMonth = LocalDate.of(2025, 1, 1);
        int numberOfMonths = 2;

//        BudgetSchedule januaryBudgetSchedule = new BudgetSchedule();
//        januaryBudgetSchedule.setStartDate(startMonth);
//        januaryBudgetSchedule.setEndDate(LocalDate.of(2025, 1, 31));
//        januaryBudgetSchedule.setPeriod(Period.MONTHLY);
//        januaryBudgetSchedule.setBudgetId(2L);
//        januaryBudgetSchedule.setStatus("Active");
//        januaryBudgetSchedule.setTotalPeriods(4);
//        januaryBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
//        januaryBudgetSchedule.initializeBudgetDateRanges();

        BudgetSchedule decemberBudgetSchedule = new BudgetSchedule();
        decemberBudgetSchedule.setStartDate(LocalDate.of(2024, 12, 1));
        decemberBudgetSchedule.setEndDate(LocalDate.of(2024, 12, 31));
        decemberBudgetSchedule.setPeriod(Period.MONTHLY);
        decemberBudgetSchedule.setSubBudgetId(2L);
        decemberBudgetSchedule.setStatus("Active");
        decemberBudgetSchedule.setTotalPeriods(4);
        decemberBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2024, 12, 1), LocalDate.of(2024, 12, 31)));
        decemberBudgetSchedule.initializeBudgetDateRanges();

        BudgetSchedule novemberBudgetSchedule = new BudgetSchedule();
        novemberBudgetSchedule.setStartDate(LocalDate.of(2024, 11, 1));
        novemberBudgetSchedule.setEndDate(LocalDate.of(2024, 11, 30));
        novemberBudgetSchedule.setPeriod(Period.MONTHLY);
        novemberBudgetSchedule.setSubBudgetId(2L);
        novemberBudgetSchedule.setStatus("Active");
        novemberBudgetSchedule.setTotalPeriods(4);
        novemberBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 30)));
        novemberBudgetSchedule.initializeBudgetDateRanges();

        List<BudgetSchedule> expectedBudgetSchedules = new ArrayList<>();
        expectedBudgetSchedules.add(decemberBudgetSchedule);
        expectedBudgetSchedules.add(novemberBudgetSchedule);
//
//        Mockito.when(subBudgetService.getSubBudgetsByUserIdAndDate(eq(userId), eq(LocalDate.of(2024, 12, 1)), eq(LocalDate.of(2024, 12, 31))))
//                .thenReturn(createSubBudgetsForMonth(LocalDate.of(2024, 12, 1), LocalDate.of(2024, 12, 31), 2L, "December"));
//
//        Mockito.when(subBudgetService.getSubBudgetsByUserIdAndDate(eq(userId), eq(LocalDate.of(2024, 11, 1)), eq(LocalDate.of(2024, 11, 30))))
//                .thenReturn(createSubBudgetsForMonth(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 30), 2L, "November"));

        List<BudgetSchedule> actual = budgetScheduleEngine.createMonthlyBudgetSchedules(userId, startMonth, false, numberOfMonths);
        assertNotNull(actual);
        assertEquals(expectedBudgetSchedules.size(), actual.size());
        for (int i = 0; i < actual.size(); i++) {
            BudgetSchedule expected = expectedBudgetSchedules.get(i);
            BudgetSchedule actualSchedule = actual.get(i);
            String month = expected.getStartDate().getMonth().toString();
            assertEquals(expected.getSubBudgetId(), actualSchedule.getSubBudgetId(), "Mismatch in BudgetId for " + month);
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
        februaryBudgetSchedule.setSubBudgetId(1L);
        februaryBudgetSchedule.setStatus("Active");
        februaryBudgetSchedule.setTotalPeriods(4);
        februaryBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)));
        februaryBudgetSchedule.initializeBudgetDateRanges();

        BudgetSchedule marchBudgetSchedule = new BudgetSchedule();
        marchBudgetSchedule.setStartDate(LocalDate.of(2025, 3, 1));
        marchBudgetSchedule.setEndDate(LocalDate.of(2025, 3, 31));
        marchBudgetSchedule.setPeriod(Period.QUARTERLY);
        marchBudgetSchedule.setSubBudgetId(1L);
        marchBudgetSchedule.setStatus("Active");
        marchBudgetSchedule.setTotalPeriods(4);
        marchBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)));
        marchBudgetSchedule.initializeBudgetDateRanges();

        BudgetSchedule aprilBudgetSchedule = new BudgetSchedule();
        aprilBudgetSchedule.setStartDate(LocalDate.of(2025, 4, 1));
        aprilBudgetSchedule.setEndDate(LocalDate.of(2025, 4, 30));
        aprilBudgetSchedule.setPeriod(Period.QUARTERLY);
        aprilBudgetSchedule.setSubBudgetId(2L);
        aprilBudgetSchedule.setStatus("Active");
        aprilBudgetSchedule.setTotalPeriods(4);
        aprilBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 30)));
        aprilBudgetSchedule.initializeBudgetDateRanges();

        expectedBudgetSchedules.add(februaryBudgetSchedule);
        expectedBudgetSchedules.add(marchBudgetSchedule);
        expectedBudgetSchedules.add(aprilBudgetSchedule);

        List<BudgetSchedule> actual = budgetScheduleEngine.createMonthlyBudgetSchedules(userId, startDate, true, numberOfMonths);
        assertNotNull(actual);
        assertEquals(expectedBudgetSchedules.size(), actual.size());
        for (int i = 0; i < actual.size(); i++) {
            BudgetSchedule expected = expectedBudgetSchedules.get(i);
            BudgetSchedule actualSchedule = actual.get(i);
            String month = expected.getStartDate().getMonth().toString();
            assertEquals(expected.getSubBudgetId(), actualSchedule.getSubBudgetId(), "Mismatch in BudgetId for " + month);
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
        monthBudgetSchedule.setSubBudgetId(2L);
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
        februaryBudgetSchedule.setSubBudgetId(2L);
        februaryBudgetSchedule.setStatus("Active");
        februaryBudgetSchedule.setTotalPeriods(4);
        februaryBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)));
        februaryBudgetSchedule.initializeBudgetDateRanges();

        BudgetSchedule marchBudgetSchedule = new BudgetSchedule();
        marchBudgetSchedule.setStartDate(LocalDate.of(2025, 3, 1));
        marchBudgetSchedule.setEndDate(LocalDate.of(2025, 3, 31));
        marchBudgetSchedule.setPeriod(Period.QUARTERLY);
        marchBudgetSchedule.setSubBudgetId(2L);
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

                assertEquals(expected.getSubBudgetId(), actualSchedule.getSubBudgetId(), "Mismatch in BudgetId for " + month);
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
        monthBudgetSchedule.setSubBudgetId(budgetId);
        monthBudgetSchedule.setStatus("Active");
        monthBudgetSchedule.setTotalPeriods(4);
        monthBudgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
        monthBudgetSchedule.initializeBudgetDateRanges();

        subBudgetForMonth.setBudgetSchedule(List.of(monthBudgetSchedule));
        return subBudgetForMonth;
    }

    private List<SubBudget> createSubBudgetsForMonth(LocalDate startDate, LocalDate endDate, Long budgetId, String monthName) {
        SubBudget subBudget = new SubBudget();
        subBudget.setId(budgetId);
        subBudget.setSubBudgetName(monthName + " Budget");
        subBudget.setStartDate(startDate);
        subBudget.setEndDate(endDate);
        subBudget.setAllocatedAmount(new BigDecimal("3260")); // Example allocation
        subBudget.setSubSavingsAmount(BigDecimal.ZERO);
        subBudget.setSubSavingsTarget(new BigDecimal("250"));
        subBudget.setSpentOnBudget(BigDecimal.ZERO);
        subBudget.setActive(true);

        // Budget schedule placeholder for the sub-budget
        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setStartDate(startDate);
        budgetSchedule.setEndDate(endDate);
        budgetSchedule.setPeriod(Period.MONTHLY);
        budgetSchedule.setSubBudgetId(budgetId);
        budgetSchedule.setStatus("Active");
        budgetSchedule.setTotalPeriods(4);
        budgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
        budgetSchedule.initializeBudgetDateRanges();

        subBudget.setBudgetSchedule(List.of(budgetSchedule));

        return List.of(subBudget);
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
        budgetSchedule.setSubBudgetId(1L);
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