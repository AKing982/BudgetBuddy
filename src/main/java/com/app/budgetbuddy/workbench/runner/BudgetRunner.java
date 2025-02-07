package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
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
    private final BudgetBuilderService budgetBuilderService;
    private final BudgetService budgetService;

    @Autowired
    public BudgetRunner(BudgetPeriodQueries budgetPeriodQueries,
                        BudgetQueriesService budgetQueriesService,
                        BudgetCalculations budgetCalculations,
                        BudgetBuilderService budgetBuilderService,
                        BudgetService budgetService) {
        this.budgetPeriodQueries = budgetPeriodQueries;
        this.budgetQueriesService = budgetQueriesService;
        this.budgetCalculations = budgetCalculations;
        this.budgetBuilderService = budgetBuilderService;
        this.budgetService = budgetService;
    }

    /**
     * Creates both Budget and Budget Schedules for the designated period and user
     *
     * @param userId
     * @param startMonth
     * @param endMonth
     * @return
     */
    public Optional<Budget> createBudgetAndSubBudgetsForDates(final Long userId, final LocalDate startMonth, final LocalDate endMonth)
    {
        if (startMonth == null || endMonth == null)
        {
            return Optional.empty();
        }


        return null;
    }


    private Optional<BudgetSchedule> getBudgetScheduleParam(final Budget budget, final LocalDate startDate, final LocalDate endDate) {
        List<SubBudget> subBudgets = budget.getSubBudgets();
        Optional<BudgetSchedule> budgetScheduleOptional = Optional.empty();
        for (SubBudget subBudget : subBudgets) {
            List<BudgetSchedule> budgetSchedules = subBudget.getBudgetSchedule();
            for (BudgetSchedule budgetSchedule : budgetSchedules) {
                LocalDate budgetScheduleStartDate = budgetSchedule.getStartDate();
                LocalDate budgetScheduleEndDate = budgetSchedule.getEndDate();
                if (startDate.isAfter(budgetScheduleStartDate) && endDate.isBefore(budgetScheduleEndDate)) {
                    budgetScheduleOptional = Optional.of(budgetSchedule);
                    break;
                }
            }
        }
        return budgetScheduleOptional;
    }

    private List<BudgetSchedule> fetchBudgetSchedulesBySubBudgets(final Budget budget, final LocalDate startDate, final LocalDate endDate)
    {
        List<BudgetSchedule> budgetSchedules = new ArrayList<>();
        List<SubBudget> subBudgets = budget.getSubBudgets();
        if(!subBudgets.isEmpty())
        {
            for(SubBudget subBudget : subBudgets)
            {
                List<BudgetSchedule> budgetSchedulesForSubBudget = subBudget.getBudgetSchedule();
                for(BudgetSchedule budgetSchedule : budgetSchedulesForSubBudget)
                {
                    LocalDate budgetScheduleStartDate = budgetSchedule.getStartDate();
                    LocalDate budgetScheduleEndDate = budgetSchedule.getEndDate();
                    if(startDate.isAfter(budgetScheduleStartDate) && endDate.isBefore(budgetScheduleEndDate))
                    {
                        budgetSchedules.add(budgetSchedule);
                    }
                }
            }
        }
        return budgetSchedules;
    }

    public List<BudgetRunnerResult> runBudgetProcess(final Long userId, final LocalDate startDate, final LocalDate endDate){
        log.info("Starting monthly budget process for user {} between {} and {}", userId, startDate, endDate);

//        // Check if budget exists for this period
//        Budget userBudget = budgetService.loadUserBudgetForPeriod(userId, startDate, endDate);
//
//        // if no budget found, then create a budget for this period
//        if(userBudget == null)
//        {
//
//        }
//
//        // Also create the budget schedule for this period
//        try
//        {
//            Optional<BudgetSchedule> budgetScheduleOptional = getBudgetScheduleParam(userBudget, startDate, endDate);
//            if(budgetScheduleOptional.isEmpty())
//            {
//                return Collections.emptyList();
//            }
//            BudgetSchedule budgetSchedule = budgetScheduleOptional.get();
//            List<BudgetRunnerResult> budgetRunnerResults = new ArrayList<>();
//            BudgetRunnerResult budgetRunnerResult = processBudget(userBudget, budgetSchedule, startDate, endDate);
//            budgetRunnerResults.add(budgetRunnerResult);
//            return budgetRunnerResults;
//
//        }catch(Exception e){
//            log.error("There was an error running budget process for user {} between {} and {}", userId, startDate, endDate);
//            return Collections.emptyList();
//        }
        return null;
    }

    public List<BudgetPeriodCategory> loadDailyPeriodCategories(final Budget budget, final BudgetSchedule budgetSchedule, final LocalDate targetDate)
    {
        return null;
    }

    private Optional<WeeklyBudgetSchedule> buildWeeklyBudgetSchedule(final BudgetSchedule budgetSchedule)
    {
        if (budgetSchedule == null) {
            throw new IllegalArgumentException("BudgetSchedule cannot be null");
        }

        WeeklyBudgetSchedule weeklyBudgetSchedule = new WeeklyBudgetSchedule(
                budgetSchedule.getBudgetScheduleId(),  // ID of the schedule
                budgetSchedule.getSubBudgetId(),          // Associated budget ID
                budgetSchedule.getStartDate(),         // Start date of the schedule
                budgetSchedule.getEndDate(),           // End date of the schedule
                budgetSchedule.getPeriod(),            // Period (should be WEEKLY for this method)
                budgetSchedule.getTotalPeriods(),      // Total periods
                budgetSchedule.getStatus()             // Current status of the schedule
        );

        // Set any additional fields or initialize weekly ranges
        weeklyBudgetSchedule.initializeWeeklyDateRanges();

        return Optional.of(weeklyBudgetSchedule);
    }

    private Optional<BiWeeklyBudgetSchedule> buildBiWeeklyBudgetSchedule(final BudgetSchedule budgetSchedule)
    {
        if (budgetSchedule == null) {
            throw new IllegalArgumentException("BudgetSchedule cannot be null");
        }
        BiWeeklyBudgetSchedule biweeklyBudgetSchedule = new BiWeeklyBudgetSchedule(
                budgetSchedule.getBudgetScheduleId(),
                budgetSchedule.getSubBudgetId(),
                budgetSchedule.getStartDate(),
                budgetSchedule.getEndDate(),
                budgetSchedule.getPeriod(),
                budgetSchedule.getTotalPeriods(),
                budgetSchedule.getStatus()
        );
        biweeklyBudgetSchedule.initializeBiWeeklyBudgetSchedule();
        return Optional.of(biweeklyBudgetSchedule);
    }

    // TODO: Create a method that creates a new budget for a new period
    public List<BudgetPeriodCategory> loadPeriodCategories(final Budget budget, final BudgetSchedule budgetSchedule)
    {
        LocalDate startDate = budgetSchedule.getStartDate();
        LocalDate endDate = budgetSchedule.getEndDate();
        List<BudgetSchedule> budgetSchedules = fetchBudgetSchedulesBySubBudgets(budget, startDate, endDate);
        Period period = budgetSchedule.getPeriod();
        return switch (period) {
            case WEEKLY -> {
                Optional<WeeklyBudgetSchedule> weeklyBudgetScheduleOptional = buildWeeklyBudgetSchedule(budgetSchedule);
                WeeklyBudgetSchedule weeklyBudgetSchedule = weeklyBudgetScheduleOptional.get();
                yield getWeeklyBudgetPeriodCategories(budget, weeklyBudgetSchedule);
            }
            case BIWEEKLY -> {
                Optional<BiWeeklyBudgetSchedule> biweeklyBudgetScheduleOptional = buildBiWeeklyBudgetSchedule(budgetSchedule);
                BiWeeklyBudgetSchedule biweeklyBudgetSchedule = biweeklyBudgetScheduleOptional.get();
                yield getBiWeeklyBudgetPeriodCategories(budget, biweeklyBudgetSchedule);
            }
            case MONTHLY -> getMonthlyBudgetPeriodCategories(budget, budgetSchedule);
            case DAILY, QUARTERLY, ANNUAL, SEMIANNUAL, BIMONTHLY -> Collections.emptyList();
        };
    }

    public BudgetRunnerResult processBudget(Budget budget, BudgetSchedule budgetSchedule, LocalDate startDate, LocalDate endDate) {
//        // Create date range for the month
//        DateRange monthRange = new DateRange(startDate, endDate);
//
//        // Calculate budget health score
//        BigDecimal healthScore = calculateBudgetHealthScore(budget, startDate, endDate);
//
//        // Load monthly statistics
//        BudgetStats monthlyStats = loadMonthlyBudgetStatistics(monthRange, budget, healthScore);
//
//        // Get top expense categories
//        List<Category> topExpenses = loadTopExpenseCategories(budget, startDate, endDate);
//
//        List<Category> expenseCategories = loadExpenseCategory(budget.getId(), startDate, endDate, determineBudgetPeriod(startDate, endDate));
//
//        // Calculate budget period and load period categories
//        Period budgetPeriod = determineBudgetPeriod(startDate, endDate);
//        List<BudgetPeriodCategory> periodCategories = loadPeriodCategories(budget, budgetSchedule);
//
//        // Load special categories
//        List<Category> savingsCategories = loadSavingsCategory(
//                budget.getId(),
//                startDate,
//                endDate,
//                budgetPeriod);
//
//        List<Category> incomeCategories = loadIncomeCategory(
//                budget.getBudgetAmount(),
//                budget.getId(),
//                startDate,
//                endDate);
//
//        BudgetCategoryStats budgetCategoryStats = new BudgetCategoryStats(
//                periodCategories,
//                topExpenses,
//                expenseCategories,
//                savingsCategories,
//                incomeCategories);
//
//        // Build the result
//        return BudgetRunnerResult.builder()
//                .budget(budget)
//                .budgetSchedule(budgetSchedule)
//                .budgetStats(monthlyStats)
//                .budgetCategoryStats(budgetCategoryStats)
//                .build();
        return null;
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

    private BigDecimal getTotalSpentOnBudget(Long budgetId, LocalDate startDate, LocalDate endDate)
    {
        if(budgetId == null || startDate == null || endDate == null)
        {
            return BigDecimal.ZERO;
        }
        try
        {
            return budgetQueriesService.getTotalSpentOnBudget(budgetId, startDate, endDate);

        }catch(Exception e){
            log.error("There was an error fetching the total spent on the budget: ", e);
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal getTotalBudgeted(Long budgetId, Long userId, LocalDate startDate, LocalDate endDate)
    {
        if(budgetId == null || userId == null || startDate == null || endDate == null)
        {
            return BigDecimal.ZERO;
        }
        try
        {
            return budgetQueriesService.getTotalBudgeted(budgetId, userId, startDate, endDate);

        }catch(Exception e){
            log.error("There was an error getting the total budgeted amount: ", e);
            return BigDecimal.ZERO;
        }
    }

    public BigDecimal calculateBudgetHealthScore(Budget budget, LocalDate startDate, LocalDate endDate)
    {
        if(budget == null || startDate == null || endDate == null)
        {
            return BigDecimal.ZERO;
        }
        try
        {
            // Get total budgeted amount
            BigDecimal totalBudgeted = getTotalBudgeted(
                    budget.getId(),
                    budget.getUserId(),
                    startDate,
                    endDate
            );

            // Get total spent amount
            BigDecimal totalSpent = getTotalSpentOnBudget(
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


    public List<BudgetPeriodCategory> getWeeklyBudgetPeriodCategories(final Budget budget, final WeeklyBudgetSchedule weeklyBudgetSchedule)
    {
        if(budget == null || weeklyBudgetSchedule == null){
            return Collections.emptyList();
        }
        List<DateRange> weeklyRanges = weeklyBudgetSchedule.getWeeklyDateRanges();
        if(weeklyRanges == null || weeklyRanges.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            List<BudgetPeriodCategory> budgetPeriodCategories = budgetPeriodQueries.getWeeklyBudgetPeriodCategories(weeklyRanges, budget);
            return new ArrayList<>(budgetPeriodCategories);

        }catch(Exception e)
        {
            log.error("Error getting weekly budget period categories: ", e);
            return Collections.emptyList();
        }
    }

    public List<BudgetPeriodCategory> getBiWeeklyBudgetPeriodCategories(final Budget budget, final BiWeeklyBudgetSchedule biweeklyBudgetSchedule)
    {
        if(biweeklyBudgetSchedule == null || budget == null)
        {
            return Collections.emptyList();
        }
        try
        {
            List<DateRange> biweeklyDateRanges = biweeklyBudgetSchedule.getBiweeklyDateRanges();
            if(biweeklyDateRanges == null || biweeklyDateRanges.isEmpty())
            {
                return Collections.emptyList();
            }
            List<BudgetPeriodCategory> budgetPeriodCategories = budgetPeriodQueries.getBiWeeklyBudgetPeriodCategories(biweeklyDateRanges, budget);
            return new ArrayList<>(budgetPeriodCategories);

        }catch(Exception e)
        {
            log.error("There was an error getting Bi-weekly budget period categories: ", e);
            return Collections.emptyList();
        }
    }

    public List<BudgetPeriodCategory> getDailyBudgetPeriodCategories(final Budget budget, final LocalDate date)
    {
        if(date == null || budget == null)
        {
            return Collections.emptyList();
        }
        try
        {
            List<BudgetPeriodCategory> dailyBudgetPeriodQuery = budgetPeriodQueries.getDailyBudgetPeriodQuery(date, budget);
            return new ArrayList<>(dailyBudgetPeriodQuery);

        }catch(Exception e)
        {
            log.error("There was an error getting Daily-budget period categories: ", e);
            return Collections.emptyList();
        }
    }

    public List<BudgetPeriodCategory> getMonthlyBudgetPeriodCategories(final Budget monthlyBudget, final BudgetSchedule budgetSchedule)
    {
        if(budgetSchedule == null || monthlyBudget == null)
        {
            return Collections.emptyList();
        }
        try
        {
            DateRange monthRange = budgetSchedule.getScheduleRange();
            List<BudgetPeriodCategory> monthlyBudgetPeriodCategories = budgetPeriodQueries.getMonthlyBudgetPeriodCategories(monthRange, monthlyBudget);
            return new ArrayList<>(monthlyBudgetPeriodCategories);

        }catch(Exception e)
        {
            log.error("There was an error getting Monthly budget period categories: ", e);
            return Collections.emptyList();
        }
    }

    public BudgetStats loadMonthlyBudgetStatistics(final DateRange monthRange, final Budget budget, final BigDecimal budgetHealthScore)
    {
        try
        {
            // 1. Get total budgeted for the month
            BigDecimal totalBudgeted = getTotalBudgeted(
                    budget.getId(),
                    budget.getUserId(),
                    monthRange.getStartDate(),
                    monthRange.getEndDate()
            );
            log.info("Total Budgeted: {}", totalBudgeted);

            // 2. Get total spent in the month
            BigDecimal totalSpent = getTotalSpentOnBudget(
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
                    budgetHealthScore,
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

    public List<Category> loadTopExpenseCategories(final Budget budget, final LocalDate startDate, final LocalDate endDate)
    {
        if(budget == null || startDate == null || endDate == null)
        {
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
