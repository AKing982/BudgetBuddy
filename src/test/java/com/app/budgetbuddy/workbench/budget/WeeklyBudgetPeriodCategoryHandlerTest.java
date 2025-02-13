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

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

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

    @BeforeEach
    void setUp()
    {

        subBudget = SubBudget.builder()
                .id(1L)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(14))
                .isActive(true)
                .build();

        budgetSchedule = BudgetSchedule.builder()
                .budgetScheduleId(1L)
                .subBudgetId(1L)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(14))
                .period(Period.WEEKLY)
                .build();
    }

    @Test
    @DisplayName("Should return empty list when budget is null")
    void shouldReturnEmptyListWhenBudgetIsNull() {
        List<BudgetPeriodCategory> result = handler.getBudgetPeriodCategories(null, budgetSchedule);
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Should return empty list when budget schedule is null")
    void shouldReturnEmptyListWhenBudgetScheduleIsNull() {
        List<BudgetPeriodCategory> result = handler.getBudgetPeriodCategories(subBudget, null);
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Should handle normal use case for months worth of categories")
    void shouldHandleNormalUseCaseForMonthsWorthOfCategories() {
        List<BudgetPeriodCategory> expected = new ArrayList<>();
        
    }



    @AfterEach
    void tearDown() {
    }
}