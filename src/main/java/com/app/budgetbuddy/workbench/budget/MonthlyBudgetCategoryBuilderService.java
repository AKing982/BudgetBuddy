package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DateRangeException;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.services.SubBudgetGoalsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class MonthlyBudgetCategoryBuilderService extends AbstractBudgetCategoryBuilder<MonthlyBudgetCategoryCriteria>
{

    public MonthlyBudgetCategoryBuilderService(BudgetCategoryService budgetCategoryService, BudgetCalculations budgetCalculations, BudgetEstimatorService budgetEstimatorService, SubBudgetGoalsService subBudgetGoalsService)
    {
        super(budgetCategoryService, budgetCalculations, budgetEstimatorService, subBudgetGoalsService);
    }

    public List<BudgetCategory> initializeBudgetCategories(final SubBudget budget, final List<CategoryTransactions> categoryDesignators)
    {
        if(budget == null || categoryDesignators == null)
        {
            return Collections.emptyList();

        }
        if(budget.getBudgetSchedule().isEmpty())
        {
            return Collections.emptyList();
        }
        SubBudgetGoals subBudgetGoals = getSubBudgetGoalsService().getSubBudgetGoalsEntitiesBySubBudgetId(budget.getId());
        BudgetSchedule budgetSchedule = budget.getBudgetSchedule().get(0);
        List<BudgetScheduleRange> budgetScheduleRanges = budgetSchedule.getBudgetScheduleRanges();
        List<CategoryPeriodSpending> categoryPeriodSpendings = getMonthlyCategorySpending(categoryDesignators, budgetScheduleRanges);
        List<MonthlyBudgetCategoryCriteria> monthlyBudgetCategoryCriteria = createMonthlyCategoryBudgetCriteriaList(budget, budgetSchedule, categoryPeriodSpendings, subBudgetGoals);
        return buildBudgetCategoryList(monthlyBudgetCategoryCriteria);
    }

    @Override
    protected List<BudgetCategory> buildBudgetCategoryList(final List<MonthlyBudgetCategoryCriteria> budgetCriteria)
    {
        if(budgetCriteria == null || budgetCriteria.isEmpty())
        {
            return Collections.emptyList();
        }
        Set<MonthlyBudgetCategoryCriteria> categoryBudgetSet = new LinkedHashSet<>(budgetCriteria);
        Set<BudgetCategory> budgetCategories = new HashSet<>();
        for(MonthlyBudgetCategoryCriteria budgetCategoryCriteria : categoryBudgetSet)
        {
            if(budgetCategoryCriteria == null)
            {
                continue;
            }
            SubBudget subBudget = budgetCategoryCriteria.getSubBudget();
            List<DateRange> categoryDateRanges = budgetCategoryCriteria.getCategoryDateRanges();
            for(DateRange categoryDateRange : categoryDateRanges)
            {
                validateDateRange(categoryDateRange);
                BigDecimal budgetedAmount = budgetCategoryCriteria.getBudgetAmount(categoryDateRange);
                BigDecimal budgetActualAmount = budgetCategoryCriteria.getActualAmount(categoryDateRange);
                log.info("Budgeted Amount: {}", budgetedAmount);
                log.info("Budget Actual Amount: {}", budgetActualAmount);
                if(budgetedAmount.compareTo(BigDecimal.ZERO) > 0 || budgetActualAmount.compareTo(BigDecimal.ZERO) > 0)
                {
                    String categoryName = budgetCategoryCriteria.getCategory();
                    Double budgetOverSpendingAmount = getBudgetOverSpending(budgetActualAmount, budgetedAmount);
                    boolean isOverSpentOnBudget = isBudgetOverSpending(budgetOverSpendingAmount);
                    Long subBudgetId = subBudget.getId();
                    BudgetCategory budgetCategory = createBudgetCategory(
                            subBudgetId,
                            categoryName,
                            categoryDateRange,
                            List.of(),
                            Double.valueOf(String.valueOf(budgetActualAmount)),
                            Double.valueOf(String.valueOf(budgetedAmount)),
                            budgetOverSpendingAmount,
                            isOverSpentOnBudget
                    );
                    log.info("Budget Category: {}", budgetCategory.toString());
                    budgetCategories.add(budgetCategory);
                }
            }
        }
        log.info("Budget Categories Size: {}", budgetCategories.size());
        return new ArrayList<>(budgetCategories);
    }

    @Override
    protected List<BudgetCategory> updateBudgetCategories(final List<MonthlyBudgetCategoryCriteria> budgetCriteria)
    {
        return List.of();
    }

    public List<CategoryPeriodSpending> getMonthlyCategorySpending(final List<CategoryTransactions> categoryDesignators, final List<BudgetScheduleRange> budgetScheduleRanges)
    {
        if(categoryDesignators == null || budgetScheduleRanges == null)
        {
            return Collections.emptyList();
        }
        if(categoryDesignators.isEmpty() || budgetScheduleRanges.isEmpty())
        {
            return Collections.emptyList();
        }
        log.info("Budget Schedule size: {}", budgetScheduleRanges.size());
        List<CategoryPeriodSpending> categoryPeriodSpendingList = new ArrayList<>();
        long startTime = System.currentTimeMillis();
        for(CategoryTransactions categoryTransactions : categoryDesignators)
        {
            String categoryName = categoryTransactions.getCategoryName();
            List<Transaction> sortedTransactions = getSortedTransactions(categoryTransactions.getTransactions());
            for(BudgetScheduleRange budgetScheduleRange : budgetScheduleRanges)
            {
                LocalDate budgetScheduleStart = budgetScheduleRange.getStartRange();
                LocalDate budgetScheduleEnd = budgetScheduleRange.getEndRange();
                log.info("Budget Week: start={}, end={}", budgetScheduleStart, budgetScheduleEnd);
                List<Transaction> transactionsForWeek = filterTransactionsForWeek(sortedTransactions, budgetScheduleStart, budgetScheduleEnd);
                if(transactionsForWeek.isEmpty())
                {
                    log.debug("No Transactions found for week start={}, end={}", budgetScheduleStart, budgetScheduleEnd);
                    continue;
                }
                log.info("Transactions for week size: {}", transactionsForWeek.size());
                BigDecimal totalTransactionSpendingForBudgetScheduleRange = getTotalTransactionSpending(transactionsForWeek);
                DateRange budgetScheduleDateRange = budgetScheduleRange.getBudgetDateRange();
                if(budgetScheduleDateRange == null)
                {
                    DateRange dateRange = DateRange.createDateRange(budgetScheduleStart, budgetScheduleEnd);
                    CategoryPeriodSpending categoryPeriodSpending = new CategoryPeriodSpending(categoryName, totalTransactionSpendingForBudgetScheduleRange, dateRange);
                    categoryPeriodSpendingList.add(categoryPeriodSpending);
                }
                else
                {
                    CategoryPeriodSpending categoryPeriodSpending = new CategoryPeriodSpending(categoryName, totalTransactionSpendingForBudgetScheduleRange, budgetScheduleDateRange);
                    categoryPeriodSpendingList.add(categoryPeriodSpending);
                }
            }
        }
        long endTime = System.currentTimeMillis();
        log.info("Total time: {} ms", (endTime - startTime));
        return categoryPeriodSpendingList;
    }

    private void validateDateRange(final DateRange dateRange)
    {
        try
        {
            if(dateRange.getStartDate() == null)
            {
                throw new DateRangeException("Date Range StartDate was null");
            }
            else if(dateRange.getEndDate() == null)
            {
                throw new DateRangeException("Date Range EndDate was null");
            }
        }catch(DateRangeException e){
            log.error("There was an error with the date range: {}, {}", dateRange.toString(), e.getMessage());
            throw e;
        }
    }

    private void updateBudgetGoalsStatus(BigDecimal remainingBudgetGoalsAmount, SubBudgetGoals subBudgetGoals, LocalDate subBudgetStartDate, LocalDate subBudgetEndDate)
    {
        LocalDate now = LocalDate.now();
        if(remainingBudgetGoalsAmount.compareTo(BigDecimal.ZERO) == 0)
        {
            subBudgetGoals.setStatus(GoalStatus.COMPLETED);
        }
        else if(remainingBudgetGoalsAmount.compareTo(BigDecimal.ZERO) > 0 && now.isAfter(subBudgetStartDate) && now.isBefore(subBudgetEndDate))
        {
            subBudgetGoals.setStatus(GoalStatus.IN_PROGRESS);
        }
        else
        {
            subBudgetGoals.setStatus(GoalStatus.INCOMPLETE);
        }
    }

    //TODO: Retest this method
    //TODO: Implement method using SubBudgetGoals by using SubBudgetId to fetch any SubBudgetGoals from the database
    public List<MonthlyBudgetCategoryCriteria> createMonthlyCategoryBudgetCriteriaList(final SubBudget budget, final BudgetSchedule budgetSchedule, final List<CategoryPeriodSpending> categoryPeriodSpendingList, final SubBudgetGoals subBudgetGoals)
    {
        if(budget == null || budgetSchedule == null || categoryPeriodSpendingList == null || subBudgetGoals == null)
        {
            return Collections.emptyList();
        }
        List<MonthlyBudgetCategoryCriteria> categoryBudgets = new ArrayList<>();
        BigDecimal totalAllocatedAmount = budget.getAllocatedAmount();
        GoalStatus subBudgetGoalStatus = subBudgetGoals.getStatus();
        BigDecimal savingsGoalTarget = subBudgetGoals.getSavingsTarget();
        BigDecimal totalSpentOnBudget = budget.getSpentOnBudget();
        BigDecimal remainingSubBudgetGoalAmount = subBudgetGoals.getRemaining();
        LocalDate subBudgetStartDate = budget.getStartDate();
        LocalDate subBudgetEndDate = budget.getEndDate();
        if(subBudgetGoalStatus.equals(GoalStatus.IN_PROGRESS) && remainingSubBudgetGoalAmount.compareTo(BigDecimal.ZERO) > 0)
        {
            BigDecimal totalSavedOnBudget = totalAllocatedAmount.subtract(totalSpentOnBudget);
            BigDecimal remainingOnBudget = totalSavedOnBudget.subtract(savingsGoalTarget);
            if(remainingOnBudget.compareTo(BigDecimal.ZERO) < 0)
            {
                log.warn("Budget has a negative remaining amount, setting total allocation to zero.");
                remainingOnBudget = BigDecimal.ZERO;
                budget.setAllocatedAmount(remainingOnBudget);
                BigDecimal remainingOnSubBudgetGoals = savingsGoalTarget.subtract(subBudgetGoals.getContributedAmount());
                updateBudgetGoalsStatus(remainingOnSubBudgetGoals, subBudgetGoals, subBudgetStartDate, subBudgetEndDate);
            }
        }
        Map<String, List<CategoryPeriodSpending>> categoryPeriodSpendingMap = getCategoryPeriodSpendingMap(categoryPeriodSpendingList);
        for(Map.Entry<String, List<CategoryPeriodSpending>> entry : categoryPeriodSpendingMap.entrySet())
        {
            String categoryName = entry.getKey();
            List<CategoryPeriodSpending> categoryPeriodSpending = entry.getValue();
            BigDecimal categoryBudgetAmount = getBudgetCalculations().determineCategoryBudget(categoryName, totalAllocatedAmount);
            List<DateRange> categoryDateRanges = buildCategoryDateRanges(categoryPeriodSpending);
            List<BudgetPeriodAmount> budgetPeriodAmounts = buildBudgetPeriodAmounts(categoryName, categoryPeriodSpending, categoryBudgetAmount);
            MonthlyBudgetCategoryCriteria categoryBudget = MonthlyBudgetCategoryCriteria.buildCategoryBudget(budgetPeriodAmounts, categoryDateRanges, budget, budgetSchedule, categoryName);
            categoryBudgets.add(categoryBudget);
        }
        return categoryBudgets;
    }


    private List<Transaction> filterTransactionsForWeek(final List<Transaction> transactions, final LocalDate budgetStartDate, final LocalDate budgetEndDate)
    {
        return transactions.stream()
                .filter(tx -> !tx.getPosted().isBefore(budgetStartDate) && !tx.getPosted().isAfter(budgetEndDate))
                .toList();
    }

    private BigDecimal getTotalTransactionSpending(List<Transaction> transactions)
    {
        return transactions.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<DateRange> buildCategoryDateRanges(List<CategoryPeriodSpending> categoryPeriodSpending){
        return categoryPeriodSpending.stream()
                .map(CategoryPeriodSpending::getDateRange)
                .toList();
    }

    public List<BudgetPeriodAmount> buildBudgetPeriodAmounts(final String category, final List<CategoryPeriodSpending> categorySpending, final BigDecimal categoryBudgetAmount)
    {
        if(category == null || category.isEmpty() || categorySpending == null || categoryBudgetAmount == null)
        {
            return Collections.emptyList();
        }
        List<BudgetPeriodAmount> budgetPeriodAmounts = new ArrayList<>();
        int numberOfPeriods = categorySpending.size();
        for(CategoryPeriodSpending categoryPeriodSpending : categorySpending)
        {
            DateRange categoryDateRange = categoryPeriodSpending.getDateRange();
            LocalDate categoryStart = categoryDateRange.getStartDate();
            LocalDate categoryEnd = categoryDateRange.getEndDate();
            LocalDate firstOfMonth = categoryStart.with(TemporalAdjusters.firstDayOfMonth());
            LocalDate middleOfMonth = firstOfMonth.withDayOfMonth(15);
            LocalDate lastOfMonth = categoryEnd.with(TemporalAdjusters.lastDayOfMonth());
            log.info("Last of Month: {}",  lastOfMonth);
            BigDecimal categoryActualSpending = categoryPeriodSpending.getActualSpending();
            BigDecimal budgeted = BigDecimal.ZERO;
            if(category.equals("Rent"))
            {
                // if the category date range is the period ??-01-?? -> ??-15-??
                BigDecimal rentSplit = categoryBudgetAmount.divide(new BigDecimal("2"), RoundingMode.CEILING);
                final BigDecimal rentAmountExtra = new BigDecimal("450");
                log.info("Category Start: {}", categoryStart);
                log.info("Category End: {}", categoryEnd);
                if(categoryStart.isEqual(firstOfMonth) && categoryEnd.isEqual(middleOfMonth))
                {
                    // Assume that the first of the month will have a higher rent amount
                    // Allow for an extra $450 in this range
                    BigDecimal firstMonthPayment = rentSplit.add(rentAmountExtra);
                    log.info("First Month Payment: {}", firstMonthPayment);
                    budgeted = budgeted.add(firstMonthPayment);
                }
                else if(categoryStart.isAfter(middleOfMonth) && categoryEnd.isEqual(lastOfMonth))
                {
                    BigDecimal secondMonthPayment = rentSplit.subtract(rentAmountExtra);
                    log.info("Second Monthly Payment: {}", secondMonthPayment);
                    budgeted = budgeted.add(secondMonthPayment);
                }
            }
            else
            {
                budgeted = categoryBudgetAmount.divide(BigDecimal.valueOf(numberOfPeriods), RoundingMode.CEILING);
            }
            budgetPeriodAmounts.add(new BudgetPeriodAmount(categoryDateRange, budgeted, categoryActualSpending));
        }
        return budgetPeriodAmounts;
    }

    private Map<String, List<CategoryPeriodSpending>> getCategoryPeriodSpendingMap(List<CategoryPeriodSpending> categoryPeriodSpendingList)
    {
        return categoryPeriodSpendingList.stream()
                .collect(Collectors.groupingBy(CategoryPeriodSpending::getCategoryName));
    }

    public List<BudgetCategory> saveBudgetCategories(List<BudgetCategory> budgetCategories)
    {
        return getBudgetCategoryService().saveAll(budgetCategories);
    }

    /**
     * Builds the Budget Date Ranges based on period selection: Monthly, Weekly, BiWeekly, Daily.
     * @param budgetStart
     * @param budgetEnd
     * @param period
     * @return
     */
    //TODO: Make this method public and retest method
    public List<DateRange> buildBudgetDateRanges(final LocalDate budgetStart, final LocalDate budgetEnd, final Period period){
        if(budgetStart == null || budgetEnd == null || period == null){
            return Collections.emptyList();
        }
        if(budgetStart.equals(budgetEnd)){
            return List.of(new DateRange(budgetStart, budgetEnd));
        }
        List<DateRange> dateRanges = new ArrayList<>();
        DateRange budgetDateRange = new DateRange(budgetStart, budgetEnd);
        switch(period){
            case WEEKLY -> {
                List<DateRange> budgetWeeks = budgetDateRange.splitIntoWeeks();
                dateRanges.addAll(budgetWeeks);
            }
            case MONTHLY -> {
                List<DateRange> budgetMonths = budgetDateRange.splitIntoMonths();
                dateRanges.addAll(budgetMonths);
            }
            case BIWEEKLY -> {
                List<DateRange> budgetBiWeeks = budgetDateRange.splitIntoBiWeeks();
                dateRanges.addAll(budgetBiWeeks);
            }
        }
        return dateRanges;
    }

    private List<Transaction> getSortedTransactions(List<Transaction> transactions)
    {
        return transactions.stream().sorted(Comparator.comparing(Transaction::getPosted)).toList();
    }


}
