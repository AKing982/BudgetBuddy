package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.entities.ControlledSpendingCategoryEntity;
import com.app.budgetbuddy.entities.TransactionCategoryEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.exceptions.InvalidBudgetActualAmountException;
import com.app.budgetbuddy.exceptions.InvalidBudgetAmountException;
import com.app.budgetbuddy.services.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@Component
@Slf4j
public class BudgetCalculations {
    private final BudgetService budgetService;
    private final BudgetGoalsService budgetGoalsService;
    private final ControlledSpendingCategoriesService budgetCategoriesService;

    private final BudgetValidator budgetValidator;

    @Autowired
    public BudgetCalculations(BudgetService budgetService,
                            BudgetGoalsService budgetGoalsService,
                            ControlledSpendingCategoriesService budgetCategoriesService,
                            BudgetValidator budgetValidator) {
        this.budgetService = budgetService;
        this.budgetGoalsService = budgetGoalsService;
        this.budgetCategoriesService = budgetCategoriesService;
        this.budgetValidator = budgetValidator;
    }

    private BudgetGoalsEntity getBudgetGoals(Long budgetId)
    {
        Optional<BudgetGoalsEntity> budgetGoals = budgetGoalsService.findByBudgetId(budgetId);
        return budgetGoals.orElseThrow();
    }

    private BigDecimal getTotalUserBudgetCategoryExpenses(final Set<TransactionCategoryEntity> categories)
    {
        BigDecimal totalExpenses = BigDecimal.ZERO;
        for(TransactionCategoryEntity category : categories)
        {
            double categorySpending = category.getActual();
            totalExpenses = totalExpenses.add(BigDecimal.valueOf(categorySpending));
        }
        return totalExpenses;
    }

    public BigDecimal calculateSavingsGoalProgress(final Budget budget, final Set<TransactionCategoryEntity> spendingCategories)
    {
        if(budget == null || spendingCategories.isEmpty())
        {
            return BigDecimal.ZERO;
        }
        // 1. Retrieve the savings goal amount from the database using the Budget Goals Service
        BudgetGoalsEntity budgetGoals = getBudgetGoals(budget.getId());
        double savingsTarget = budgetGoals.getTargetAmount();

        // 2. Get the total spending on all categories
        BigDecimal totalCategoryExpenses = getTotalUserBudgetCategoryExpenses(spendingCategories);

        // 3. How much is leftOver in the budget and all the categories?
        BigDecimal budgetAmount = budget.getBudgetAmount();
        BigDecimal budgetLeftOver = budget.getBudgetAmount().subtract(budget.getActual());
        System.out.println("Budget Leftover: " + budgetLeftOver);
        if(totalCategoryExpenses.compareTo(budgetAmount) < 0)
        {
            if(budgetLeftOver.compareTo(BigDecimal.ZERO) > 0)
            {
                BigDecimal totalOverallSavings = budgetAmount.subtract(totalCategoryExpenses);
                return totalOverallSavings.divide(BigDecimal.valueOf(savingsTarget), 2, RoundingMode.CEILING).multiply(new BigDecimal("100"));
            }
        }
        return BigDecimal.ZERO;
    }

    public BigDecimal getTotalSpendingOnAllCategories(List<CategoryPeriodSpending> categorySpendingList) {
        return categorySpendingList.stream()
                .map(CategoryPeriodSpending::getActualSpending)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal calculateTotalBudgetHealth(final BigDecimal budgetAmount, final BigDecimal budgetActual, BigDecimal savingsGoalProgress)
    {
        if(budgetAmount == null || budgetActual == null || savingsGoalProgress == null)
        {
            return BigDecimal.ZERO;
        }

        if(budgetAmount.compareTo(BigDecimal.ZERO) < 0)
        {
            throw new InvalidBudgetAmountException("Invalid Budget Amount: " + budgetAmount + "Unable to calculate Total Budget Health");
        }

        if(budgetActual.compareTo(BigDecimal.ZERO) < 0)
        {
            throw new InvalidBudgetActualAmountException("Invalid Budget Actual Amount: " + budgetActual + "Unable to calculate Total Budget Health");
        }

        // 1. Is the remaining budget amount positive
        BigDecimal remainingBudgetAmount = budgetAmount.subtract(budgetActual);

        BigDecimal budgetUtilizationScore = BigDecimal.ZERO;
        if(remainingBudgetAmount.compareTo(BigDecimal.ZERO) > 0)
        {
            budgetUtilizationScore = remainingBudgetAmount.divide(budgetAmount, 2, RoundingMode.CEILING);
        }

        // 2. Is the SavingsGoalProgress between 1 and 100?
        if(savingsGoalProgress.compareTo(BigDecimal.ZERO) < 0 || savingsGoalProgress.compareTo(new BigDecimal("100.00")) > 0){
            throw new IllegalArgumentException("Savings Goals Progress should be between 0 and 100");
        }

        return budgetUtilizationScore.multiply(BigDecimal.valueOf(0.5))
                .add(savingsGoalProgress.multiply(BigDecimal.valueOf(0.5)));
    }

    public BudgetStats calculateBudgetStats(final Long userId, final BigDecimal leftOver, final BigDecimal totalSpent, final BigDecimal totalBudgeted, final BigDecimal totalRemaining) {
        return null;
    }

    private LocalDate getStartDateFromBudgetPeriod(final BudgetPeriod budgetPeriod)
    {
        return budgetPeriod.getStartDate();
    }

    private LocalDate getEndDateFromBudgetPeriod(final BudgetPeriod budgetPeriod)
    {
        return budgetPeriod.getEndDate();
    }

    private Period getPeriodFromBudgetPeriod(final BudgetPeriod budgetPeriod)
    {
        return budgetPeriod.getPeriod();
    }

    private void validateStartDateAndEndDate(final LocalDate startDate, final LocalDate endDate)
    {
        if(startDate == null || endDate == null)
        {
            throw new IllegalDateException("Start date and end date cannot be null");
        }
    }

    private BigDecimal getTotalSpendingForAllUserBudgetCategories(final List<TransactionCategoryEntity> userBudgetCategories)
    {

        BigDecimal totalSpending = BigDecimal.ZERO;
        for(TransactionCategoryEntity userBudgetCategory : userBudgetCategories)
        {
            Double actualSpending = userBudgetCategory.getActual();
            totalSpending = totalSpending.add(new BigDecimal(actualSpending));
        }
        return totalSpending;
    }

    public Map<String, BigDecimal> createCategoryToBudgetMap(final List<CategoryPeriodSpending> categorySpendingList, final Budget budget, final BigDecimal totalSpendingOnCategories, final BudgetPeriod budgetPeriod)
    {
        Map<String, BigDecimal> budgetMap = new HashMap<>();
        if(budgetPeriod == null || categorySpendingList.isEmpty() || (totalSpendingOnCategories.compareTo(BigDecimal.ZERO) == 0 ||
                totalSpendingOnCategories.compareTo(BigDecimal.ZERO) < 1) || budget == null)
        {
            return budgetMap;
        }
        for(CategoryPeriodSpending categorySpending : categorySpendingList)
        {
            if(categorySpending == null)
            {
                continue;
            }
            String categoryName = categorySpending.getCategoryName();
            BigDecimal actualSpendingOnCategory = categorySpending.getActualSpending();
            if(categoryName == null || actualSpendingOnCategory == null) {continue;}
            BigDecimal categoryBudgetAmount = calculateCategoryBudgetAmountForPeriod(categoryName, actualSpendingOnCategory, totalSpendingOnCategories, budget, budgetPeriod);
            budgetMap.put(categoryName, categoryBudgetAmount);
        }
        return budgetMap;
    }

    public BigDecimal calculateAverageSpendingPerDayOnBudget(final BigDecimal budgetedAmount, final BigDecimal budgetActual, final BudgetPeriod budgetPeriod)
    {
       if(budgetedAmount == null || budgetActual == null || budgetPeriod == null)
       {
           return BigDecimal.ZERO;
       }
       try
       {
           LocalDate startDate = getStartDateFromBudgetPeriod(budgetPeriod);
           LocalDate endDate = getEndDateFromBudgetPeriod(budgetPeriod);
           if(startDate == null || endDate == null)
           {
               throw new IllegalDateException("Start date or End date cannot be null");
           }
           DateRange dateRange = new DateRange(startDate, endDate);
           long numberOfDaysBetween = dateRange.getDaysInRange();
           System.out.println("Number of Days Between: " + numberOfDaysBetween);

           return budgetActual.divide(BigDecimal.valueOf(numberOfDaysBetween), 2, RoundingMode.HALF_UP);

       }catch(IllegalDateException e)
       {
            log.error("There was an error with the budget period dates: ", e);
            throw e;
       }catch(ArithmeticException e){
           log.error("There was an arithmetic error calculating the average spending: ", e);
           throw e;
       }
    }

    private boolean isValidNumeric(String value){
        try
        {
            new BigDecimal(value);
            return true;
        }catch(NumberFormatException e){
            return false;
        }
    }

    public BigDecimal calculateTotalFixedRecurringExpenses(final Budget budget, final DateRange dateRange, final List<RecurringTransaction> recurringTransactions)
    {
        if(budget == null || dateRange == null || recurringTransactions == null)
        {
            return BigDecimal.ZERO;
        }
        BigDecimal totalFixedRecurringExpenses = BigDecimal.ZERO;
        try
        {
            Long budgetId = budget.getId();
            if(budgetId == null || budgetId < 1L){
                throw new IllegalArgumentException("Budget id cannot be null");
            }
            LocalDate startDate = dateRange.getStartDate();
            LocalDate endDate = dateRange.getEndDate();
            if(startDate == null || endDate == null){
                throw new IllegalDateException("Start date or End date cannot be null");
            }
            if(recurringTransactions.isEmpty())
            {
                return BigDecimal.ZERO;
            }
            else
            {
                for(RecurringTransaction recurringTransaction : recurringTransactions)
                {
                    if(recurringTransaction == null)
                    {
                        log.warn("Skipping null Recurring Transaction...");
                        continue;
                    }
                    boolean isRecurringActive = recurringTransaction.getActive();
                    // is the recurring transaction active and does it fall in the date range specified above
                    boolean isWithinDateRange = !recurringTransaction.getLastDate().isBefore(startDate)
                                    && !recurringTransaction.getFirstDate().isAfter(endDate);
                    if(isRecurringActive && isWithinDateRange)
                    {
                        totalFixedRecurringExpenses = totalFixedRecurringExpenses.add(recurringTransaction.getAmount());
                    }
                }
            }
            return totalFixedRecurringExpenses;

        }catch(IllegalDateException e){
            log.error("There was an error with the budget date ranges: ", e);
            throw e;
        }catch(IllegalArgumentException ex){
            log.error("There was an error with the calculation parameters: ", ex);
            throw ex;
        }
    }

    public List<BudgetPeriodAmount> calculateBudgetedAmountForCategoryDateRange(final CategoryPeriodSpending categorySpendingData, final BigDecimal totalSpendingOnCategories, final List<DateRange> categoryDateRanges, final Budget budget, final BudgetSchedule budgetSchedule)
    {
        if(categorySpendingData == null || categoryDateRanges == null || budget == null)
        {
            return Collections.emptyList();
        }
        List<BudgetPeriodAmount> budgetPeriodAmounts = new ArrayList<>();
        BigDecimal totalBudgetAmount = budget.getBudgetAmount();

        // Calculate category's portion based on spending ratio
        BigDecimal categorySpendingRatio = categorySpendingData.getActualSpending()
                .divide(totalSpendingOnCategories, 2, RoundingMode.HALF_UP);
        BigDecimal categoryTotalBudget = totalBudgetAmount.multiply(categorySpendingRatio);

        // Calculate per period amount based on days in period
        DateRange budgetDateRange = new DateRange(budgetSchedule.getStartDate(), budgetSchedule.getEndDate());
        long totalDays = budgetDateRange.getDaysInRange();

        for(DateRange dateRange : categoryDateRanges) {
            int periodDays = (int) dateRange.getDaysInRange();
            BigDecimal periodRatio = BigDecimal.valueOf(periodDays)
                    .divide(BigDecimal.valueOf(totalDays), 2, RoundingMode.HALF_UP);
            BigDecimal periodAmount = categoryTotalBudget.multiply(periodRatio).divide(new BigDecimal("2"), 2, RoundingMode.CEILING);
            log.info("Budget Period Amount: " + periodAmount);
            budgetPeriodAmounts.add(new BudgetPeriodAmount(dateRange, periodAmount.doubleValue()));
        }

        return budgetPeriodAmounts;
    }

    public List<BudgetPeriodAmount> calculateActualAmountForCategoryDateRange(final CategoryPeriodSpending categorySpending, final CategoryTransactions categoryDesignator, final List<DateRange> categoryDateRanges, final Budget budget)
    {
        if(categorySpending == null || categoryDateRanges == null || budget == null)
        {
            return Collections.emptyList();
        }
        List<BudgetPeriodAmount> budgetPeriodAmounts = new ArrayList<>();
        BigDecimal totalCategorySpending = categorySpending.getActualSpending();
        DateRange categoryMonthRange = categorySpending.getDateRange();
        List<Transaction> transactions = categoryDesignator.getTransactions();
        for(DateRange categoryDateRange : categoryDateRanges)
        {
            BigDecimal totalSpendingForRange = getTotalTransactionSpendingForCategoryDateRange(transactions, categoryDateRange, categoryDesignator);
            budgetPeriodAmounts.add(new BudgetPeriodAmount(categoryDateRange, totalSpendingForRange.doubleValue()));
        }
        return budgetPeriodAmounts;
    }

    private BigDecimal getTotalTransactionSpendingForCategoryDateRange(final List<Transaction> transactions, final DateRange categoryDateRange, final CategoryTransactions categoryDesignator)
    {
        return transactions.stream()
                .filter(transaction -> transaction.getDate() != null &&
                        transaction.getDate().isAfter(categoryDateRange.getStartDate().minusDays(1)) &&
                        transaction.getDate().isBefore(categoryDateRange.getEndDate().plusDays(1)) &&
                        categoryDesignator.getCategoryId().equals(transaction.getCategoryId()))
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BudgetGoalsEntity getBudgetGoalsByBudgetId(Long budgetId){
        Optional<BudgetGoalsEntity> budgetGoalsEntityOptional = budgetGoalsService.findById(budgetId);
        return budgetGoalsEntityOptional.orElseThrow();
    }

    public BigDecimal calculateTotalSavedInBudget(final Budget budget, final BigDecimal totalSpentOnBudget, final DateRange monthRange)
    {
        if(budget == null)
        {
            return BigDecimal.ZERO;
        }
        Long budgetId = budget.getId();
        if(budgetId == null || budgetId < 1L){
            throw new IllegalArgumentException("Budget id cannot be null");
        }

        if(monthRange == null)
        {
            return BigDecimal.ZERO;
        }

        BigDecimal budgetAmount = budget.getBudgetAmount();
        BudgetGoalsEntity bgEntity = getBudgetGoalsByBudgetId(budgetId);
        double savingsTargetAmount = bgEntity.getTargetAmount();
        double monthlyAllocation = bgEntity.getMonthlyAllocation();
        if(monthlyAllocation == 0)
        {
            int monthsToTarget = calculateMonthsToTarget(monthRange.getStartDate());
            if (monthsToTarget > 0) {
                monthlyAllocation = savingsTargetAmount / monthsToTarget;
            }
        }

        if(budgetAmount.compareTo(totalSpentOnBudget) > 0)
        {
            BigDecimal actualSavings = budgetAmount.subtract(totalSpentOnBudget);
            BigDecimal monthlyAllocationBD = BigDecimal.valueOf(monthlyAllocation);

            return actualSavings.min(monthlyAllocationBD);
        }
        return BigDecimal.ZERO;
    }

    private int calculateMonthsToTarget(LocalDate startDate) {
        LocalDate endOfYear = startDate.with(TemporalAdjusters.lastDayOfYear());
        return (int) ChronoUnit.MONTHS.between(startDate, endOfYear) + 1;
    }

    public BigDecimal calculateTotalSpendingOnBudget(final DateRange budgetDateRange, final List<TransactionCategory> transactionCategories, final Budget budget){
        if(budgetDateRange == null)
        {
            return BigDecimal.ZERO;
        }
        try
        {
            Long budgetId = budget.getId();
            if(budgetId < 1L){
                throw new IllegalArgumentException("Budget id must be greater than 1");
            }
            LocalDate startDate = budgetDateRange.getStartDate();
            LocalDate endDate = budgetDateRange.getEndDate();
            if(startDate == null || endDate == null){
                throw new IllegalDateException("Start date or endDate cannot be null");
            }
            Optional<BudgetEntity> budgetEntityOptional = budgetService.findById(budgetId);
            if(budgetEntityOptional.isEmpty()){
                throw new RuntimeException("Budget with Budget Id: " + budgetId + " not found.");
            }
            BigDecimal totalBudgetedAmount = budget.getBudgetAmount();
            if(transactionCategories.isEmpty()){
                throw new RuntimeException("Transaction category entities not found for Budget Id: " + budgetId);
            }
            BigDecimal totalSpending = BigDecimal.ZERO;
            for(TransactionCategory transactionCategory : transactionCategories)
            {
                if(transactionCategory != null)
                {
                    BigDecimal transactionCategorySpending = BigDecimal.valueOf(transactionCategory.getBudgetActual());
                    totalSpending = totalSpending.add(transactionCategorySpending);
                    if(totalSpending.compareTo(totalBudgetedAmount) > 0)
                    {
                        BigDecimal overSpending = totalSpending.subtract(totalBudgetedAmount);
                        log.warn("Overspending detected: {} over the budgeted amount.", overSpending);
                        transactionCategory.setOverSpent(true);
                        transactionCategory.setOverSpendingAmount(Double.valueOf(overSpending.toString()));
                    }
                    log.info("Total Spending: " + totalSpending);
                    if(totalSpending.compareTo(BigDecimal.ZERO) < 0)
                    {
                        throw new ArithmeticException("There was an calculation error when calculating the total spending");
                    }
                }
            }
            return totalSpending;

        }catch(IllegalDateException e){
            log.error("There was an error with the budget period dates: ", e);
            throw e;
        }catch(IllegalArgumentException ex){
            log.error("There was an error with the calculation parameters: ", ex);
            throw ex;
        }catch(ArithmeticException ex1){
            log.error("There was an error calculating the total spending: ", ex1);
            throw ex1;
        }
    }

    private long getNumberOfDaysInBudget(LocalDate budgetStartDate, LocalDate budgetEndDate){
        DateRange dateRange = new DateRange(budgetStartDate, budgetEndDate);
        return dateRange.getDaysInRange() + 1;
    }

    private long getNumberOfDaysRemainingInBudget(LocalDate budgetStartDate, LocalDate budgetEndDate, LocalDate periodStart, LocalDate periodEnd){
        // If period end date is after budget end date, use budget end date
        LocalDate effectiveEndDate = periodEnd.isAfter(budgetEndDate) ? budgetEndDate : periodEnd;

        // If period start is before budget start, use budget start
        LocalDate effectiveStartDate = periodStart.isBefore(budgetStartDate) ? budgetStartDate : periodStart;

        // Calculate days between effective dates
        return ChronoUnit.DAYS.between(effectiveStartDate, budgetEndDate) + 1;
    }

    public BigDecimal calculateTotalBudgetAmount(final DateRange budgetDateRange, final Budget budget, final BudgetSchedule budgetSchedule, final BigDecimal totalRecurringExpenses, final BigDecimal totalSpentOnBudget)
    {
        log.info("Calculating Total Budget for DateRange: " + budgetDateRange.toString() + " And Budget: " + budget.toString() + " With Total Recurring Expenses: " + totalRecurringExpenses);
        if(budgetDateRange == null)
        {
            return BigDecimal.ZERO;
        }
        try
        {
            Long budgetId = budget.getId();
            if(budgetId < 1L)
            {
                throw new IllegalArgumentException("Budget id must be greater than 1");
            }
            LocalDate startDate = budgetDateRange.getStartDate();
            LocalDate endDate = budgetDateRange.getEndDate();
            if(startDate == null || endDate == null) {
                throw new IllegalDateException("Start date or endDate cannot be null");
            }
            long daysBetweenRange = budgetDateRange.getDaysInRange();
            log.info("Days between range: " + daysBetweenRange);
            if(daysBetweenRange < 0){
                throw new RuntimeException("Days between start and end date is invalid");
            }
            LocalDate budgetStartDate = budgetSchedule.getStartDate();
            LocalDate budgetEndDate = budgetSchedule.getEndDate();
            long numberOfDaysInBudget = getNumberOfDaysInBudget(budgetStartDate, budgetEndDate);
            log.info("Number of Days in Budget: " + numberOfDaysInBudget);
            BigDecimal monthlyBudgetAmount = budget.getBudgetAmount();
            BigDecimal dailyBudgetAmount = monthlyBudgetAmount.divide(new BigDecimal(numberOfDaysInBudget), 2, BigDecimal.ROUND_HALF_UP);
            BigDecimal totalBudgetForPeriod = dailyBudgetAmount.multiply(BigDecimal.valueOf(daysBetweenRange));
            log.info("Total BudgetFor Period: " + totalBudgetForPeriod);
            Long userId = budget.getUserId();
            if(totalRecurringExpenses != null && totalRecurringExpenses.compareTo(BigDecimal.ZERO) > 0)
            {
                // If only fixed expenses and no non fixed expenses
                // Simply add the fixed expenses to the base budgeted amount
                if(totalSpentOnBudget.compareTo(BigDecimal.ZERO) == 0)
                {
                    totalBudgetForPeriod = totalBudgetForPeriod.add(totalRecurringExpenses);
                    return totalBudgetForPeriod;
                }
                else
                {
                    // Adjust non-fixed expenses based on spent amount
                    log.info("Total spent on budget: " + totalSpentOnBudget);
                    BigDecimal remainingBudget = monthlyBudgetAmount.subtract(totalSpentOnBudget);
                    log.info("RemainingBudget: " + remainingBudget);
                    long daysLeft = getNumberOfDaysRemainingInBudget(budgetStartDate, budgetEndDate, startDate, endDate);
                    log.info("Days Left: " + daysLeft);
                    BigDecimal dailyAmount = remainingBudget.divide(BigDecimal.valueOf(daysLeft), 2, BigDecimal.ROUND_HALF_UP);
                    log.info("Days between range: " + daysBetweenRange);
                    BigDecimal baseBudgetForPeriod = dailyAmount.multiply(BigDecimal.valueOf(daysBetweenRange));
                    totalBudgetForPeriod = baseBudgetForPeriod.add(totalRecurringExpenses);
                }
            }
            log.info("Total Budget for Period: " + totalBudgetForPeriod);
            return totalBudgetForPeriod;

        }catch(IllegalDateException e){
            log.error("There was an error with the budget period dates: ", e);
            throw e;
        }catch(IllegalArgumentException ex){
            log.error("There was an error with the calculation parameters: ", ex);
            throw ex;
        }
    }

    private BigDecimal getCategoryBudget(final BigDecimal categoryProportion, final BigDecimal budgetAmount)
    {
        return categoryProportion.multiply(budgetAmount).setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal calculateCategoryBudgetAmountForPeriod(final String categoryName, final BigDecimal categorySpending, final BigDecimal totalSpendingOnCategories, final Budget budget, final BudgetPeriod budgetPeriod)
    {
        if(categorySpending == null || totalSpendingOnCategories == null || budget == null || budgetPeriod == null)
        {
            return BigDecimal.ZERO;
        }
        Period period = getPeriodFromBudgetPeriod(budgetPeriod);
        LocalDate startDate = getStartDateFromBudgetPeriod(budgetPeriod);
        LocalDate endDate = getEndDateFromBudgetPeriod(budgetPeriod);
        validateStartDateAndEndDate(startDate, endDate);
        DateRange dateRange = createDateRange(startDate, endDate);

        BigDecimal budgetAmount = budget.getBudgetAmount();
        BigDecimal categoryProportion = getCategoryBudgetAmountProportion(categorySpending, budgetAmount, totalSpendingOnCategories);
        switch(period)
        {
            case MONTHLY -> {
                boolean isStartDateWithinMonth = dateRange.isWithinMonth(startDate);
                boolean isEndDateWithinMonth = dateRange.isWithinMonth(endDate);
                if(isStartDateWithinMonth && isEndDateWithinMonth)
                {
                    return getCategoryBudget(categoryProportion, budgetAmount);
                }
                else
                {
                    boolean isWithinMonth = dateRange.isWithinMonth(startDate, endDate);
                    if(isWithinMonth)
                    {
                        return getCategoryBudget(categoryProportion, budgetAmount);
                    }
                }
            }
            case WEEKLY -> {
                // Get the Weekly budget amount
                BigDecimal weeklyBudgetAmount = calculateBudgetedAmountByPeriod(budgetPeriod, budget);
                return getCategoryBudget(categoryProportion, weeklyBudgetAmount);
            }
            case BIWEEKLY -> {
                BigDecimal biWeeklyBudgetAmount = calculateBudgetedAmountByPeriod(budgetPeriod, budget);
                return getCategoryBudget(categoryProportion, biWeeklyBudgetAmount);
            }
        }
        return BigDecimal.ZERO;
    }


    private void validateBudgetPeriodAndBudget(BudgetPeriod budgetPeriod, Budget budget)
    {
        if(budgetPeriod == null || budget == null){
            throw new RuntimeException("BudgetPeriod or Budget is null");
        }
    }

    public BigDecimal calculateNewBudgetedAmountFromRemainingAmount(Category category, Period period, LocalDate startDate, LocalDate endDate, BigDecimal remainingAmount)
    {
        return null;
    }

    //TODO: Test method implementation
    public Double calculateAllocatedAmount(final BigDecimal budgetAmount, final double targetAmount, double currentMonthlyAllocation, double currentSpending, double spendingLimit, double totalSavings)
    {
        if (budgetAmount == null || budgetAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Budget amount must be greater than zero.");
        }

        if (spendingLimit <= 0) {
            return 0.0; // No allocation if spending limit is zero or negative
        }

        // Calculate the base allocation proportionally
        double budgetAmountDouble = budgetAmount.doubleValue();
        double proportionateAllocation = (currentSpending / targetAmount) * budgetAmountDouble;

        // Adjust allocation based on current monthly allocation and total savings
        double savingsAdjustmentFactor = totalSavings > 0 ? 0.9 : 1.0; // Reduce allocation by 10% if savings exist
        double adjustedAllocation = proportionateAllocation * savingsAdjustmentFactor;

        // Cap the allocation at the spending limit
        double finalAllocation = Math.min(adjustedAllocation, spendingLimit);

        // Ensure the allocation does not exceed the remaining budget
        double remainingBudget = budgetAmountDouble - currentMonthlyAllocation;
        finalAllocation = Math.min(finalAllocation, remainingBudget);

        return finalAllocation;
    }

    public BigDecimal calculateBudgetedAmountByPeriod(final BudgetPeriod budgetPeriod, final Budget budget)
    {
        validateBudgetPeriodAndBudget(budgetPeriod, budget);
        Period period = getPeriodFromBudgetPeriod(budgetPeriod);
        LocalDate startDate = getStartDateFromBudgetPeriod(budgetPeriod);
        LocalDate endDate = getEndDateFromBudgetPeriod(budgetPeriod);
        DateRange dateRange = createDateRange(startDate, endDate);
        BigDecimal budgetedAmount = budget.getBudgetAmount();
        switch(period)
        {
            case WEEKLY -> {

                boolean isWithinWeek = dateRange.isWithinWeek(startDate, endDate);
                System.out.println("IsWithinWeek: " + isWithinWeek);
                if(isWithinWeek)
                {
                    BigDecimal weekyConstant = new BigDecimal("4.33");
                    return budgetedAmount.divide(weekyConstant, RoundingMode.CEILING);
                }

                // Get the number of weeks in the current month
                long numberOfWeeksInPeriod = dateRange.getWeeksInRange();

                System.out.println("Number of Weeks: "+ numberOfWeeksInPeriod);
                BigDecimal numberOfWeeks = BigDecimal.valueOf(numberOfWeeksInPeriod).setScale(1, RoundingMode.CEILING);
                return budgetedAmount.divide(numberOfWeeks, RoundingMode.CEILING);
            }
            case BIWEEKLY -> {

                    long numberOfBiWeeksInPeriod = dateRange.getBiWeeksInRange();
                    System.out.println("Number of Weeks: "+ numberOfBiWeeksInPeriod);
                    return budgetedAmount.divide(BigDecimal.valueOf(2.17), RoundingMode.CEILING);
            }
            case DAILY -> {
                long numberOfDaysInPeriod = dateRange.getDaysInRange();
                if(startDate.equals(endDate))
                {
                    return budgetedAmount.divide(BigDecimal.valueOf(30.4), RoundingMode.CEILING);
                }
                return budgetedAmount.divide(new BigDecimal(numberOfDaysInPeriod), RoundingMode.CEILING);
            }
            case MONTHLY -> {
                long numberOfDaysInPeriod = dateRange.getDaysInRange();
                if(numberOfDaysInPeriod <= 31)
                {
                    return budgetedAmount;
                }
            }
        }
        return BigDecimal.ZERO;
    }

    private DateRange createDateRange(LocalDate startDate, LocalDate endDate)
    {
        return new DateRange(startDate, endDate);
    }

    private BigDecimal getDefaultPercentageForCategory(final Category category, final Budget budget, final BigDecimal savingsTargetAmount) {
        switch (category.getCategoryType()) {
            case AUTO -> {
                return new BigDecimal("0.10");
            }
            case MEDICAL -> {
                return new BigDecimal("0.02");
            }
            case GROCERIES -> {
                return new BigDecimal("0.15");
            }
            case PAYMENT -> {
                return new BigDecimal("0.05");
            }
            case SUBSCRIPTIONS -> {
                return new BigDecimal("0.03");
            }
            case UTILITIES -> {
                return new BigDecimal("0.04");
            }
            case RENT -> {
                BigDecimal rentAmount = category.getBudgetedAmount();
                if(rentAmount != null && rentAmount.compareTo(savingsTargetAmount) > 0)
                {
                    // Calculate percentage of total budget that rent amount represents
                    return rentAmount.divide(budget.getBudgetAmount(), 2, BigDecimal.ROUND_HALF_UP);
                }

                // If no rent amount is defined, fall back to a dynamic percentage
                BigDecimal remainingBudget = budget.getBudgetAmount().subtract(savingsTargetAmount);
                if(remainingBudget.compareTo(budget.getBudgetAmount()) > 0)
                {
                    return remainingBudget.multiply(new BigDecimal("0.30")).divide(budget.getBudgetAmount(), RoundingMode.HALF_UP);
                }
                return new BigDecimal("0.30");
            }
        }
        return new BigDecimal("0.01");
    }



    private BigDecimal getBudgetControlAmount(final Category category, final List<ControlledSpendingCategoryEntity> budgetCategories) {
        for (ControlledSpendingCategoryEntity budgetCategoriesEntity : budgetCategories) {
            if (budgetCategoriesEntity.getCategoryName().equalsIgnoreCase(category.getCategoryName())) {
                return BigDecimal.valueOf(budgetCategoriesEntity.getAllocatedAmount());
            }
        }
        return category.getActual();
    }

//    public BigDecimal getTotalSavedInUserBudgetCategoriesByPeriod(final BudgetPeriod budgetPeriod, final Budget budget)
//    {
//        if(budgetPeriod == null || budget == null)
//        {
//            throw new RuntimeException("BudgetPeriod and budget cannot be null");
//        }
//
//        List<TransactionCategoryEntity> userBudgetCategories = getUserBudgetCategoriesByUserAndDates(budget.getUserId(), budgetPeriod.startDate(), budgetPeriod.endDate());
//        BigDecimal totalSavedAmount = BigDecimal.ZERO;
//        for(TransactionCategoryEntity userBudgetCategoryEntity : userBudgetCategories)
//        {
//            Double categorySpending = userBudgetCategoryEntity.getActual();
//            Double categoryBudgetedAmount = userBudgetCategoryEntity.getBudgetedAmount();
//            BigDecimal savedInCategory = getTotalSavedInCategory(categorySpending, categoryBudgetedAmount);
//            totalSavedAmount = totalSavedAmount.add(savedInCategory).setScale(2, RoundingMode.HALF_UP);
//        }
//        return totalSavedAmount;
//    }

    private BigDecimal getTotalSavedInCategory(final Double categorySpending, final Double categoryBudgeted)
    {
        if(categoryBudgeted == null || categorySpending == null)
        {
            return BigDecimal.ZERO;
        }
        BigDecimal categorySpendingAmount = BigDecimal.valueOf(categorySpending);
        BigDecimal categoryBudgetedAmount = BigDecimal.valueOf(categoryBudgeted);
        return categoryBudgetedAmount.subtract(categorySpendingAmount);
    }

    public BigDecimal getTotalSavedInCategories(final Set<Category> categories)
    {
        if(categories.isEmpty())
        {
            return BigDecimal.ZERO;
        }
        BigDecimal totalSavedAmount = BigDecimal.ZERO;
        for(Category category : categories)
        {
            if(category != null)
            {
                BigDecimal totalCategorySpending = category.getActual();
                BigDecimal totalBudgetedForCategory = category.getBudgetedAmount();
                if(totalCategorySpending != null && totalBudgetedForCategory != null)
                {
                    BigDecimal savedAmount = totalBudgetedForCategory.subtract(totalCategorySpending);
                    totalSavedAmount = totalSavedAmount.add(savedAmount);
                }
            }
        }
        return totalSavedAmount;
    }

    public BigDecimal getCategoryBudgetAmountProportion(final BigDecimal totalCategorySpending, final BigDecimal totalBudgetAmount, final BigDecimal totalSpendingOnCategories)
    {
        if(totalCategorySpending == null || totalBudgetAmount == null || totalSpendingOnCategories == null)
        {
            throw new IllegalArgumentException("Invalid totalCategorySpending or TotalBudgetAmount or Total Spending on Categories cannot be null");
        }
        if(totalSpendingOnCategories.compareTo(BigDecimal.ZERO) == 0)
        {
            return BigDecimal.ZERO;
        }
        System.out.println("Category spending: " + totalCategorySpending);
        System.out.println("Total Spending on Categories: " + totalSpendingOnCategories);
        BigDecimal categoryBudgetAmountProportion = totalCategorySpending.divide(totalSpendingOnCategories, 4, RoundingMode.HALF_UP);
        System.out.println("Category Proportion: " + categoryBudgetAmountProportion);
        return categoryBudgetAmountProportion;
    }


    private List<ControlledSpendingCategoryEntity> getBudgetCategoriesByBudgetId(Long budgetId){
        return budgetCategoriesService.findByBudgetId(budgetId);
    }

    private BudgetEntity getBudgetEntityById(Long budgetId){
        Optional<BudgetEntity> budgetEntity = budgetService.findById(budgetId);
        return budgetEntity.orElseThrow(() -> new IllegalArgumentException("Budget id " + budgetId + " not found"));
    }


    public BigDecimal calculateRemainingAmount(BigDecimal actualSpent, BigDecimal budgetedAmount)
    {
        return budgetedAmount.subtract(actualSpent);
    }

    public BigDecimal calculateRemainingBudgetAmountForCategory(final Category category, final Budget budget){
        return null;
    }
}
