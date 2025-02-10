package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.services.BudgetScheduleService;
import com.app.budgetbuddy.services.BudgetService;
import com.app.budgetbuddy.services.SubBudgetService;
import com.app.budgetbuddy.workbench.budget.*;
import com.app.budgetbuddy.workbench.subBudget.SubBudgetBuilderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Slf4j
public class BudgetRunner
{
    private final BudgetPeriodQueries budgetPeriodQueries;
    private final SubBudgetService subBudgetService;
    private final BudgetService budgetService;
    private final BudgetHealthService<SubBudget> budgetHealthService;
    private final AbstractBudgetStatisticsService<SubBudget> budgetStatisticsService;
    private final BudgetPeriodCategoryService budgetPeriodCategoryService;
    private final SubBudgetOverviewService subBudgetOverviewService;

    @Autowired
    public BudgetRunner(BudgetPeriodQueries budgetPeriodQueries,
                        SubBudgetService subBudgetService,
                        BudgetService budgetService,
                        BudgetHealthService<SubBudget> budgetHealthService,
                        @Qualifier("subBudgetStatisticsServiceImpl") AbstractBudgetStatisticsService<SubBudget> budgetStatisticsService,
                        BudgetPeriodCategoryService budgetPeriodCategoryService,
                        SubBudgetOverviewService subBudgetOverviewService) {
        this.budgetPeriodQueries = budgetPeriodQueries;
        this.subBudgetService = subBudgetService;
        this.budgetService = budgetService;
        this.budgetHealthService = budgetHealthService;
        this.budgetStatisticsService = budgetStatisticsService;
        this.budgetPeriodCategoryService = budgetPeriodCategoryService;
        this.subBudgetOverviewService = subBudgetOverviewService;
    }


    public List<BudgetRunnerResult> runBudgetProcess(final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        log.info("Starting monthly budget process for user {} between {} and {}", userId, startDate, endDate);
        Optional<SubBudget> subBudgetOptional = subBudgetService.getSubBudgetsByUserIdAndDate(userId, startDate, endDate);
        if(subBudgetOptional.isEmpty())
        {
            log.warn("No subbudgets found for user {} between {} and {}", userId, startDate, endDate);
            return Collections.emptyList();
        }
        SubBudget subBudget = subBudgetOptional.get();
        Long subBudgetId = subBudget.getId();
        List<BudgetSchedule> budgetSchedules = subBudget.getBudgetSchedule();
        if (budgetSchedules.isEmpty()) {
            log.warn("No budget schedules found for SubBudget ID: {}", subBudget.getId());
            return Collections.emptyList();
        }

        BudgetSchedule budgetSchedule = budgetSchedules.get(0); // Pick the first available schedule
        log.info("Processing SubBudget ID: {} with Budget Schedule ID: {}", subBudgetId, budgetSchedule.getBudgetScheduleId());

        // Calculate Budget Health Score
        BudgetHealthScore budgetHealthScore = budgetHealthService.calculateHealthScore(subBudget);
        log.info("Budget Health Score for SubBudget {}: {}", subBudgetId, budgetHealthScore.getScoreValue());

        // Get Budget Statistics
        List<BudgetStats> budgetStats = budgetStatisticsService.getBudgetStats(subBudget);
        log.info("Budget Stats for SubBudget {}: {}", subBudgetId, budgetStats);

        // Get Period Categories
        List<BudgetPeriodCategory> periodCategories = budgetPeriodCategoryService.getBudgetPeriodCategories(subBudget, budgetSchedule);
        log.info("Retrieved {} budget period categories for SubBudget ID: {}", periodCategories.size(), subBudgetId);

        List<ExpenseCategory> expenseCategories = subBudgetOverviewService.loadExpenseCategories(subBudgetId, startDate, endDate);
        log.info("Retrieved {} expense categories for SubBudget ID: {}", expenseCategories.size(), subBudgetId);


        // Build Result
        BudgetRunnerResult result = new BudgetRunnerResult(
                subBudget.getBudget(),
                budgetSchedule,
                budgetStats,
                new BudgetCategoryStats(periodCategories, List.of(), expenseCategories, List.of(), List.of()),
                budgetHealthScore.getScoreValue().compareTo(new BigDecimal("50")) < 0
        );
        log.info("Budget Runner Result: {}", result.getProcessingSummary());

        return List.of(result);
    }


}
