package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.workbench.budget.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
        if (budget == null || startDate == null || endDate == null) {
            return BigDecimal.ZERO;
        }

        try {
            // Get total budgeted amount
            BigDecimal totalBudgeted = budgetQueriesService.getTotalBudgeted(
                    budget.getId(),
                    budget.getUserId(),
                    startDate,
                    endDate
            );

            // Get total spent amount
            BigDecimal totalSpent = budgetQueriesService.getTotalSpentOnBudget(
                    budget.getId(),
                    startDate,
                    endDate
            );

            if (totalBudgeted.compareTo(BigDecimal.ZERO) == 0) {
                return BigDecimal.ZERO;
            }

            // Calculate components of health score
            BigDecimal spendingRatio = totalSpent.divide(totalBudgeted, 2, RoundingMode.HALF_UP);

            // Score calculation:
            // - 100 points if spending is exactly at budget
            // - Deduct points based on how far from budget (over or under)
            BigDecimal baseScore = new BigDecimal("100");
            BigDecimal difference = BigDecimal.ONE.subtract(spendingRatio).abs();
            BigDecimal deduction = difference.multiply(new BigDecimal("100"));

            BigDecimal healthScore = baseScore.subtract(deduction);

            // Ensure score is between 0 and 100
            return healthScore.max(BigDecimal.ZERO).min(new BigDecimal("100"));

        } catch (Exception e) {
            log.error("Error calculating budget health score for budget {}: ", budget.getId(), e);
            return BigDecimal.ZERO;
        }
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
            BigDecimal totalSaved = budgetCalculations.calculateTotalSavedInBudget(budget, totalSpent, monthRange);

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

    public List<BudgetCategory> loadTopExpenseCategories(final Budget budget, final LocalDate startDate, final LocalDate endDate){
        if(budget == null || startDate == null || endDate == null){
            return Collections.emptyList();
        }

        try {
            Long budgetId = budget.getId();
            if (budgetId == null || budgetId < 1L) {
                throw new IllegalArgumentException("Invalid budget ID");
            }
            return budgetQueriesService.getTopExpenseBudgetCategories(budgetId, startDate, endDate);
        } catch(IllegalArgumentException e) {
            log.error("Invalid budget provided: ", e);
            return Collections.emptyList();
        } catch(DataAccessException e) {
            log.error("Error loading top expense categories for budget {} between {} and {}: ",
                    budget.getId(), startDate, endDate, e);
            return Collections.emptyList();
        } catch(Exception e) {
            log.error("Unexpected error loading top expense categories: ", e);
            return Collections.emptyList();
        }
    }

    public List<BudgetCategory> loadExpenseCategory(final Long budgetId, final LocalDate startDate, final LocalDate endDate, final Period period){
        if(budgetId == null || startDate == null || endDate == null){
            return Collections.emptyList();
        }
        return budgetQueriesService.getTopExpenseBudgetCategories(budgetId, startDate, endDate);
    }

    public List<BudgetCategory> loadSavingsCategory(final Long budgetId, final LocalDate startDate, final LocalDate endDate, final Period period){
        if(budgetId == null || startDate == null || endDate == null){
            return Collections.emptyList();
        }
        return budgetQueriesService.getSavingsBudgetCategory(budgetId, startDate, endDate);
    }

    public List<BudgetCategory> loadIncomeCategory(final BigDecimal incomeAmount, final Long budgetId, final LocalDate startDate, final LocalDate endDate){
        if(budgetId == null || startDate == null || endDate == null){
            return Collections.emptyList();
        }
        return budgetQueriesService.getIncomeBudgetCategory(budgetId, startDate, endDate);
    }

    public static void main(String[] args){

    }

}
