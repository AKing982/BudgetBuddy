package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DateRangeException;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.workbench.converter.BudgetCategoryConverter;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Component
@Slf4j
public class BudgetCategoryBuilder
{
    private BudgetCategoryService transactionCategoryService;
    private CategoryService categoryService;
    private BudgetCalculations budgetCalculator;
    private BudgetCategoryConverter transactionCategoryConverter;
    private Logger LOGGER = LoggerFactory.getLogger(BudgetCategoryBuilder.class);

    @Autowired
    public BudgetCategoryBuilder(BudgetCategoryService transactionCategoryService,
                                 CategoryService categoryService,
                                 BudgetCalculations budgetCalculator,
                                 BudgetCategoryConverter transactionCategoryConverter)
    {
        this.transactionCategoryService = transactionCategoryService;
        this.categoryService = categoryService;
        this.budgetCalculator = budgetCalculator;
        this.transactionCategoryConverter = transactionCategoryConverter;
    }

    /**
   Pseudocode:
   1. Validate inputs
      - Check if categoryPeriods and existingTransactionCategories are null
      - Return empty list if either is null

   2. Update existing transaction categories that overlap with new period
      - For each categoryPeriod:
        - Get start/end dates
        - Find matching existing categories within that date range
        - Update fields: actual amount, budget amount, transactions
        - Recalculate overspending

   3. Add new transaction categories for non-overlapping periods
      - For each categoryPeriod without a match:
        - Create new TransactionCategory
        - Set fields from CategoryPeriod
        - Add transactions
        - Calculate initial overspending

   4. Remove obsolete transaction categories
      - Find existing categories outside new date ranges
      - Mark as inactive or remove

   Edge Cases:
   - Partial period overlaps
   - Multiple transactions in same period
   - Zero budget/actual amounts
   - Date range mismatches
   - Duplicate transactions
   - Missing transactions
   - Categories changing names
   - Null transaction lists
   - Zero-length periods
   - Future dated transactions
   **/
    public List<BudgetCategory> updateTransactionCategories(final List<BudgetCategoryCriteria> categoryBudgets, final List<BudgetCategory> existingBudgetCategories)
    {
        if(categoryBudgets == null || existingBudgetCategories == null)
        {
            return Collections.emptyList();
        }

//        Set<TransactionCategory> uniqueCategories = new LinkedHashSet<>(existingTransactionCategories);
//        log.info("Updating Transaction Categories. Category Periods size: {}", categoryBudgets.size());
//        // 1. CASE: WHEN Existing Transaction Categories and New Periods OverLap with existing transaction categories
//        if(!existingTransactionCategories.isEmpty())
//        {
//            for(CategoryBudget categoryBudget : categoryBudgets)
//            {
//                List<DateRange> categoryPeriodDateRanges = categoryBudget.getCategoryDateRanges();
//                int dateRangeIndex = 0;
//                while(dateRangeIndex < categoryPeriodDateRanges.size())
//                {
//                    DateRange dateRange = categoryPeriodDateRanges.get(dateRangeIndex);
//                    // Does any of the transaction categories match the date ranges
//                    Optional<TransactionCategory> existingTransactionCategory = existingTransactionCategories.stream()
//                            .filter(tc -> tc.getCategoryName().equals(categoryBudget.getCategory()) && tc.getStartDate().equals(dateRange.getStartDate()) && tc.getEndDate().equals(dateRange.getEndDate()))
//                            .findFirst();
//
//                    // If there's an existing transaction category that falls into the range of the category data range
//                    // Then update the transaction category with the new category period data
//                    List<Transaction> categoryPeriodTransactions = categoryBudget.getCategoryTransactions().stream()
//                            .filter(t -> !t.getDate().isBefore(dateRange.getStartDate()) &&
//                                    !t.getDate().isAfter(dateRange.getEndDate()))
//                            .collect(Collectors.toList()); // Filter transactions for current date range
//
//                    if(existingTransactionCategory.isPresent())
//                    {
//                        TransactionCategory transactionCategory = existingTransactionCategory.get();
//                        uniqueCategories.remove(transactionCategory);
//
//                        // Retrieve the budget actual amount from the category period
//                        Double categoryBudgetActualAmount = categoryBudget.getActualAmount(dateRange);
//
//                        // Update the Transaction categories actual amount
//                        transactionCategory.setBudgetActual(categoryBudgetActualAmount);
//
//                        // Update the Transaction categories transactions list
//                        transactionCategory.setTransactions(categoryPeriodTransactions);
//
//                        // Is the Transaction Category being over spent?
//                        Double transactionCategoryBudgetAmount = transactionCategory.getBudgetedAmount();
//                        Double transactionCategoryBudgetActual = transactionCategory.getBudgetActual();
//                        if(transactionCategoryBudgetActual > transactionCategoryBudgetAmount)
//                        {
//                            transactionCategory.setOverSpendingAmount(transactionCategoryBudgetActual);
//                            transactionCategory.setOverSpent(true);
//                        }
//                        else
//                        {
//                            transactionCategory.setOverSpendingAmount(0.0);
//                            transactionCategory.setOverSpent(false);
//                        }
//                        uniqueCategories.add(transactionCategory);
//                    }
//                    else if(!categoryPeriodTransactions.isEmpty())
//                    {
//                        Double categoryBudgetActualAmount = categoryBudget.getActualAmount(dateRange);
//                        Double categoryBudgetedAmount = categoryBudget.getBudgetAmount(dateRange);
//                        String categoryName = categoryBudget.getCategory();
//                        String categoryId = categoryBudget.getCategoryId();
//                        SubBudget subBudget = categoryBudget.getBudget();
//                        Long subBudgetId = subBudget.getId();
//                        TransactionCategory newTransactionCategory = createTransactionCategory(subBudgetId, categoryId, categoryName, dateRange, categoryPeriodTransactions, categoryBudgetActualAmount, categoryBudgetedAmount, 0.0, false);
//                        uniqueCategories.add(newTransactionCategory);
//                    }
//                    dateRangeIndex++;
//                }
//            }
//        }
        return null;
//        return new ArrayList<>(uniqueCategories);
    }

    private BudgetCategory createTransactionCategory(
            Long subBudgetId,
            String categoryId,
            String categoryName,
            DateRange dateRange,
            List<Transaction> transactions,
            Double budgetActualSpendingAmount,
            Double budgetAmount,
            Double overSpendingAmount,
            boolean isOverSpending) {

        // Calculate total amount from all transactions
        double actualAmount = transactions.stream()
                .map(t -> t.getAmount().doubleValue())
                .reduce(0.0, Double::sum);

        BudgetCategory newCategory = new BudgetCategory();
        newCategory.setSubBudgetId(subBudgetId);
        newCategory.setCategoryName(categoryName);
        newCategory.setCategoryId(categoryId);
        newCategory.setBudgetActual(budgetActualSpendingAmount);
        newCategory.setBudgetedAmount(budgetAmount);
        newCategory.setStartDate(dateRange.getStartDate());
        newCategory.setEndDate(dateRange.getEndDate());
        newCategory.setTransactions(transactions);
        newCategory.setIsActive(true);
        newCategory.setBudgetActual(actualAmount);
        newCategory.setOverSpent(isOverSpending);
        newCategory.setOverSpendingAmount(overSpendingAmount);

        return newCategory;
    }

    public List<BudgetCategory> initializeTransactionCategories(final SubBudget budget, final BudgetSchedule budgetSchedule, final List<CategoryTransactions> categoryDesignators, final SubBudgetGoals subBudgetGoals)
    {
        if(budget == null || categoryDesignators == null || categoryDesignators.isEmpty()){
            return Collections.emptyList();
        }
        categoryDesignators.forEach((categoryDesignator -> {
            LOGGER.info("Category Designator: " + categoryDesignator.toString());
        }));
        LocalDate budgetStartDate = budgetSchedule.getStartDate();
        LocalDate budgetEndDate = budgetSchedule.getEndDate();
        DateRange budgetDateRange = new DateRange(budgetStartDate, budgetEndDate);
        List<DateRange> budgetWeeks = budgetDateRange.splitIntoWeeks();
        // 3. Create CategoryPeriods with properly categorized transactions
        List<CategoryPeriodSpending> categorySpendingList = getCategorySpendingByCategoryDesignator(categoryDesignators, budgetWeeks);
        categorySpendingList.forEach(categorySpending -> {
            LOGGER.info("Category Spending: " + categorySpending.toString());
        });
        List<BudgetCategoryCriteria> categoryBudgets = createCategoryBudgets(
                budget,
                budgetSchedule,
                categorySpendingList,
                subBudgetGoals
        );
        categoryBudgets.forEach(categoryPeriod -> {
            LOGGER.info("Category Period: " + categoryPeriod.toString());
        });

        // 4. Build final transaction categories
        return buildTransactionCategoryList(categoryBudgets);
    }

    private Double getBudgetOverSpending(final BigDecimal budgetActualAmount, final BigDecimal budgetAmount)
    {
        Double budgetActual = Double.valueOf(budgetActualAmount.toString());
        Double budgeted = Double.valueOf(budgetAmount.toString());
        if(budgetActual > budgeted)
        {
            return budgetActual;
        }
        return 0.0;
    }

    private boolean isBudgetOverSpending(final Double budgetOverSpendingAmount)
    {
        return budgetOverSpendingAmount > 0.0;
    }

    public List<CategoryPeriodSpending> getCategorySpendingByCategoryDesignator(final List<CategoryTransactions> categoryDesignators, final List<DateRange> budgetDateRanges)
    {
        List<CategoryPeriodSpending> categorySpendingList = new ArrayList<>();
        for(CategoryTransactions categoryTransaction : categoryDesignators)
        {
            String categoryName = categoryTransaction.getCategoryName();
            List<Transaction> sortedTransactions = categoryTransaction.getTransactions().stream()
                    .sorted(Comparator.comparing(Transaction::getPosted))
                    .toList();

            // Get the Budget Date Ranges
            for(DateRange budgetWeek : budgetDateRanges)
            {
                LocalDate budgetWeekStart = budgetWeek.getStartDate();
                LocalDate budgetWeekEnd = budgetWeek.getEndDate();
                List<Transaction> transactionsForWeek = sortedTransactions.stream()
                        .filter(tx -> !tx.getPosted().isBefore(budgetWeekStart) && !tx.getPosted().isAfter(budgetWeekEnd))
                        .toList();

                BigDecimal totalSpending = transactionsForWeek.stream()
                        .map(Transaction::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                if(totalSpending.compareTo(BigDecimal.ZERO) != 0) {
                    CategoryPeriodSpending categoryPeriodSpending = new CategoryPeriodSpending(categoryName, totalSpending, budgetWeek);
                    categorySpendingList.add(categoryPeriodSpending);
                }
            }
        }
        return categorySpendingList;
    }

    /**
     * PseudoCode:
     *
     *
     */
    //TODO: Re
    public List<BudgetCategory> buildTransactionCategoryList(final List<BudgetCategoryCriteria> categoryBudgets)
    {
        if(categoryBudgets == null || categoryBudgets.isEmpty())
        {
            return Collections.emptyList();
        }
        Set<BudgetCategoryCriteria> categoryBudgetSet = new LinkedHashSet<>(categoryBudgets);
        Set<BudgetCategory> transactionCategories = new HashSet<>();
        for(BudgetCategoryCriteria categoryBudget : categoryBudgetSet)
        {
            if(categoryBudget == null)
            {
                continue;
            }
            SubBudget subBudget = categoryBudget.getBudget();
            List<DateRange> categoryDateRanges = categoryBudget.getCategoryDateRanges();
            for(DateRange categoryDateRange : categoryDateRanges)
            {
                validateDateRange(categoryDateRange);

                BigDecimal budgetedAmount = categoryBudget.getBudgetAmount(categoryDateRange);
                BigDecimal budgetActualAmount = categoryBudget.getActualAmount(categoryDateRange);
                if(budgetedAmount.compareTo(BigDecimal.ZERO) > 0 || budgetActualAmount.compareTo(BigDecimal.ZERO) > 0)
                {
                    String categoryName = categoryBudget.getCategory();
                    String categoryId = categoryBudget.getCategoryId();
                    Double budgetOverSpendingAmount = getBudgetOverSpending(budgetActualAmount, budgetedAmount);
                    boolean isOverSpentOnBudget = isBudgetOverSpending(budgetOverSpendingAmount);
                    Long subBudgetId = subBudget.getId();
                    BudgetCategory transactionCategory = createTransactionCategory(
                            subBudgetId,
                            categoryId,
                            categoryName,
                            categoryDateRange,
                            List.of(),
                            Double.valueOf(String.valueOf(budgetActualAmount)),
                            Double.valueOf(String.valueOf(budgetedAmount)),
                            budgetOverSpendingAmount,
                            isOverSpentOnBudget
                    );
                    LOGGER.info("Transaction Category: {}", transactionCategory.toString());
                    transactionCategories.add(transactionCategory);
                }
            }
        }
        LOGGER.info("Transaction Categories Size: {}", transactionCategories.size());
        return new ArrayList<>(transactionCategories);
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
    public List<BudgetCategoryCriteria> createCategoryBudgets(final SubBudget budget, final BudgetSchedule budgetSchedule, final List<CategoryPeriodSpending> categoryPeriodSpendingList, final SubBudgetGoals subBudgetGoals)
    {
        if(budget == null || budgetSchedule == null || categoryPeriodSpendingList == null || subBudgetGoals == null)
        {
            return Collections.emptyList();
        }
        List<BudgetCategoryCriteria> categoryBudgets = new ArrayList<>();
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
            BigDecimal categoryBudgetAmount = budgetCalculator.determineCategoryBudget(categoryName, totalAllocatedAmount);
            List<DateRange> categoryDateRanges = buildCategoryDateRanges(categoryPeriodSpending);
            List<BudgetPeriodAmount> budgetPeriodAmounts = buildBudgetPeriodAmounts(categoryName, categoryPeriodSpending, categoryBudgetAmount);
            BudgetCategoryCriteria categoryBudget = BudgetCategoryCriteria.buildCategoryBudget(budgetPeriodAmounts, categoryDateRanges, budget, budgetSchedule, categoryName);
            categoryBudgets.add(categoryBudget);
        }
        return categoryBudgets;
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
}
