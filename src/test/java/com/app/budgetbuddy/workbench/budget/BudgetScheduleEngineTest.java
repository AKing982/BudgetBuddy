package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.BudgetSchedule;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.domain.Period;
import com.app.budgetbuddy.exceptions.BudgetScheduleException;
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
        LocalDate endDate = LocalDate.of(2025, 12, 31);
        Long userId = 1L;

        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setStartDate(startDate);
        budgetSchedule.setEndDate(endDate);
        budgetSchedule.setPeriod(Period.MONTHLY);
        budgetSchedule.setBudgetId(1L);
        budgetSchedule.setStatus("Active");
        budgetSchedule.setTotalPeriods(4);

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

    private Budget createTestBudget(){
        Budget budget = new Budget();
        budget.setBudgetAmount(new BigDecimal("3260"));
        budget.setActual(new BigDecimal("1609"));
        budget.setId(1L);

        // Add exactly one BudgetSchedule to match the method's logic
        BudgetSchedule schedule = new BudgetSchedule();
        schedule.setBudgetId(budget.getId());
        schedule.setStartDate(LocalDate.of(2025, 1, 1));
        schedule.setEndDate(LocalDate.of(2025, 12, 31));
        schedule.setPeriod(Period.MONTHLY);
        schedule.setStatus("Active");
        schedule.setTotalPeriods(4);

        budget.getBudgetSchedules().add(schedule);
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