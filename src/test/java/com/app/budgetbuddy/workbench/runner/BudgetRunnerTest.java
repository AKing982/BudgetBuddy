package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BudgetScheduleService;
import com.app.budgetbuddy.services.BudgetService;
import com.app.budgetbuddy.workbench.budget.BudgetCalculations;
import com.app.budgetbuddy.workbench.budget.BudgetPeriodQueries;
import com.app.budgetbuddy.workbench.budget.BudgetQueriesService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
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
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@Slf4j
class BudgetRunnerTest {

    @Mock
    private BudgetPeriodQueries budgetPeriodQueries;

    @Mock
    private BudgetQueriesService budgetQueriesService;

    @Mock
    private BudgetCalculations budgetCalculations;

    @Mock
    private BudgetScheduleService budgetScheduleService;

    @Mock
    private BudgetService budgetService;

    @InjectMocks
    private BudgetRunner budgetRunner;

    private Budget testBudget;

    @BeforeEach
    void setUp() {
        testBudget = new Budget();
        testBudget.setId(1L);
        testBudget.setActual(new BigDecimal("1630"));
        testBudget.setBudgetAmount(new BigDecimal("3260"));
        testBudget.setBudgetDescription("Savings Budget");
        testBudget.setBudgetName("Savings Budget");
        budgetRunner = new BudgetRunner(budgetPeriodQueries, budgetQueriesService, budgetCalculations, budgetScheduleService, budgetService);
    }


    @Test
    void testLoadMonthlyBudgetStatistics_whenValidDatesAndUserId_thenReturnBudgetStats() {
        // Arrange
        LocalDate startDate = LocalDate.of(2024, 1, 1);
        LocalDate endDate = LocalDate.of(2024, 1, 31);
        DateRange monthRange = new DateRange(startDate, endDate);

        BudgetStats expectedBudgetStats = new BudgetStats(
                1L,                           // budgetId
                new BigDecimal("3000.00"),    // totalBudget
                new BigDecimal("2500.00"),    // totalSpent
                new BigDecimal("500.00"),     // remaining
                new BigDecimal("300.00"),     // totalSaved
                new BigDecimal("80.65"),      // averageSpendingPerDay
                monthRange
        );

        // Mock service calls
        when(budgetQueriesService.getTotalBudgeted(
                testBudget.getId(),
                testBudget.getUserId(),
                startDate,
                endDate
        )).thenReturn(new BigDecimal("3000.00"));

        when(budgetQueriesService.getTotalSpentOnBudget(
                testBudget.getId(),
                startDate,
                endDate
        )).thenReturn(new BigDecimal("2500.00"));

        when(budgetCalculations.calculateAverageSpendingPerDayOnBudget(
                any(BigDecimal.class),
                any(BigDecimal.class),
                any(BudgetPeriod.class)
        )).thenReturn(new BigDecimal("80.65"));

        when(budgetCalculations.calculateTotalSavedInBudget(testBudget, new BigDecimal("2500.00"), monthRange)).thenReturn(new BigDecimal("300.00"));

        // Act
        BudgetStats actualBudgetStats = budgetRunner.loadMonthlyBudgetStatistics(monthRange, testBudget);

        // Assert
        assertNotNull(actualBudgetStats);

        log.info("Testing budget stats for period: {} to {}",
                expectedBudgetStats.getDateRange().getStartDate(),
                expectedBudgetStats.getDateRange().getEndDate());

        assertEquals(expectedBudgetStats.getBudgetId(), actualBudgetStats.getBudgetId(),
                "Budget ID mismatch");

        assertEquals(expectedBudgetStats.getTotalBudget(), actualBudgetStats.getTotalBudget(),
                "Total budget mismatch: expected " + expectedBudgetStats.getTotalBudget() +
                        " but was " + actualBudgetStats.getTotalBudget());

        assertEquals(expectedBudgetStats.getTotalSpent(), actualBudgetStats.getTotalSpent(),
                "Total spent mismatch: expected " + expectedBudgetStats.getTotalSpent() +
                        " but was " + actualBudgetStats.getTotalSpent());

        assertEquals(expectedBudgetStats.getRemaining(), actualBudgetStats.getRemaining(),
                "Remaining mismatch: expected " + expectedBudgetStats.getRemaining() +
                        " but was " + actualBudgetStats.getRemaining());

        assertEquals(expectedBudgetStats.getTotalSaved(), actualBudgetStats.getTotalSaved(),
                "Total saved mismatch: expected " + expectedBudgetStats.getTotalSaved() +
                        " but was " + actualBudgetStats.getTotalSaved());

        assertEquals(expectedBudgetStats.getAverageSpendingPerDay(), actualBudgetStats.getAverageSpendingPerDay(),
                "Average spending per day mismatch: expected " + expectedBudgetStats.getAverageSpendingPerDay() +
                        " but was " + actualBudgetStats.getAverageSpendingPerDay());

        assertEquals(expectedBudgetStats.getDateRange(), actualBudgetStats.getDateRange(),
                "Date range mismatch: expected " + expectedBudgetStats.getDateRange() +
                        " but was " + actualBudgetStats.getDateRange());

        // Verify service calls
        verify(budgetQueriesService).getTotalBudgeted(
                testBudget.getId(), testBudget.getUserId(), startDate, endDate);
        verify(budgetQueriesService).getTotalSpentOnBudget(
                testBudget.getId(), startDate, endDate);
        verify(budgetCalculations).calculateAverageSpendingPerDayOnBudget(
                any(BigDecimal.class), any(BigDecimal.class), any(BudgetPeriod.class));
    }

    private List<Object[]> mockBudgetStatsResults(List<BudgetStats> expectedStats) {
        return expectedStats.stream()
                .map(stat -> new Object[] {
                        stat.getBudgetId(),
                        stat.getTotalBudget().doubleValue(),
                        stat.getTotalSpent().doubleValue(),
                        stat.getRemaining().doubleValue(),
                        stat.getTotalSaved().doubleValue(),
                        stat.getAverageSpendingPerDay().doubleValue(),
                        stat.getDateRange().getStartDate(),
                        stat.getDateRange().getEndDate()
                })
                .collect(Collectors.toList());
    }

    @AfterEach
    void tearDown() {
    }
}