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
    private SubBudgetService subBudgetService;

    public AbstractBudgetStatisticsService(BudgetQueriesService budgetQueriesService, BudgetCalculations budgetCalculations, BudgetStatisticsService budgetStatisticsService, SubBudgetService subBudgetService)
    {
        this.budgetQueriesService = budgetQueriesService;
        this.budgetCalculations = budgetCalculations;
        this.budgetStatisticsService = budgetStatisticsService;
        this.subBudgetService = subBudgetService;
    }

    public List<BudgetStatisticsEntity> saveBudgetStats(final List<BudgetStats> budgets)
    {
        List<BudgetStatisticsEntity> budgetStatisticsEntities = new ArrayList<>();
        try
        {
            for(BudgetStats budgetStats : budgets)
            {
                Long subBudgetId = budgetStats.getBudgetId();
                BudgetStatisticsEntity budgetStatisticsEntity = new BudgetStatisticsEntity();
                budgetStatisticsEntity.setTotalBudget(budgetStats.getTotalBudget());
                budgetStatisticsEntity.setHealthScore(budgetStats.getHealthScore());
                budgetStatisticsEntity.setTotalSpent(budgetStats.getTotalSpent());
                budgetStatisticsEntity.setAverageSpendingPerDay(budgetStats.getAverageSpendingPerDay());
                budgetStatisticsEntity.setSubBudget(getSubBudgetById(subBudgetId));
                budgetStatisticsService.save(budgetStatisticsEntity);
                budgetStatisticsEntities.add(budgetStatisticsEntity);
            }
            return budgetStatisticsEntities;
        }catch(Exception e)
        {
            log.error("There was an error saving the budget stats: ", e);
            return Collections.emptyList();
        }
    }

    private SubBudgetEntity getSubBudgetById(Long id)
    {
       return subBudgetService.findById(id).orElse(null);
    }

    public abstract List<BudgetStats> getBudgetStats(T budget);
}
