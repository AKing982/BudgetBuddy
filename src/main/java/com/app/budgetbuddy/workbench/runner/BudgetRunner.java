package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.workbench.budget.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class BudgetRunner
{
    private final TransactionCategoryBuilder budgetCategoryBuilder;
    private final BudgetPeriodQueries budgetPeriodQueries;
    private final BudgetQueriesService budgetQueriesService;

    @Autowired
    public BudgetRunner(TransactionCategoryBuilder budgetCategoryBuilder,
                        BudgetPeriodQueries budgetPeriodQueries,
                        BudgetQueriesService budgetQueriesService){
        this.budgetCategoryBuilder = budgetCategoryBuilder;
        this.budgetPeriodQueries = budgetPeriodQueries;
        this.budgetQueriesService = budgetQueriesService;
    }

    public BudgetPeriodParams getBudgetPeriodData(final LocalDate startDate, final LocalDate endDate, final Long userId, final Period period)
    {
        return null;
    }

    public List<BudgetStats> loadBudgetStatisticsForUser(final LocalDate startDate, final LocalDate endDate, final Long userId)
    {
        return null;
    }

}
