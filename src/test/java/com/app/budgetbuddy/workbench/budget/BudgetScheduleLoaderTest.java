package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.BudgetSchedule;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.domain.Period;
import com.app.budgetbuddy.entities.BudgetScheduleEntity;
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
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;

@ExtendWith(MockitoExtension.class)
class BudgetScheduleLoaderTest {

    @Mock
    private BudgetScheduleService budgetScheduleService;

    @Mock
    private BudgetService budgetService;

    @Mock
    private BudgetScheduleEngine budgetScheduleEngine;

    @InjectMocks
    private BudgetScheduleLoader budgetScheduleLoader;


    @BeforeEach
    void setUp() {
        budgetScheduleLoader = new BudgetScheduleLoader(budgetScheduleService, budgetService, budgetScheduleEngine);
    }

    @Test
    void testLoadBudgetByDatesFromDatabase_whenStartDateIsNull_thenReturnEmptyOptional(){
        LocalDate endDate = LocalDate.of(2025, 1, 31);
        Long userId = 1L;

        Optional<Budget> actual = budgetScheduleLoader.loadBudgetByDatesFromDatabase(null, endDate, userId);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testLoadBudgetByDatesFromDatabase_whenEndDateIsNull_thenReturnEmptyOptional(){
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        Long userId = 1L;
        Optional<Budget> actual = budgetScheduleLoader.loadBudgetByDatesFromDatabase(startDate, null, userId);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testLoadBudgetByDatesFromDatabase_whenDatesAndUserIdValid_thenReturnBudget(){
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        LocalDate endDate = LocalDate.of(2025, 1, 31);
        Long userId = 1L;

        Budget budget = new Budget();
        budget.setUserId(userId);
        budget.setBudgetDescription("Budget Description");
        budget.setBudgetName("Test Budget");
        budget.setActual(new BigDecimal("1020"));
        budget.setBudgetAmount(new BigDecimal("3020"));
        budget.setBudgetSchedules(List.of());

        Optional<Budget> expected = Optional.of(budget);

        Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(budget);

        Optional<Budget> actual = budgetScheduleLoader.loadBudgetByDatesFromDatabase(startDate, endDate, userId);
        assertTrue(actual.isPresent());
        assertEquals(expected.get().getBudgetSchedules().size(), actual.get().getBudgetSchedules().size());
        assertEquals(expected.get().getBudgetAmount(), actual.get().getBudgetAmount());
        assertEquals(expected.get().getBudgetDescription(), actual.get().getBudgetDescription());
        assertEquals(expected.get().getBudgetName(), actual.get().getBudgetName());
        assertEquals(expected.get().getActual(), actual.get().getActual());
    }

    @Test
    void testLoadBudgetByDatesFromDatabase_whenBudgetFromDatabaseNull_thenReturnEmptyOptional(){
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        LocalDate endDate = LocalDate.of(2025, 1, 31);
        Long userId = 1L;

        Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(null);

        Optional<Budget> actual = budgetScheduleLoader.loadBudgetByDatesFromDatabase(startDate, endDate, userId);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testLoadBudgetByDatesFromDatabase_whenBudgetNotFoundAndExceptionThrown_throwException(){
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        LocalDate endDate = LocalDate.of(2025, 1, 31);
        Long userId = 1L;

        Mockito.when(budgetService.loadUserBudgetForPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenThrow(RuntimeException.class);
        assertThrows(RuntimeException.class, () -> budgetScheduleLoader.loadBudgetByDatesFromDatabase(startDate, endDate, userId));
    }

    @Test
    void testLoadBudgetSchedulesForDatesFromDatabase_whenDatesAndBudgetIdValid_thenReturnBudgetSchedule(){
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        LocalDate endDate = LocalDate.of(2025, 1, 31);
        Long budgetId = 1L;

        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setBudgetId(budgetId);
        budgetSchedule.setStartDate(startDate);
        budgetSchedule.setEndDate(endDate);
        budgetSchedule.setPeriod(Period.MONTHLY);
        budgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
        budgetSchedule.setStatus("Active");
        budgetSchedule.setTotalPeriods(4);
        budgetSchedule.initializeBudgetDateRanges();

        Optional<BudgetSchedule> expectedBudgetSchedules = Optional.of(budgetSchedule);

        Mockito.when(budgetScheduleService.getBudgetScheduleByDate(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Optional.of(budgetSchedule));

        Optional<BudgetSchedule> actual = budgetScheduleLoader.loadBudgetScheduleForDatesFromDatabase(startDate, endDate, budgetId);
        assertTrue(actual.isPresent());
        assertEquals(expectedBudgetSchedules.get().getBudgetId(), actual.get().getBudgetId());
        assertEquals(expectedBudgetSchedules.get().getStartDate(), actual.get().getStartDate());
        assertEquals(expectedBudgetSchedules.get().getEndDate(), actual.get().getEndDate());
        assertEquals(expectedBudgetSchedules.get().getPeriod(), actual.get().getPeriod());
        assertEquals(expectedBudgetSchedules.get().getScheduleRange(), actual.get().getScheduleRange());
        assertEquals(expectedBudgetSchedules.get().getStatus(), actual.get().getStatus());
        assertEquals(expectedBudgetSchedules.get().getTotalPeriods(), actual.get().getTotalPeriods());
    }


    @AfterEach
    void tearDown() {
    }
}