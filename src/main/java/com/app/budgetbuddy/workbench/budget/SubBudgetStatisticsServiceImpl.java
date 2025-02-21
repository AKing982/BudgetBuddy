package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BudgetStatisticsService;
import com.app.budgetbuddy.services.SubBudgetService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
@Slf4j
public class SubBudgetStatisticsServiceImpl extends AbstractBudgetStatisticsService<SubBudget>
{
    private TreeMap<Integer, List<SubBudget>> yearlySubBudgets = new TreeMap<>();

    @Autowired
    public SubBudgetStatisticsServiceImpl(BudgetQueriesService budgetQueriesService,
                                          BudgetCalculations budgetCalculations, BudgetStatisticsService budgetStatisticsService,
                                          SubBudgetService subBudgetService)
    {
        super(budgetQueriesService, budgetCalculations, budgetStatisticsService, subBudgetService);
    }

    @Override
    public List<BudgetStats> getBudgetStats(SubBudget subBudget)
    {
        if (subBudget == null)
        {
            return Collections.emptyList();
        }
        LocalDate subBudgetStartDate = subBudget.getStartDate();
        LocalDate subBudgetEndDate = subBudget.getEndDate();
        Long budgetId = subBudget.getBudget().getId();
        try
        {
            BigDecimal subBudgetSavingsTarget = subBudget.getSubSavingsTarget();
            BigDecimal budgetAmount = subBudget.getAllocatedAmount();
            BigDecimal totalSpent = budgetQueriesService.getTotalSpentOnBudget(subBudget.getId(), subBudgetStartDate, subBudgetEndDate);
            BigDecimal remaining = budgetAmount.subtract(totalSpent);
            BigDecimal savings = budgetAmount.subtract(remaining);
            BigDecimal budgetHealthScore = budgetCalculations.calculateTotalBudgetHealth(budgetAmount, totalSpent, subBudgetSavingsTarget);

            BudgetStats subBudgetStats = new BudgetStats(
                    subBudget.getId(),
                    budgetAmount,
                    totalSpent,
                    remaining,
                    savings,
                    budgetHealthScore,
                    budgetCalculations.calculateAverageSpendingPerDayOnBudget(budgetAmount, totalSpent, new BudgetPeriod(Period.MONTHLY, subBudgetStartDate, subBudgetEndDate)),
                    new DateRange(subBudgetStartDate, subBudgetEndDate)
            );

            return List.of(subBudgetStats);

        } catch (Exception e) {
            log.error("Error calculating sub-budget statistics for sub-budget {}: ", subBudget.getId(), e);
            return Collections.emptyList();
        }
    }
}
