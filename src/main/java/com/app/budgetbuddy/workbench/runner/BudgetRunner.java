package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.services.*;
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
        Optional<Budget> budgetOptional = Optional.ofNullable(budgetService.loadUserBudget(userId));
        if(budgetOptional.isEmpty())
        {
            log.warn("No Budgets found for user {}", userId);
            return new ArrayList<>();
        }
        Budget budget = budgetOptional.get();
        log.info("Found Budget: {}", budget);
        Optional<SubBudget> subBudgetOptional = subBudgetService.getSubBudgetsByUserIdAndDate(userId, startDate, endDate);
        if(subBudgetOptional.isEmpty())
        {
            log.warn("No subbudgets found for user {} between {} and {}", userId, startDate, endDate);
            return Collections.emptyList();
        }
        SubBudget subBudget = subBudgetOptional.get();
        Long subBudgetId = subBudget.getId();
        List<BudgetSchedule> budgetSchedules = subBudget.getBudgetSchedule();
        if(budgetSchedules.isEmpty())
        {
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
        periodCategories.forEach((periodCategory) -> {
            log.info("BudgetPeriodCategory: {}", periodCategory);
        });

        List<ExpenseCategory> topFiveExpenses = subBudgetOverviewService.loadTopExpenseCategories(subBudgetId, startDate, endDate);
        log.info("Retrieved {} top five expenses for SubBudget ID: {}", topFiveExpenses.size(), subBudgetId);

        Optional<ExpenseCategory> expenseCategories = subBudgetOverviewService.loadExpenseCategory(subBudgetId, startDate, endDate);
        log.info("Retrieved {} expense categories for SubBudget ID: {}", expenseCategories, subBudgetId);

        Optional<IncomeCategory> incomeCategory = subBudgetOverviewService.loadIncomeCategory(subBudgetId, startDate, endDate);
        log.info("Retrieved {} income category for SubBudget ID: {}", incomeCategory, subBudgetId);

        Optional<SavingsCategory> savingsCategory = subBudgetOverviewService.loadSavingsCategory(subBudgetId, startDate, endDate);
        log.info("Retrieved {} savings category for SubBudget ID: {}", savingsCategory, subBudgetId);


        // Build Result
        BudgetRunnerResult result = new BudgetRunnerResult(
                budget,
                subBudget,
                budgetSchedule,
                budgetStats,
                new BudgetCategoryStats(periodCategories, topFiveExpenses, expenseCategories, savingsCategory, incomeCategory),
                budgetHealthScore.getScoreValue().compareTo(new BigDecimal("50")) < 0
        );
        log.info("Budget Runner Result: {}", result.getProcessingSummary());

        return List.of(result);
    }
}
