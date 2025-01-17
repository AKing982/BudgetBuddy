package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.services.BudgetScheduleService;
import com.app.budgetbuddy.services.BudgetService;
import com.app.budgetbuddy.workbench.budget.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Slf4j
public class BudgetRunner
{
    private final BudgetPeriodQueries budgetPeriodQueries;
    private final BudgetQueriesService budgetQueriesService;
    private final BudgetCalculations budgetCalculations;
    private final BudgetScheduleService budgetScheduleService;
    private final BudgetService budgetService;

    @Autowired
    public BudgetRunner(BudgetPeriodQueries budgetPeriodQueries,
                        BudgetQueriesService budgetQueriesService,
                        BudgetCalculations budgetCalculations,
                        BudgetScheduleService budgetScheduleService,
                        BudgetService budgetService){
        this.budgetPeriodQueries = budgetPeriodQueries;
        this.budgetQueriesService = budgetQueriesService;
        this.budgetCalculations = budgetCalculations;
        this.budgetScheduleService = budgetScheduleService;
        this.budgetService = budgetService;
    }

    private Optional<BudgetSchedule> getBudgetScheduleParam(final Budget budget, final LocalDate startDate, final LocalDate endDate)
    {
        List<BudgetSchedule> budgetSchedules = budget.getBudgetSchedules();
        Optional<BudgetSchedule> budgetScheduleOptional = Optional.empty();
        for(BudgetSchedule budgetSchedule : budgetSchedules)
        {
            if(budgetSchedule != null)
            {
                LocalDate budgetScheduleStartDate = budgetSchedule.getStartDate();
                LocalDate budgetScheduleEndDate = budgetSchedule.getEndDate();
                if(startDate.isAfter(budgetScheduleStartDate) && endDate.isBefore(budgetScheduleEndDate))
                {
                    budgetScheduleOptional = Optional.of(budgetSchedule);
                    break;
                }
            }
        }
        return budgetScheduleOptional;
    }

    public List<BudgetRunnerResult> runBudgetProcess(final Long userId, final LocalDate startDate, final LocalDate endDate){
        log.info("Starting monthly budget process for user {} between {} and {}", userId, startDate, endDate);
        Budget userBudget = budgetService.loadUserBudgetForPeriod(userId, startDate, endDate);
        try
        {
            Optional<BudgetSchedule> budgetScheduleOptional = getBudgetScheduleParam(userBudget, startDate, endDate);
            if(budgetScheduleOptional.isEmpty())
            {
                return Collections.emptyList();
            }
            BudgetSchedule budgetSchedule = budgetScheduleOptional.get();
            List<BudgetRunnerResult> budgetRunnerResults = new ArrayList<>();
            BudgetRunnerResult budgetRunnerResult = processBudget(userBudget, budgetSchedule, startDate, endDate);
            budgetRunnerResults.add(budgetRunnerResult);
            return budgetRunnerResults;

        }catch(Exception e){
            log.error("There was an error running budget process for user {} between {} and {}", userId, startDate, endDate);
            return Collections.emptyList();
        }
    }

    // TODO: Create a method that creates a new budget for a new period


    private List<BudgetPeriodCategory> loadPeriodCategories(final Budget budget, final BudgetSchedule budgetSchedule) {
        LocalDate startDate = budgetSchedule.getStartDate();
        LocalDate endDate = budgetSchedule.getEndDate();

        Period period = budgetSchedule.getPeriod();
        return switch (period) {
            case DAILY -> {
                DailyBudgetPeriod dailyPeriod = new DailyBudgetPeriod(startDate);
                yield getDailyBudgetPeriodCategories(dailyPeriod, budget);
            }
            case WEEKLY -> {
                WeeklyBudgetPeriod weeklyPeriod = new WeeklyBudgetPeriod(startDate, endDate);
                yield getWeeklyBudgetPeriodCategories(weeklyPeriod, budget);
            }
            case BIWEEKLY -> {
                BiWeeklyBudgetPeriod biWeeklyPeriod = new BiWeeklyBudgetPeriod(startDate, endDate);
                yield getBiWeeklyBudgetPeriodCategories(biWeeklyPeriod, budget);
            }
            case MONTHLY -> {
                MonthlyBudgetPeriod monthlyPeriod = new MonthlyBudgetPeriod(startDate, endDate);
                yield getMonthlyBudgetPeriodCategories(monthlyPeriod, budget);
            }
            case QUARTERLY -> null;
            case SEMIANNUAL -> null;
            case BIMONTHLY -> null;
            case ANNUAL -> null;
        };
    }

    private BudgetRunnerResult processBudget(Budget budget, BudgetSchedule budgetSchedule, LocalDate startDate, LocalDate endDate) {
        // Create date range for the month
        DateRange monthRange = new DateRange(startDate, endDate);

        // Calculate budget health score
        BigDecimal healthScore = calculateBudgetHealthScore(
                budget,
                startDate,
                endDate
        );

        // Load monthly statistics
        BudgetStats monthlyStats = loadMonthlyBudgetStatistics(
                monthRange,
                budget
        );

        // Get top expense categories
        List<Category> topExpenses = loadTopExpenseCategories(
                budget,
                startDate,
                endDate
        );

        List<Category> expenseCategories = loadExpenseCategory(
                budget.getId(),
                startDate,
                endDate,
                determineBudgetPeriod(startDate, endDate)
        );

        // Calculate budget period and load period categories
        Period budgetPeriod = determineBudgetPeriod(startDate, endDate);
        List<BudgetPeriodCategory> periodCategories = loadPeriodCategories(budget, budgetSchedule);

        // Load special categories
        List<Category> savingsCategories = loadSavingsCategory(
                budget.getId(),
                startDate,
                endDate,
                budgetPeriod
        );

        List<Category> incomeCategories = loadIncomeCategory(
                budget.getBudgetAmount(),
                budget.getId(),
                startDate,
                endDate
        );

        BudgetCategoryStats budgetCategoryStats = new BudgetCategoryStats(
                periodCategories,
                topExpenses,
                expenseCategories,
                savingsCategories,
                incomeCategories
        );

        // Build the result
        return BudgetRunnerResult.builder()
                .budget(budget)
                .budgetSchedule(budgetSchedule)
                .budgetStats(monthlyStats)
                .budgetCategoryStats(budgetCategoryStats)
                .build();
    }

    // Or better yet, create a utility method in your Budget class or a utility class:
    public static BigDecimal getActualOrZero(Budget budget) {
        return budget.getActual() != null ? budget.getActual() : BigDecimal.ZERO;
    }

    public static BigDecimal getBudgetAmountOrZero(Budget budget) {
        return budget.getBudgetAmount() != null ? budget.getBudgetAmount() : BigDecimal.ZERO;
    }


    private BigDecimal calculateRemainingAmount(Budget budget) {
        BigDecimal budgetAmount = budget.getBudgetAmount() != null ? budget.getBudgetAmount() : BigDecimal.ZERO;
        BigDecimal actualAmount = budget.getActual() != null ? budget.getActual() : BigDecimal.ZERO;
        return budgetAmount.subtract(actualAmount);
    }

    private Period determineBudgetPeriod(LocalDate startDate, LocalDate endDate) {
        long daysBetween = ChronoUnit.DAYS.between(startDate, endDate);

        if (daysBetween <= 1) {
            return Period.DAILY;
        } else if (daysBetween <= 7) {
            return Period.WEEKLY;
        } else if (daysBetween <= 14) {
            return Period.BIWEEKLY;
        } else {
            return Period.MONTHLY;
        }
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
            log.info("Total Budgeted: {}", totalBudgeted);

            // 2. Get total spent in the month
            BigDecimal totalSpent = budgetQueriesService.getTotalSpentOnBudget(
                    budget.getId(),
                    monthRange.getStartDate(),
                    monthRange.getEndDate()
            );
            log.info("Total Spent: {}", totalSpent);

            // 3. Calculate remaining amount
            BigDecimal remaining = totalBudgeted.subtract(totalSpent);

            // 4. Calculate savings
            BigDecimal totalSaved = budgetCalculations.calculateTotalSavedInBudget(budget, totalSpent, monthRange);
            log.info("Total Saved: {}", totalSaved);

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
            log.info("Average Daily: " + averageDaily);
            BudgetStats budgetStats = new BudgetStats(budget.getId(),
                    totalBudgeted,
                    totalSpent,
                    remaining,
                    totalSaved,
                    averageDaily,
                    monthRange);
            log.info("Budget Stats for month:{} ", budgetStats.toString());

            return budgetStats;

        }catch(IllegalArgumentException e){
            log.error("Error calculating monthly budget statistics for budget: {} and month range: {}",
                    budget.getId(), monthRange, e);
            throw e;
        }
    }

    public List<Category> loadTopExpenseCategories(final Budget budget, final LocalDate startDate, final LocalDate endDate){
        if(budget == null || startDate == null || endDate == null){
            return Collections.emptyList();
        }

        try {
            Long budgetId = budget.getId();
            if (budgetId == null || budgetId < 1L) {
                throw new IllegalArgumentException("Invalid budget ID");
            }
            List<Category> budgetCategories = budgetQueriesService.getTopExpenseBudgetCategories(budgetId, startDate, endDate);
            log.info("Top Expense Categories: {}", budgetCategories.size());
            return budgetCategories;
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

    public List<Category> loadExpenseCategory(final Long budgetId, final LocalDate startDate, final LocalDate endDate, final Period period){
        if(budgetId == null || startDate == null || endDate == null){
            return Collections.emptyList();
        }
        return budgetQueriesService.getExpensesBudgetCategories(budgetId, startDate, endDate);
    }

    public List<Category> loadSavingsCategory(final Long budgetId, final LocalDate startDate, final LocalDate endDate, final Period period){
        if(budgetId == null || startDate == null || endDate == null){
            return Collections.emptyList();
        }
        List<Category> savingsBudgetCategory = budgetQueriesService.getSavingsBudgetCategory(budgetId, startDate, endDate);
        savingsBudgetCategory.forEach(budgetCategory -> {
            log.info("Saving category: {}", budgetCategory);
        });
        return budgetQueriesService.getSavingsBudgetCategory(budgetId, startDate, endDate);
    }

    public List<Category> loadIncomeCategory(final BigDecimal incomeAmount, final Long budgetId, final LocalDate startDate, final LocalDate endDate){
        if(budgetId == null || startDate == null || endDate == null){
            return Collections.emptyList();
        }
        return budgetQueriesService.getIncomeBudgetCategory(budgetId, startDate, endDate);
    }

}
