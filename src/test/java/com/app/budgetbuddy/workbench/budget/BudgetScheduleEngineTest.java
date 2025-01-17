package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.BudgetSchedule;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.domain.Period;
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

    @BeforeEach
    void setUp() {
        budgetScheduleEngine = new BudgetScheduleEngine(budgetService, budgetScheduleService);
    }

    @Test
    void testCreateMonthlyBudgetSchedule_whenBudgetIsNull_thenReturnEmptyOptional() {
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        LocalDate endDate = LocalDate.of(2025, 12, 31);
        Optional<BudgetSchedule> actual = budgetScheduleEngine.createMonthBudgetSchedule(null, startDate, endDate);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateMonthlyBudgetSchedule_whenStartDateIsNull_thenReturnEmptyOptional() {
        LocalDate endDate = LocalDate.of(2025, 1, 1);
        Optional<BudgetSchedule> actual = budgetScheduleEngine.createMonthBudgetSchedule(1L, null, endDate);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateMonthlyBudgetSchedule_whenEndDateIsNull_thenReturnEmptyOptional() {
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        Optional<BudgetSchedule> actual = budgetScheduleEngine.createMonthBudgetSchedule(1L, startDate, null);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateMonthlyBudgetSchedule_whenJanuaryBudgetStartDateBeginningOfMonthAndEndDateLastDayOfMonth_thenReturnBudgetSchedule(){
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        LocalDate endDate = LocalDate.of(2025, 1, 31);
        Long userId = 1L;

        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setStartDate(startDate);
        budgetSchedule.setEndDate(endDate);
        budgetSchedule.setPeriod(Period.MONTHLY);
        budgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
        budgetSchedule.setBudgetId(1L);
        budgetSchedule.setStatus("Active");
        budgetSchedule.setTotalPeriods(4);
        budgetSchedule.initializeBudgetDateRanges();

        Optional<BudgetSchedule> expectedBudgetSchedule = Optional.of(budgetSchedule);

        Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(createTestBudget());

        Optional<BudgetSchedule> actual = budgetScheduleEngine.createMonthBudgetSchedule(userId, startDate, endDate);
        assertTrue(actual.isPresent());
        assertEquals(expectedBudgetSchedule.get().getBudgetId(), actual.get().getBudgetId());
        assertEquals(expectedBudgetSchedule.get().getPeriod(), actual.get().getPeriod());
        assertEquals(expectedBudgetSchedule.get().getStatus(), actual.get().getStatus());
        assertEquals(expectedBudgetSchedule.get().getTotalPeriods(), actual.get().getTotalPeriods());
        assertEquals(expectedBudgetSchedule.get().getStartDate(), actual.get().getStartDate());
        assertEquals(expectedBudgetSchedule.get().getEndDate(), actual.get().getEndDate());
        assertEquals(expectedBudgetSchedule.get().getBudgetDateRanges().size(), actual.get().getBudgetDateRanges().size());
    }

    @Test
    void testCreateMonthlyBudgetSchedule_whenJanuaryBudgetStartDateOffsetAndEndDateOffset_thenReturnBudgetSchedule(){
        LocalDate startDate = LocalDate.of(2025, 1, 5);
        LocalDate endDate = LocalDate.of(2025, 2, 5);
        Long userId = 1L;

        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setStartDate(startDate);
        budgetSchedule.setEndDate(endDate);
        budgetSchedule.setPeriod(Period.MONTHLY);
        budgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
        budgetSchedule.setBudgetId(1L);
        budgetSchedule.setStatus("Active");
        budgetSchedule.setTotalPeriods(4);
        budgetSchedule.initializeBudgetDateRanges();
        Optional<BudgetSchedule> expectedBudgetSchedule = Optional.of(budgetSchedule);

        Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(createTestBudget(startDate, endDate, Period.MONTHLY));

        Optional<BudgetSchedule> actual = budgetScheduleEngine.createMonthBudgetSchedule(userId, startDate, endDate);
        assertTrue(actual.isPresent());
        assertEquals(expectedBudgetSchedule.get().getBudgetId(), actual.get().getBudgetId());
        assertEquals(expectedBudgetSchedule.get().getPeriod(), actual.get().getPeriod());
        assertEquals(expectedBudgetSchedule.get().getStatus(), actual.get().getStatus());
        assertEquals(expectedBudgetSchedule.get().getTotalPeriods(), actual.get().getTotalPeriods());
        assertEquals(expectedBudgetSchedule.get().getStartDate(), actual.get().getStartDate());
        assertEquals(expectedBudgetSchedule.get().getEndDate(), actual.get().getEndDate());
        assertEquals(expectedBudgetSchedule.get().getBudgetDateRanges().size(), actual.get().getBudgetDateRanges().size());
    }

    @Test
    void testCreateMonthlyBudgetSchedule_whenNoBudgetSchedulesTiedToBudget_thenCreateNewBudgetScheduleAndReturn(){
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        LocalDate endDate = LocalDate.of(2025, 1, 31);
        Long userId = 1L;

        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setStartDate(startDate);
        budgetSchedule.setEndDate(endDate);
        budgetSchedule.setPeriod(Period.MONTHLY);
        budgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
        budgetSchedule.setBudgetId(1L);
        budgetSchedule.setStatus("Active");
        budgetSchedule.setTotalPeriods(4);
        budgetSchedule.initializeBudgetDateRanges();
        Optional<BudgetSchedule> expectedBudgetSchedule = Optional.of(budgetSchedule);

        Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(createTestBudgetNoSchedule());
        Optional<BudgetSchedule> actual = budgetScheduleEngine.createMonthBudgetSchedule(userId, startDate, endDate);
        assertTrue(actual.isPresent());
        assertEquals(expectedBudgetSchedule.get().getBudgetId(), actual.get().getBudgetId());
        assertEquals(expectedBudgetSchedule.get().getPeriod(), actual.get().getPeriod());
        assertEquals(expectedBudgetSchedule.get().getStatus(), actual.get().getStatus());
        assertEquals(expectedBudgetSchedule.get().getTotalPeriods(), actual.get().getTotalPeriods());
        assertEquals(expectedBudgetSchedule.get().getStartDate(), actual.get().getStartDate());
        assertEquals(expectedBudgetSchedule.get().getEndDate(), actual.get().getEndDate());
        assertEquals(expectedBudgetSchedule.get().getBudgetDateRanges().size(), actual.get().getBudgetDateRanges().size());
    }

    @Test
    void testCreateMonthlyBudgetSchedule_whenBudgetHasMultipleBudgetSchedulesFindFebSchedule_thenReturnBudgetSchedule(){
        LocalDate startDate = LocalDate.of(2025, 2, 1);
        LocalDate endDate = LocalDate.of(2025, 2, 28);
        Long userId = 1L;

        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setStartDate(startDate);
        budgetSchedule.setEndDate(endDate);
        budgetSchedule.setPeriod(Period.MONTHLY);
        budgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
        budgetSchedule.setBudgetId(1L);
        budgetSchedule.setStatus("Active");
        budgetSchedule.setTotalPeriods(4);
        budgetSchedule.initializeBudgetDateRanges();
        Optional<BudgetSchedule> expectedBudgetSchedule = Optional.of(budgetSchedule);

        Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(createTestBudgetWithMultipleSchedules());

        Optional<BudgetSchedule> actual = budgetScheduleEngine.createMonthBudgetSchedule(userId, startDate, endDate);
        assertTrue(actual.isPresent());
        assertEquals(expectedBudgetSchedule.get().getBudgetId(), actual.get().getBudgetId());
        assertEquals(expectedBudgetSchedule.get().getPeriod(), actual.get().getPeriod());
        assertEquals(expectedBudgetSchedule.get().getStatus(), actual.get().getStatus());
        assertEquals(expectedBudgetSchedule.get().getTotalPeriods(), actual.get().getTotalPeriods());
        assertEquals(expectedBudgetSchedule.get().getStartDate(), actual.get().getStartDate());
        assertEquals(expectedBudgetSchedule.get().getEndDate(), actual.get().getEndDate());
        assertEquals(expectedBudgetSchedule.get().getBudgetDateRanges().size(), actual.get().getBudgetDateRanges().size());
    }

    @Test
    void testCreateMonthBudgetSchedule_whenBudgetHasNullBudgetSchedulesForMonth_thenReturnEmptyOptional(){
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        LocalDate endDate = LocalDate.of(2025, 1, 31);
        Long userId = 1L;

        Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(createTestBudgetWithNullBudgetSchedule());

        Optional<BudgetSchedule> actual = budgetScheduleEngine.createMonthBudgetSchedule(userId, startDate, endDate);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateMonthBudgetSchedule_whenStartDateAndEndDateOverlapsBudgetSchedulePeriod_thenReturnBudgetSchedule(){
        LocalDate startDate = LocalDate.of(2025, 1, 7);
        LocalDate endDate = LocalDate.of(2025, 1, 31);
        Long userId = 1L;

        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setStartDate(LocalDate.of(2025, 1, 1));
        budgetSchedule.setEndDate(endDate);
        budgetSchedule.setPeriod(Period.MONTHLY);
        budgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 1, 1), endDate));
        budgetSchedule.setBudgetId(1L);
        budgetSchedule.setStatus("Active");
        budgetSchedule.setTotalPeriods(4);
        budgetSchedule.initializeBudgetDateRanges();
        Optional<BudgetSchedule> expectedBudgetSchedule = Optional.of(budgetSchedule);

        Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(createTestBudgetWithMultipleSchedules());

        Optional<BudgetSchedule> actual = budgetScheduleEngine.createMonthBudgetSchedule(userId, startDate, endDate);
        assertTrue(actual.isPresent());
        assertEquals(expectedBudgetSchedule.get().getBudgetId(), actual.get().getBudgetId());
        assertEquals(expectedBudgetSchedule.get().getPeriod(), actual.get().getPeriod());
        assertEquals(expectedBudgetSchedule.get().getStatus(), actual.get().getStatus());
        assertEquals(expectedBudgetSchedule.get().getTotalPeriods(), actual.get().getTotalPeriods());
        assertEquals(expectedBudgetSchedule.get().getStartDate(), actual.get().getStartDate());
        assertEquals(expectedBudgetSchedule.get().getEndDate(), actual.get().getEndDate());
        assertEquals(expectedBudgetSchedule.get().getBudgetDateRanges().size(), actual.get().getBudgetDateRanges().size());
    }

    @Test
    void testCreateMonthBudgetSchedule_whenNoBudgetScheduleFoundInList_thenReturnBudgetScheduleFromDB(){
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        LocalDate endDate = LocalDate.of(2025, 1, 31);
        Long userId = 1L;

        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setStartDate(startDate);
        budgetSchedule.setEndDate(endDate);
        budgetSchedule.setPeriod(Period.MONTHLY);
        budgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
        budgetSchedule.setBudgetId(1L);
        budgetSchedule.setStatus("Active");
        budgetSchedule.setTotalPeriods(4);
        budgetSchedule.initializeBudgetDateRanges();

        Optional<BudgetSchedule> expectedBudgetSchedule = Optional.of(budgetSchedule);

        Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(createTestBudgetWithMissingSchedule());

        Mockito.when(budgetScheduleService.getBudgetScheduleByDate(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Optional.of(budgetSchedule));

        Optional<BudgetSchedule> actual = budgetScheduleEngine.createMonthBudgetSchedule(userId, startDate, endDate);
        assertTrue(actual.isPresent());
        assertEquals(expectedBudgetSchedule.get().getBudgetId(), actual.get().getBudgetId());
        assertEquals(expectedBudgetSchedule.get().getPeriod(), actual.get().getPeriod());
        assertEquals(expectedBudgetSchedule.get().getStatus(), actual.get().getStatus());
        assertEquals(expectedBudgetSchedule.get().getTotalPeriods(), actual.get().getTotalPeriods());
        assertEquals(expectedBudgetSchedule.get().getStartDate(), actual.get().getStartDate());
        assertEquals(expectedBudgetSchedule.get().getEndDate(), actual.get().getEndDate());
        assertEquals(expectedBudgetSchedule.get().getBudgetDateRanges().size(), actual.get().getBudgetDateRanges().size());
    }

    @Test
    void testCreateFutureBudgetSchedules_whenStartMonthIsNull_thenReturnEmptyBudgetScheduleList(){
        Long userId = 1L;
        LocalDate startDate = null;
        int numberOfMonths = 2;

        Period period = Period.MONTHLY;
        List<BudgetSchedule> actual = budgetScheduleEngine.createBudgetSchedules(userId, startDate, true, numberOfMonths, period);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateFutureBudgetSchedules_whenNumberOfMonthsIsNegative_thenThrowException(){
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        int numberOfMonths = -1;
        Period period = Period.MONTHLY;

        assertThrows(IllegalArgumentException.class, () -> {
            budgetScheduleEngine.createBudgetSchedules(userId, startDate, true, numberOfMonths, period);
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
        List<BudgetSchedule> actual = budgetScheduleEngine.createBudgetSchedules(userId, startDate, true, numberOfMonths, period);
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
            assertEquals(expected.getBudgetDateRanges().size(), actualSchedule.getBudgetDateRanges().size(), "Mismatch in BudgetDateRanges size for " + month);
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

        Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(createFebruaryBudget());

        Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(createMarchBudget());

        Period period = Period.MONTHLY;
        List<BudgetSchedule> actual = budgetScheduleEngine.createBudgetSchedules(userId, startDate, true, numberOfMonths, period);
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
        assertEquals(expectedBudgetSchedule.get().getBudgetDateRanges().size(), actual.get().getBudgetDateRanges().size(), "Mismatch in BudgetDateRanges for " + budgetId);
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
            assertEquals(expected.getBudgetDateRanges().size(), actualSchedule.getBudgetDateRanges().size(), "Mismatch in BudgetDateRanges for " + month);
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

        Mockito.when(budgetService.loadUserBudgetForPeriod(userId, LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)))
                .thenReturn(createJanuaryBudget());

        Mockito.when(budgetService.loadUserBudgetForPeriod(userId, LocalDate.of(2024, 12, 1), LocalDate.of(2024, 12, 31)))
                .thenReturn(createBudgetForMonth(LocalDate.of(2024, 12, 1), LocalDate.of(2024, 12, 31), 2L, "December"));

        Mockito.when(budgetService.loadUserBudgetForPeriod(userId, LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 30)))
                .thenReturn(createBudgetForMonth(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 30), 2L, "November"));

        List<BudgetSchedule> actual = budgetScheduleEngine.createBudgetSchedules(userId, startMonth, false, numberOfMonths, period);
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
            assertEquals(expected.getBudgetDateRanges().size(), actualSchedule.getBudgetDateRanges().size(), "Mismatch in BudgetDateRanges for " + month);
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

        List<BudgetSchedule> actual = budgetScheduleEngine.createBudgetSchedules(userId, startDate, true, numberOfMonths, Period.QUARTERLY);
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
            assertEquals(expected.getBudgetDateRanges().size(), actualSchedule.getBudgetDateRanges().size(), "Mismatch in BudgetDateRanges for " + month);
        }

    }

    private Budget createJanuaryBudget(){
        Budget budget = new Budget();
        budget.setId(2L);
        budget.setBudgetName("Budget for January");
        budget.setBudgetDescription("Budget Description for January");
        budget.setBudgetAmount(new BigDecimal("3260.0"));
        budget.setActual(new BigDecimal("1200.0"));

        BudgetSchedule monthBudgetSchedule = new BudgetSchedule();
        monthBudgetSchedule.setStartDate(LocalDate.of(2025, 1, 1));
        monthBudgetSchedule.setEndDate(LocalDate.of(2025, 1, 31));
        monthBudgetSchedule.setPeriod(Period.MONTHLY);
        monthBudgetSchedule.setBudgetId(2L);
        monthBudgetSchedule.setStatus("Active");
        monthBudgetSchedule.setTotalPeriods(4);
        monthBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        monthBudgetSchedule.initializeBudgetDateRanges();

        budget.setBudgetSchedules(List.of(monthBudgetSchedule));
        return budget;
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
                assertEquals(expected.getBudgetDateRanges().size(), actualSchedule.getBudgetDateRanges().size(), "Mismatch in BudgetDateRanges for " + month);
            }
        }
    }


    private Budget createBudgetForMonth(LocalDate startDate, LocalDate endDate, Long budgetId, String month){
        Budget budget = new Budget();
        budget.setId(budgetId);
        budget.setBudgetName("Budget for month: " + month);
        budget.setBudgetDescription("Budget Description for month: " + month);
        budget.setBudgetAmount(new BigDecimal("3260.0"));
        budget.setActual(new BigDecimal("1200.0"));

        BudgetSchedule monthBudgetSchedule = new BudgetSchedule();
        monthBudgetSchedule.setStartDate(startDate);
        monthBudgetSchedule.setEndDate(endDate);
        monthBudgetSchedule.setPeriod(Period.MONTHLY);
        monthBudgetSchedule.setBudgetId(budgetId);
        monthBudgetSchedule.setStatus("Active");
        monthBudgetSchedule.setTotalPeriods(4);
        monthBudgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
        monthBudgetSchedule.initializeBudgetDateRanges();

        budget.setBudgetSchedules(List.of());
        return budget;
    }

    private Budget createFebruaryBudget(){
        Budget budget = new Budget();
        budget.setId(1L);
        budget.setBudgetName("February Budget");
        budget.setBudgetDescription("February Budget Description");
        budget.setBudgetAmount(new BigDecimal("3260"));
        budget.setActual(new BigDecimal("1020"));

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
        budget.setBudgetSchedules(List.of());
        return budget;
    }

    private Budget createMarchBudget(){
        Budget budget = new Budget();
        budget.setId(2L);
        budget.setBudgetName("March Budget");
        budget.setBudgetDescription("March Budget Description");
        budget.setBudgetAmount(new BigDecimal("3260"));
        budget.setActual(new BigDecimal("1020"));
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
        budget.setBudgetSchedules(List.of());
        return budget;
    }

    private Budget createTestBudgetWithMissingSchedule(){
        Budget budget = new Budget();
        budget.setBudgetAmount(new BigDecimal("3260"));
        budget.setActual(new BigDecimal("1609"));
        budget.setId(1L);
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
        budget.setBudgetSchedules(Arrays.asList(febSchedule, marchSchedule));
        return budget;
    }

    private Budget createTestBudgetWithNullBudgetSchedule(){
        Budget budget = new Budget();
        budget.setBudgetAmount(new BigDecimal("3260"));
        budget.setActual(new BigDecimal("1609"));
        budget.setId(1L);

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
        budget.setBudgetSchedules(Arrays.asList(null, febSchedule, marchSchedule));
        return budget;
    }

    private Budget createTestBudgetWithMultipleSchedules(){
        Budget budget = new Budget();
        budget.setBudgetAmount(new BigDecimal("3260"));
        budget.setActual(new BigDecimal("1609"));
        budget.setId(1L);

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
        budget.setBudgetSchedules(List.of(janSchedule, febSchedule, marchSchedule));
        return budget;
    }

    private Budget createTestBudgetNoSchedule(){
        Budget budget = new Budget();
        budget.setBudgetAmount(new BigDecimal("3260"));
        budget.setActual(new BigDecimal("1609"));
        budget.setId(1L);

        budget.setBudgetSchedules(List.of());
        return budget;
    }

    private Budget createTestBudget(LocalDate startDate, LocalDate endDate, Period period) {
        Budget budget = new Budget();
        budget.setBudgetAmount(new BigDecimal("3260"));
        budget.setActual(new BigDecimal("1609"));
        budget.setId(1L);

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
        budget.setBudgetSchedules(List.of(schedule));
        return budget;
    }

    private Budget createTestBudget(){
        Budget budget = new Budget();
        budget.setBudgetAmount(new BigDecimal("3260"));
        budget.setActual(new BigDecimal("1609"));
        budget.setId(1L);

        // Add exactly one BudgetSchedule to match the method's logic
        BudgetSchedule schedule = new BudgetSchedule(
                1L,
                budget.getId(),
                LocalDate.of(2025, 1, 1),
                LocalDate.of(2025, 1, 31),
                Period.MONTHLY,
                4,
                "Active"
        );
        schedule.initializeBudgetDateRanges();
        budget.setBudgetSchedules(List.of(schedule));
        return budget;
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