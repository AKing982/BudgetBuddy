package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetStats;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.entities.BudgetStatisticsEntity;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.services.BudgetStatisticsService;
import com.app.budgetbuddy.services.SubBudgetService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Component
@Slf4j
public abstract class AbstractBudgetStatisticsService<T>
{
    protected BudgetQueriesService budgetQueriesService;
    protected BudgetStatisticsService budgetStatisticsService;
    protected BudgetCalculations budgetCalculations;


    public AbstractBudgetStatisticsService(BudgetQueriesService budgetQueriesService, BudgetCalculations budgetCalculations, BudgetStatisticsService budgetStatisticsService)
    {
        this.budgetQueriesService = budgetQueriesService;
        this.budgetCalculations = budgetCalculations;
        this.budgetStatisticsService = budgetStatisticsService;
    }

    public abstract List<BudgetStatisticsEntity> saveBudgetStats(final List<BudgetStats> budgets);

    public abstract List<BudgetStats> getBudgetStats(T budget);
}
