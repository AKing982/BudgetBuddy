package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WeeklyBudgetPeriodCategoryHandlerTest {

    @Mock
    private EntityManager entityManager;

    @Mock
    private TypedQuery<Object[]> typedQuery;

    @InjectMocks
    private WeeklyBudgetPeriodCategoryHandler handler;

    private SubBudget subBudget;

    private BudgetSchedule budgetSchedule;

    private Budget budget;

    @BeforeEach
    void setUp()
    {

        budget = Budget.builder()
                .id(1L)
                .startDate(LocalDate.of(2025, 1, 1))
                .endDate(LocalDate.of(2025, 12, 31))
                .income(new BigDecimal("39000"))
                .budgetPeriod(Period.MONTHLY)
                .totalMonthsToSave(12)
                .budgetName("Savings Plan")
                .budgetMode(BudgetMode.SAVINGS_PLAN)
                .budgetDescription("2025 Budget Savings Plan (Monthly)")
                .budgetAmount(new BigDecimal("39000"))
                .build();

        subBudget = SubBudget.builder()
                .id(1L)
                .startDate(LocalDate.of(2025, 1, 1))
                .endDate(LocalDate.of(2025,1, 31))
                .budget(budget)
                .allocatedAmount(new BigDecimal("3260"))
                .spentOnBudget(new BigDecimal("50.00"))
                .subBudgetName("January Budget")
                .subSavingsAmount(new BigDecimal("120"))
                .subSavingsTarget(new BigDecimal("250"))
                .isActive(true)
                .build();

        List<BudgetScheduleRange> scheduleRanges = new ArrayList<>();

        // Week 1: Jan 1-7
        scheduleRanges.add(BudgetScheduleRange.builder()
                .budgetScheduleId(1L)
                .startRange(LocalDate.of(2025, 1, 1))
                .endRange(LocalDate.of(2025, 1, 7))
                .budgetedAmount(new BigDecimal("300.00"))
                .spentOnRange(new BigDecimal("195.00"))
                .budgetDateRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7)))
                .rangeType("WEEKLY")
                .build());

        // Week 2: Jan 8-14
        scheduleRanges.add(BudgetScheduleRange.builder()
                .budgetScheduleId(1L)
                .startRange(LocalDate.of(2025, 1, 8))
                .endRange(LocalDate.of(2025, 1, 14))
                .budgetedAmount(new BigDecimal("300.00"))
                .spentOnRange(new BigDecimal("270.00"))
                .budgetDateRange(new DateRange(LocalDate.of(2025, 1, 8), LocalDate.of(2025, 1, 14)))
                .rangeType("WEEKLY")

                .build());

        // Week 3: Jan 15-21
        scheduleRanges.add(BudgetScheduleRange.builder()
                .budgetScheduleId(1L)
                .startRange(LocalDate.of(2025, 1, 15))
                .endRange(LocalDate.of(2025, 1, 21))
                .budgetedAmount(new BigDecimal("300.00"))
                .spentOnRange(new BigDecimal("305.00"))
                .budgetDateRange(new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 21)))
                .rangeType("WEEKLY")
                .build());

        // Week 4: Jan 22-28
        scheduleRanges.add(BudgetScheduleRange.builder()
                .budgetScheduleId(1L)
                .startRange(LocalDate.of(2025, 1, 22))
                .endRange(LocalDate.of(2025, 1, 28))
                .budgetedAmount(new BigDecimal("300.00"))
                .spentOnRange(new BigDecimal("255.00"))
                .budgetDateRange(new DateRange(LocalDate.of(2025, 1, 22), LocalDate.of(2025, 1, 28)))
                .rangeType("WEEKLY")
                .build());

        // Week 5: Jan 29-31 (partial week)
        scheduleRanges.add(BudgetScheduleRange.builder()
                .budgetScheduleId(1L)
                .startRange(LocalDate.of(2025, 1, 29))
                .endRange(LocalDate.of(2025, 1, 31))
                .budgetedAmount(new BigDecimal("150.00"))
                .spentOnRange(new BigDecimal("135.00"))
                .budgetDateRange(new DateRange(LocalDate.of(2025, 1, 29), LocalDate.of(2025, 1, 31)))
                .rangeType("WEEKLY")
                .build());

        budgetSchedule = BudgetSchedule.builder()
                .budgetScheduleId(1L)
                .subBudgetId(1L)
                .startDate(LocalDate.of(2025, 1, 1))
                .endDate(LocalDate.of(2025, 1, 31))
                .periodType(Period.WEEKLY)
                .budgetScheduleRanges(scheduleRanges)
                .build();
    }


    @Test
    @DisplayName("Should return empty list when budget schedule is null")
    void shouldReturnEmptyListWhenBudgetScheduleIsNull() {
        List<BudgetPeriodCategory> result = handler.getBudgetPeriodCategories(null);
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Should handle normal use case for months worth of categories")
    void shouldHandleNormalUseCaseForMonthsWorthOfCategories() {
        // Mock data for each week
        // Week 1: Jan 1-7
        Object[] week1Data1 = new Object[]{1L, "Category1", 100.0, 25.0, 75.0};
        Object[] week1Data2 = new Object[]{2L, "Category2", 150.0, 125.0, 25.0};
        Object[] week1Data3 = new Object[]{3L, "Category3", 50.0, 45.0, 5.0};

        // Week 2: Jan 8-14
        Object[] week2Data1 = new Object[]{1L, "Category1", 100.0, 75.0, 25.0};
        Object[] week2Data2 = new Object[]{2L, "Category2", 150.0, 160.0, -10.0};
        Object[] week2Data3 = new Object[]{3L, "Category3", 50.0, 35.0, 15.0};

        // Week 3: Jan 15-21
        Object[] week3Data1 = new Object[]{1L, "Category1", 100.0, 95.0, 5.0};
        Object[] week3Data2 = new Object[]{2L, "Category2", 150.0, 145.0, 5.0};
        Object[] week3Data3 = new Object[]{3L, "Category3", 50.0, 65.0, -15.0};

        // Week 4: Jan 22-28
        Object[] week4Data1 = new Object[]{1L, "Category1", 100.0, 85.0, 15.0};
        Object[] week4Data2 = new Object[]{2L, "Category2", 150.0, 130.0, 20.0};
        Object[] week4Data3 = new Object[]{3L, "Category3", 50.0, 40.0, 10.0};

        // Week 5: Jan 29-31
        Object[] week5Data1 = new Object[]{1L, "Category1", 50.0, 45.0, 5.0};
        Object[] week5Data2 = new Object[]{2L, "Category2", 75.0, 70.0, 5.0};
        Object[] week5Data3 = new Object[]{3L, "Category3", 25.0, 20.0, 5.0};

        when(entityManager.createQuery(anyString(), eq(Object[].class)))
                .thenReturn(typedQuery);
        when(typedQuery.setParameter(anyString(), any()))
                .thenReturn(typedQuery);
        when(typedQuery.getResultList())
                .thenReturn(Arrays.asList(week1Data1, week1Data2, week1Data3))
                .thenReturn(Arrays.asList(week2Data1, week2Data2, week2Data3))
                .thenReturn(Arrays.asList(week3Data1, week3Data2, week3Data3))
                .thenReturn(Arrays.asList(week4Data1, week4Data2, week4Data3))
                .thenReturn(Arrays.asList(week5Data1, week5Data2, week5Data3));

        List<BudgetPeriodCategory> result = handler.getBudgetPeriodCategories(budgetSchedule);

        // Verify results
        assertThat(result).hasSize(15); // 3 categories x 5 weeks

        // Verify specific status checks
        // Week 1
        assertThat(result.get(0).getBudgetStatus()).isEqualTo(BudgetStatus.UNDER_UTILIZED); // 25%
        assertThat(result.get(1).getBudgetStatus()).isEqualTo(BudgetStatus.GOOD); // 83%
        assertThat(result.get(2).getBudgetStatus()).isEqualTo(BudgetStatus.GOOD); // 90%

        // Week 2
        assertThat(result.get(3).getBudgetStatus()).isEqualTo(BudgetStatus.GOOD); // 75%
        assertThat(result.get(4).getBudgetStatus()).isEqualTo(BudgetStatus.OVER_BUDGET); // 107%
        assertThat(result.get(5).getBudgetStatus()).isEqualTo(BudgetStatus.UNDER_UTILIZED); // 70%

        // Week 3
        assertThat(result.get(6).getBudgetStatus()).isEqualTo(BudgetStatus.GOOD); // 95%
        assertThat(result.get(7).getBudgetStatus()).isEqualTo(BudgetStatus.GOOD); // 97%
        assertThat(result.get(8).getBudgetStatus()).isEqualTo(BudgetStatus.OVER_BUDGET); // 130%

        // Verify date ranges
        assertThat(result.get(0).getDateRange().getStartDate()).isEqualTo(LocalDate.of(2025, 1, 1));
        assertThat(result.get(0).getDateRange().getEndDate()).isEqualTo(LocalDate.of(2025, 1, 7));

        assertThat(result.get(3).getDateRange().getStartDate()).isEqualTo(LocalDate.of(2025, 1, 8));
        assertThat(result.get(3).getDateRange().getEndDate()).isEqualTo(LocalDate.of(2025, 1, 14));

        // Verify remaining amounts
        assertThat(result.get(0).getRemaining()).isEqualTo(new BigDecimal("75.00"));
        assertThat(result.get(4).getRemaining()).isEqualTo(BigDecimal.ZERO); // Over budget case

        // Verify spending percentages
        assertThat(result.get(0).getSpendingPercentage()).isEqualTo(0.25);
        assertThat(result.get(4).getSpendingPercentage()).isGreaterThan(1.0);
    }



    @AfterEach
    void tearDown() {
    }
}