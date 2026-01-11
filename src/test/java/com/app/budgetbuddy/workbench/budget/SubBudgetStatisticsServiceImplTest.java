package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BudgetStatisticsService;
import com.app.budgetbuddy.services.SubBudgetService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Qualifier;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubBudgetStatisticsServiceImplTest
{
    @Mock
    private BudgetQueriesService budgetQueriesService;

    @Mock
    private BudgetCalculations budgetCalculations;

    @Mock
    private BudgetStatisticsService budgetStatisticsService;

    @Mock
    private SubBudgetService subBudgetService;

    @Mock
    @Qualifier("subBudgetHealth")
    private BudgetHealthService<SubBudget> subBudgetBudgetHealthService;

    @InjectMocks
    private SubBudgetStatisticsServiceImpl subBudgetStatisticsService;

    private Budget testBudget;

    private SubBudget testSubBudget;

    @BeforeEach
    void setUp()
    {
        // Create a test budget

        testBudget = Budget.builder()
                .budgetPeriod(Period.MONTHLY)
                .startDate(LocalDate.of(2025, 1, 1))
                .endDate(LocalDate.of(2025, 12, 31))
                .income(BigDecimal.valueOf(39000))
                .savingsProgress(BigDecimal.valueOf(0))
                .totalMonthsToSave(12)
                .budgetAmount(BigDecimal.valueOf(39000))
                .budgetMode(BudgetMode.SAVINGS_PLAN)
                .budgetName("2025 Savings Budget Plan")
                .userId(1L)
                .build();

        // Create a test sub-budget
        testSubBudget = new SubBudget();
        testSubBudget.setId(101L);
        testSubBudget.setSubBudgetName("March 2023");
        testSubBudget.setBudget(testBudget);
        testSubBudget.setStartDate(LocalDate.of(2023, 3, 1));
        testSubBudget.setEndDate(LocalDate.of(2023, 3, 31));
        testSubBudget.setAllocatedAmount(new BigDecimal("1200.00"));
        testSubBudget.setSubSavingsTarget(new BigDecimal("200.00"));


        subBudgetStatisticsService = new SubBudgetStatisticsServiceImpl(budgetQueriesService, budgetCalculations, budgetStatisticsService, subBudgetService, subBudgetBudgetHealthService);
    }

    @Test
    void testGetBudgetStats_whenSubBudgetIsNull_thenReturnEmptyList(){
        List<BudgetStats> actual = subBudgetStatisticsService.getBudgetStats(null);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGetBudgetStats_validSubBudget_returnsCorrectStats() {
        // Arrange
        BigDecimal totalSpent = new BigDecimal("850.00");
        BigDecimal healthScore = new BigDecimal("87.5");
        BigDecimal averageSpendingPerDay = new BigDecimal("27.42");

        // Mock the queries service to return a total spent amount
        when(budgetQueriesService.getTotalSpentOnBudget(
                eq(testSubBudget.getId()),
                eq(testSubBudget.getStartDate()),
                eq(testSubBudget.getEndDate())))
                .thenReturn(totalSpent);

        // Mock the budget calculations
        when(budgetCalculations.calculateTotalBudgetHealth(
                eq(testSubBudget.getAllocatedAmount()),
                eq(totalSpent),
                eq(testSubBudget.getSubSavingsTarget())))
                .thenReturn(healthScore);

        when(budgetCalculations.calculateAverageSpendingPerDayOnBudget(
                eq(testSubBudget.getAllocatedAmount()),
                eq(totalSpent),
                any(BudgetPeriod.class)))
                .thenReturn(averageSpendingPerDay);

        // Act
        List<BudgetStats> result = subBudgetStatisticsService.getBudgetStats(testSubBudget);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());

        BudgetStats stats = result.get(0);
        assertEquals(testSubBudget.getId(), stats.getBudgetId());
        assertEquals(0, testSubBudget.getAllocatedAmount().compareTo(stats.getTotalBudget()));
        assertEquals(0, totalSpent.compareTo(stats.getTotalSpent()));

        // Calculate expected remaining amount
        BigDecimal expectedRemaining = testSubBudget.getAllocatedAmount().subtract(totalSpent);
        assertEquals(0, expectedRemaining.compareTo(stats.getRemaining()));

        // Calculate expected savings
        BigDecimal expectedSavings = testSubBudget.getAllocatedAmount().subtract(expectedRemaining);
        assertEquals(0, expectedSavings.compareTo(stats.getTotalSaved()));

        // Check health score and average spending
        assertEquals(1, healthScore.compareTo(stats.getHealthScore()));
        assertEquals(0, averageSpendingPerDay.compareTo(stats.getAverageSpendingPerDay()));

        // Check date range
        assertEquals(testSubBudget.getStartDate(), stats.getDateRange().getStartDate());
        assertEquals(testSubBudget.getEndDate(), stats.getDateRange().getEndDate());

        // Verify service interactions
        verify(budgetQueriesService).getTotalSpentOnBudget(
                testSubBudget.getId(),
                testSubBudget.getStartDate(),
                testSubBudget.getEndDate());

        verify(budgetCalculations).calculateTotalBudgetHealth(
                testSubBudget.getAllocatedAmount(),
                totalSpent,
                testSubBudget.getSubSavingsTarget());

        verify(budgetCalculations).calculateAverageSpendingPerDayOnBudget(
                eq(testSubBudget.getAllocatedAmount()),
                eq(totalSpent),
                any(BudgetPeriod.class));
    }

    @Test
    void testGetBudgetStats_exceptionThrown_returnsEmptyList() {
        // Arrange
        when(budgetQueriesService.getTotalSpentOnBudget(
                any(Long.class),
                any(LocalDate.class),
                any(LocalDate.class)))
                .thenThrow(new RuntimeException("Test exception"));

        // Act
        List<BudgetStats> result = subBudgetStatisticsService.getBudgetStats(testSubBudget);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }








    @AfterEach
    void tearDown() {
    }
}