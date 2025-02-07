package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetStats;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public abstract class AbstractBudgetStatisticsService<T>
{
    protected BudgetQueriesService budgetQueriesService;
    protected BudgetCalculations budgetCalculations;

    public AbstractBudgetStatisticsService(BudgetQueriesService budgetQueriesService, BudgetCalculations budgetCalculations)
    {
        this.budgetQueriesService = budgetQueriesService;
        this.budgetCalculations = budgetCalculations;
    }

    abstract List<BudgetStats> getBudgetStats(T budget);
}
