package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.services.BudgetScheduleService;
import com.app.budgetbuddy.services.BudgetService;
import com.app.budgetbuddy.workbench.budget.*;
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
import java.util.Optional;
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
    private BudgetService budgetService;

    @Mock
    private BudgetBuilderService budgetBuilderService;

    @InjectMocks
    private BudgetRunner budgetRunner;

    private Budget testBudget;

//    @BeforeEach
//    void setUp() {
//        testBudget = new Budget();
//        testBudget.setId(1L);
//        testBudget.setActual(new BigDecimal("1630"));
//        testBudget.setBudgetAmount(new BigDecimal("3260"));
//        testBudget.setBudgetDescription("Savings Budget");
//        testBudget.setBudgetName("Savings Budget");
//        budgetRunner = new BudgetRunner(budgetPeriodQueries, budgetQueriesService, budgetCalculations,budgetBuilderService, budgetService);
//    }


    private BudgetSchedule createTestBudgetSchedule() {
        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setBudgetScheduleId(1L);
        budgetSchedule.setSubBudgetId(1L);
        budgetSchedule.setStartDate(LocalDate.of(2025, 1, 1));
        budgetSchedule.setEndDate(LocalDate.of(2025, 1, 31));
        budgetSchedule.setPeriodType(Period.MONTHLY);
        budgetSchedule.setStatus("ACTIVE");
        return budgetSchedule;
    }

    private Budget createTestBudget(LocalDate startDate, LocalDate endDate, Long budgetId) {
        Budget budget = new Budget();
        budget.setId(budgetId);
        budget.setBudgetAmount(new BigDecimal("3000.00"));
        budget.setBudgetName("Test Budget");
        budget.setBudgetDescription("Test Budget Description");
        budget.setUserId(1L);
        budget.setActual(new BigDecimal("1020"));

        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setSubBudgetId(budget.getId());
        budgetSchedule.setStartDate(startDate);
        budgetSchedule.setEndDate(endDate);
        budgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
        budgetSchedule.setTotalPeriods(4);
        budgetSchedule.setStatus("Active");
        budgetSchedule.setPeriodType(Period.MONTHLY);
//
//        budget.setBudgetSchedules(List.of(budgetSchedule));
        return budget;
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