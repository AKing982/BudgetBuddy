package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class PreCalculationThreadService
{
    private final ThreadPoolTaskScheduler threadPoolTaskScheduler;

    @Autowired
    public PreCalculationThreadService(ThreadPoolTaskScheduler threadPoolTaskScheduler)
    {
        this.threadPoolTaskScheduler = threadPoolTaskScheduler;
    }

    public CompletableFuture<List<BudgetCategory>> fetchWeeklyBudgetCategories(final List<BudgetScheduleRange> budgetScheduleRanges, final Long subBudgetId)
    {
        return null;
    }

    public CompletableFuture<List<SubBudgetGoals>> fetchWeeklySubBudgetGoals(final Long subBudgetId, final List<BudgetScheduleRange> budgetScheduleRanges)
    {
        return null;
    }

    public CompletableFuture<Map<String, Map<String, PreCalculationEntry>>> fetchWeeklyCategoryEntries(final List<BudgetScheduleRange> budgetScheduleRanges, final List<BudgetCategory> budgetCategories, final Long subBudgetId)
    {
        return null;
    }

    public CompletableFuture<Map<String, Map<String, PreCalculationGoalEntry>>> fetchWeeklyCategoryGoalEntries(final List<BudgetScheduleRange> budgetScheduleRanges, final List<BudgetCategory> budgetCategories, final Long subBudgetId)
    {
        return null;
    }

    private Map<EntryType, List<PreCalculationEntry>> splitCalculationEntriesByType(final List<PreCalculationEntry> preCalculationEntries)
    {
        return null;
    }

    public Map<String, Map<EntryType, BigDecimal>> calculateTotalSpendingForEntries(final List<PreCalculationEntry> preCalculationEntries)
    {
        return null;
    }
}
