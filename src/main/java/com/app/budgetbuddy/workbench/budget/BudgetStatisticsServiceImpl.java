package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class BudgetStatisticsServiceImpl extends AbstractBudgetStatisticsService<Budget>
{

    @Autowired
    public BudgetStatisticsServiceImpl(BudgetQueriesService budgetQueriesService,
                                       BudgetCalculations budgetCalculations)
    {
        super(budgetQueriesService, budgetCalculations);
    }

    @Override
    public List<BudgetStats> getBudgetStats(Budget budget)
    {
        if(budget == null)
        {
            return Collections.emptyList();
        }
        LocalDate startDate = budget.getStartDate();
        LocalDate endDate = budget.getEndDate();
        try
        {
            BigDecimal savingsGoalProgress = budget.getSavingsProgress();
            BigDecimal budgetAmount = budget.getBudgetAmount();
            BigDecimal totalSpent = budgetQueriesService.getTotalSpentOnBudget(budget.getId(), startDate, endDate);
            BigDecimal remaining = budgetAmount.subtract(totalSpent);
            BigDecimal savings = budgetCalculations.calculateTotalSavedInBudget(budget, totalSpent, new DateRange(startDate, endDate));
            BigDecimal budgetHealthScore = budgetCalculations.calculateTotalBudgetHealth(budgetAmount, totalSpent, savingsGoalProgress);

            BudgetStats budgetStats = new BudgetStats(
                    budget.getId(),
                    budgetAmount,
                    totalSpent,
                    remaining,
                    savings,
                    budgetHealthScore,
                    budgetCalculations.calculateAverageSpendingPerDayOnBudget(budgetAmount, totalSpent, new BudgetPeriod(Period.MONTHLY, startDate, endDate)),
                    new DateRange(startDate, endDate)
            );

            return List.of(budgetStats);

        } catch (Exception e)
        {
            log.error("Error calculating budget statistics for budget {}: ", budget.getId(), e);
            return Collections.emptyList();
        }
    }
}
