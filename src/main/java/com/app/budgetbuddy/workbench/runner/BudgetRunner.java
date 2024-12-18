package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.workbench.budget.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

@Service
@Slf4j
public class BudgetRunner
{
    private final BudgetPeriodQueries budgetPeriodQueries;
    private final BudgetQueriesService budgetQueriesService;
    private final BudgetCalculations budgetCalculations;

    @Autowired
    public BudgetRunner(BudgetPeriodQueries budgetPeriodQueries,
                        BudgetQueriesService budgetQueriesService,
                        BudgetCalculations budgetCalculations){
        this.budgetPeriodQueries = budgetPeriodQueries;
        this.budgetQueriesService = budgetQueriesService;
        this.budgetCalculations = budgetCalculations;
    }

    public void executeBudgetRun()
    {

    }

    public BigDecimal calculateBudgetHealthScore(Budget budget, LocalDate startDate, LocalDate endDate){
        return null;
    }


    public List<BudgetPeriodCategory> getWeeklyBudgetPeriodCategories(final WeeklyBudgetPeriod weeklyBudgetPeriod, final Budget budget){
        if(weeklyBudgetPeriod == null || budget == null){
            return Collections.emptyList();
        }
        List<DateRange> weeklyRanges = weeklyBudgetPeriod.getWeeklyDateRange();
        List<BudgetPeriodCategory> budgetPeriodCategories = budgetPeriodQueries.getWeeklyBudgetPeriodCategories(weeklyRanges, budget);
        return new ArrayList<>(budgetPeriodCategories);
    }

    public List<BudgetPeriodCategory> getBiWeeklyBudgetPeriodCategories(final BiWeeklyBudgetPeriod budgetPeriod, final Budget budget){
        if(budgetPeriod == null || budget == null){
            return Collections.emptyList();
        }
        List<DateRange> biweeks = budgetPeriod.getBiWeeklyRanges();
        List<BudgetPeriodCategory> budgetPeriodCategories = budgetPeriodQueries.getBiWeeklyBudgetPeriodCategories(biweeks, budget);
        return new ArrayList<>(budgetPeriodCategories);
    }

    public List<BudgetPeriodCategory> getDailyBudgetPeriodCategories(final DailyBudgetPeriod dailyBudgetPeriod, final Budget budget)
    {
        if(dailyBudgetPeriod == null || budget == null){
            return Collections.emptyList();
        }
        LocalDate date = dailyBudgetPeriod.getStartDate();
        List<BudgetPeriodCategory> dailyBudgetPeriodQuery = budgetPeriodQueries.getDailyBudgetPeriodQuery(date, budget);
        return new ArrayList<>(dailyBudgetPeriodQuery);
    }

    public List<BudgetPeriodCategory> getMonthlyBudgetPeriodCategories(final MonthlyBudgetPeriod budgetPeriod, final Budget monthlyBudget)
    {
        List<BudgetPeriodCategory> budgetPeriodCategories = new ArrayList<>();
        if(budgetPeriod == null){
            return budgetPeriodCategories;
        }
        DateRange monthRange = budgetPeriod.getMonthRange();
        List<BudgetPeriodCategory> monthlyBudgetPeriodCategories = budgetPeriodQueries.getMonthlyBudgetPeriodCategories(monthRange, monthlyBudget);
        budgetPeriodCategories.addAll(monthlyBudgetPeriodCategories);
        return budgetPeriodCategories;
    }

    public BudgetStats loadMonthlyBudgetStatistics(final DateRange monthRange, final Budget budget)
    {
        if(monthRange == null || budget == null){
            throw new IllegalArgumentException("Month and budget are required");
        }

        try
        {
            // 1. Get total budgeted for the month
            BigDecimal totalBudgeted = budgetQueriesService.getTotalBudgeted(
                    budget.getId(),
                    budget.getUserId(),
                    monthRange.getStartDate(),
                    monthRange.getEndDate()
            );

            // 2. Get total spent in the month
            BigDecimal totalSpent = budgetQueriesService.getTotalSpentOnBudget(
                    budget.getId(),
                    monthRange.getStartDate(),
                    monthRange.getEndDate()
            );

            // 3. Calculate remaining amount
            BigDecimal remaining = totalBudgeted.subtract(totalSpent);

            // 4. Calculate savings
            BigDecimal totalSaved = totalBudgeted.subtract(remaining);

            // 5. Calculate daily average
            BudgetPeriod budgetPeriod = new BudgetPeriod(
                    Period.MONTHLY,
                    monthRange.getStartDate(),
                    monthRange.getEndDate()
            );
            BigDecimal averageDaily = budgetCalculations.calculateAverageSpendingPerDayOnBudget(
                    totalBudgeted,
                    totalSpent,
                    budgetPeriod
            );

            // 6. Return stats for this month
            return new BudgetStats(
                    budget.getId(),
                    totalBudgeted,
                    totalSpent,
                    remaining,
                    totalSaved,
                    averageDaily,
                    monthRange
            );

        }catch(IllegalArgumentException e){
            log.error("Error calculating monthly budget statistics for budget: {} and month range: {}",
                    budget.getId(), monthRange, e);
            throw e;
        }
    }

    public List<BudgetCategory> loadTopExpenseCategories(final Budget budget, final LocalDate startDate, final LocalDate endDate, final Period period){
        return null;
    }

    public List<BudgetCategory> loadExpenseCategory(final Budget budget, final LocalDate startDate, final LocalDate endDate, final Period period){
        return null;
    }

    public List<BudgetCategory> loadSavingsCategory(final Budget budget, final LocalDate startDate, final LocalDate endDate, final Period period){
        return null;
    }

    public List<BudgetCategory> loadIncomeCategory(final BigDecimal incomeAmount, final Long budgetId, final LocalDate startDate, final LocalDate endDate, final Period period){
        return null;
    }

    public static void main(String[] args){

    }

}
