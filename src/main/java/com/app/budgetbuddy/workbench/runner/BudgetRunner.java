package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.workbench.budget.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
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

    public List<BudgetPeriodCategory> getBudgetPeriodCategories(final BudgetPeriod budgetPeriod, final Budget monthlyBudget)
    {
        List<BudgetPeriodCategory> budgetPeriodCategories = new ArrayList<>();
        if(budgetPeriod == null){
            return budgetPeriodCategories;
        }
        Period period = budgetPeriod.period();
        LocalDate budgetPeriodStartDate = budgetPeriod.startDate();
        LocalDate budgetPeriodEndDate = budgetPeriod.endDate();
        DateRange budgetDateRange = new DateRange(budgetPeriodStartDate, budgetPeriodEndDate);
        switch(period)
        {
            case MONTHLY -> {
                List<BudgetPeriodCategory> monthlyBudgetPeriodCategories = budgetPeriodQueries.getMonthlyBudgetPeriodCategories(budgetDateRange, monthlyBudget);
                budgetPeriodCategories.addAll(monthlyBudgetPeriodCategories);
                break;
            }
            case WEEKLY -> {
                List<DateRange> weeksDateRange = budgetDateRange.splitIntoWeeks();
                List<BudgetPeriodCategory> weeklyBudgetPeriodCategories = budgetPeriodQueries.getWeeklyBudgetPeriodCategories(weeksDateRange, monthlyBudget);
                budgetPeriodCategories.addAll(weeklyBudgetPeriodCategories);
                break;
            }
            case BIWEEKLY -> {
                List<DateRange> weeksDateRange = budgetDateRange.splitIntoBiWeeks();
                List<BudgetPeriodCategory> biweeklyBudgetPeriodCategories = budgetPeriodQueries.getBiWeeklyBudgetPeriodCategories(weeksDateRange, monthlyBudget);
                budgetPeriodCategories.addAll(biweeklyBudgetPeriodCategories);
                break;
            }
            case DAILY -> {
                if(budgetPeriodStartDate.equals(budgetPeriodEndDate)){
                    List<BudgetPeriodCategory> dailyBudgetPeriodCategories = budgetPeriodQueries.getDailyBudgetPeriodQuery(budgetPeriodStartDate, monthlyBudget);
                    budgetPeriodCategories.addAll(dailyBudgetPeriodCategories);
                }
                break;
            }
            default -> {
                throw new RuntimeException("Invalid Period selected: " + period);
            }
        }
        return budgetPeriodCategories;
    }

    public List<BudgetStats> loadBudgetStatisticsForUser(final LocalDate startDate, final LocalDate endDate, Budget budget)
    {
        List<BudgetStats> budgetStats = new ArrayList<>();
        // 1. What is the total budgeted for this period?
        BigDecimal totalBudgetedForPeriod = budgetQueriesService.getTotalBudgeted(budget.getId(), budget.getUserId(), startDate, endDate);

        // 2. What is the total spent on budget for this period?
        BigDecimal totalSpentOnBudget = budgetQueriesService.getTotalSpentOnBudget(budget.getId(), startDate, endDate);

        // 3. What is the remaining amount on the budget for this period?
        BigDecimal remainingAmount = totalBudgetedForPeriod.subtract(totalSpentOnBudget);

        // 4. How much was saved during this period?
        BigDecimal totalSaved = totalBudgetedForPeriod.subtract(remainingAmount);

        // 5. What is the average spending per day?
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, startDate, endDate);
        BigDecimal averageSpendingPerDay = budgetCalculations.calculateAverageSpendingPerDayOnBudget(totalBudgetedForPeriod, totalSpentOnBudget, budgetPeriod);

        // 6. Create the date range
        DateRange budgetDateRange = new DateRange(startDate, endDate);

        // 7. Build the budget stats

        // 8. Add to the list

        // 9. Return the budget stats list.
        return null;
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

    public void runTransactionCategoriesForUser(Long userId, LocalDate startDate, LocalDate endDate){

    }


    public static void main(String[] args){

    }

}
