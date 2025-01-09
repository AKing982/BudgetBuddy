package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionCategoryEntity;
import com.app.budgetbuddy.exceptions.CategoryNotFoundException;
import com.app.budgetbuddy.exceptions.CategoryPeriodCriteriaException;
import com.app.budgetbuddy.exceptions.DateRangeException;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.TransactionCategoryService;
import com.app.budgetbuddy.workbench.categories.CategoryRuleEngine;
import com.app.budgetbuddy.workbench.converter.TransactionCategoryConverter;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Component
@Slf4j
public class TransactionCategoryBuilder
{
    private TransactionCategoryService transactionCategoryService;
    private CategoryService categoryService;
    private BudgetCalculations budgetCalculator;
    private TransactionCategoryConverter transactionCategoryConverter;
    private Logger LOGGER = LoggerFactory.getLogger(TransactionCategoryBuilder.class);

    @Autowired
    public TransactionCategoryBuilder(TransactionCategoryService transactionCategoryService,
                                 CategoryService categoryService,
                                 BudgetCalculations budgetCalculator,
                                 TransactionCategoryConverter transactionCategoryConverter)
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
    public List<TransactionCategory> updateTransactionCategories(final List<CategoryPeriod> categoryPeriods, final List<TransactionCategory> existingTransactionCategories)
    {
        if(categoryPeriods == null || existingTransactionCategories == null)
        {
            return Collections.emptyList();
        }

        Set<TransactionCategory> uniqueCategories = new LinkedHashSet<>(existingTransactionCategories);
        log.info("Updating Transaction Categories. Category Periods size: {}", categoryPeriods.size());
        // 1. CASE: WHEN Existing Transaction Categories and New Periods OverLap with existing transaction categories
        if(!existingTransactionCategories.isEmpty())
        {
            for(CategoryPeriod categoryPeriod : categoryPeriods)
            {
                CategoryPeriodCriteria categoryPeriodCriteria = categoryPeriod.getCategoryPeriodCriteria();
                List<DateRange> categoryPeriodDateRanges = categoryPeriodCriteria.getCategoryDateRanges();
                int dateRangeIndex = 0;
                while(dateRangeIndex < categoryPeriodDateRanges.size())
                {
                    DateRange dateRange = categoryPeriodDateRanges.get(dateRangeIndex);
                    // Does any of the transaction categories match the date ranges
                    Optional<TransactionCategory> existingTransactionCategory = existingTransactionCategories.stream()
                            .filter(tc -> tc.getCategoryName().equals(categoryPeriod.getCategory()) && tc.getStartDate().equals(dateRange.getStartDate()) && tc.getEndDate().equals(dateRange.getEndDate()))
                            .findFirst();

                    // If there's an existing transaction category that falls into the range of the category data range
                    // Then update the transaction category with the new category period data
                    List<Transaction> categoryPeriodTransactions = categoryPeriod.getTransactions();
                    if(existingTransactionCategory.isPresent())
                    {
                        TransactionCategory transactionCategory = existingTransactionCategory.get();

                        // Retrieve the budget actual amount from the category period
                        Double categoryBudgetActualAmount = categoryPeriod.getCategoryPeriodCriteria().getActualAmount(dateRange);

                        // Update the Transaction categories actual amount
                        transactionCategory.setBudgetActual(categoryBudgetActualAmount);

                        // Update the Transaction categories transactions list
                        transactionCategory.setTransactions(categoryPeriodTransactions);

                        // Is the Transaction Category being over spent?
                        Double transactionCategoryBudgetAmount = transactionCategory.getBudgetedAmount();
                        Double transactionCategoryBudgetActual = transactionCategory.getBudgetActual();
                        if(transactionCategoryBudgetActual > transactionCategoryBudgetAmount)
                        {
                            transactionCategory.setOverSpendingAmount(transactionCategoryBudgetActual);
                            transactionCategory.setOverSpent(true);
                        }
                        else
                        {
                            transactionCategory.setOverSpendingAmount(0.0);
                            transactionCategory.setOverSpent(false);
                        }
                        uniqueCategories.add(transactionCategory);
                    }
                    else
                    {
                        Double categoryBudgetActualAmount = categoryPeriod.getCategoryPeriodCriteria().getActualAmount(dateRange);
                        Double categoryBudgetedAmount = categoryPeriod.getCategoryPeriodCriteria().getBudgetAmount(dateRange);
                        String categoryName = categoryPeriod.getCategory();
                        String categoryId = categoryPeriod.getCategoryId();
                        TransactionCategory newTransactionCategory = createTransactionCategory(categoryId, categoryName, dateRange, categoryPeriodTransactions, categoryBudgetActualAmount, categoryBudgetedAmount, 0.0, false);
                        uniqueCategories.add(newTransactionCategory);
                    }
                    dateRangeIndex++;
                }
            }
        }
        return new ArrayList<>(uniqueCategories);
    }


    private TransactionCategory createTransactionCategory(
            String categoryId,
            String categoryName,
            DateRange dateRange,
            List<Transaction> transactions,
            Double budgetActualSpendingAmount,
            Double budgetAmount,
            Double overSpendingAmount,
            boolean isOverSpending) {

        double actualAmount = transactions.stream()
                .map(t -> t.getAmount().doubleValue())
                .reduce(0.0, Double::sum);

        TransactionCategory newCategory = new TransactionCategory();
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

    public List<TransactionCategory> initializeTransactionCategories(final Budget budget, final BudgetPeriod budgetPeriod, final List<CategoryDesignator> categoryDesignators)
    {
        if(budget == null || budgetPeriod == null || categoryDesignators == null || categoryDesignators.isEmpty()){
            return Collections.emptyList();
        }

        categoryDesignators.forEach((categoryDesignator -> {
            LOGGER.info("Category Designator: " + categoryDesignator.toString());
        }));

        LocalDate budgetStartDate = budget.getStartDate();
        LocalDate budgetEndDate = budget.getEndDate();
        DateRange budgetDateRange = new DateRange(budgetStartDate, budgetEndDate);
        List<DateRange> budgetWeeks = budgetDateRange.splitIntoWeeks();
        // 3. Create CategoryPeriods with properly categorized transactions
        List<CategorySpending> categorySpendingList = getCategorySpendingByCategoryDesignator(categoryDesignators, budgetWeeks);
        categorySpendingList.forEach(categorySpending -> {
            LOGGER.info("Category Spending: " + categorySpending.toString());
        });
        List<CategoryPeriod> categoryPeriods = createCategoryPeriods(
                budget,
                budget.getStartDate(),
                budget.getEndDate(),
                budgetPeriod.getPeriod(),
                categorySpendingList,
                categoryDesignators
        );
        categoryPeriods.forEach(categoryPeriod -> {
            LOGGER.info("Category Period: " + categoryPeriod.toString());
        });
        // 4. Build final transaction categories
        return buildTransactionCategoryList(categoryPeriods, budget);
    }

    private Double getBudgetOverSpending(final Double budgetActualAmount, final Double budgetAmount)
    {
        if(budgetActualAmount > budgetAmount)
        {
            return budgetActualAmount;
        }
        return 0.0;
    }

    private boolean isBudgetOverSpending(final Double budgetOverSpendingAmount)
    {
        return budgetOverSpendingAmount > 0.0;
    }

    public List<CategorySpending> getCategorySpendingByCategoryDesignator(final List<CategoryDesignator> categoryDesignators, final List<DateRange> budgetDateRanges)
    {
        List<CategorySpending> categorySpendingList = new ArrayList<>();
        for(CategoryDesignator categoryDesignator : categoryDesignators) {
            String categoryId = categoryDesignator.getCategoryId();
            String categoryName = categoryDesignator.getCategoryName();
            List<Transaction> sortedTransactions = categoryDesignator.getTransactions().stream()
                    .sorted(Comparator.comparing(Transaction::getPosted))
                    .toList();

            // Get the Budget Date Ranges
            int dateRangeIndex = 0;
            while(dateRangeIndex < budgetDateRanges.size())
            {
                DateRange budgetWeek = budgetDateRanges.get(dateRangeIndex);
                LocalDate budgetWeekStart = budgetWeek.getStartDate();
                LocalDate budgetWeekEnd = budgetWeek.getEndDate();
                List<Transaction> transactionsForWeek = sortedTransactions.stream()
                        .filter(tx -> !tx.getPosted().isBefore(budgetWeekStart) && !tx.getPosted().isAfter(budgetWeekEnd))
                        .toList();

                BigDecimal totalSpending = transactionsForWeek.stream()
                        .map(Transaction::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                if(totalSpending.compareTo(BigDecimal.ZERO) > 0) {
                    CategorySpending categorySpending = new CategorySpending(categoryId, categoryName, totalSpending, budgetWeek);
                    categorySpendingList.add(categorySpending);
                }
                dateRangeIndex++;
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
    public List<TransactionCategory> buildTransactionCategoryList(final List<CategoryPeriod> categoryPeriods, final Budget budget)
    {
        if(categoryPeriods == null || budget == null){
            return Collections.emptyList();
        }
        Set<TransactionCategory> transactionCategories = new HashSet<>();
        for(CategoryPeriod categoryPeriod : categoryPeriods)
        {
            if(categoryPeriod == null)
            {
                continue;
            }
            try
            {
                CategoryPeriodCriteria categoryPeriodCriteria = categoryPeriod.getCategoryPeriodCriteria();
                if(categoryPeriodCriteria == null)
                {
                    throw new CategoryPeriodCriteriaException("Category Period Criteria was found null");
                }
                List<DateRange> categoryDateRanges = categoryPeriodCriteria.getCategoryDateRanges().stream()
                        .filter(dateRange -> categoryPeriod.getCategoryPeriodCriteria().getBudgetAmount(dateRange) != null &&
                                categoryPeriod.getCategoryPeriodCriteria().getActualAmount(dateRange) != null)
                        .toList();
                validateCategoryPeriodCriteria(categoryPeriodCriteria);
                List<Transaction> transactions = categoryPeriod.getTransactions();
                if(transactions.isEmpty())
                {
                    return Collections.emptyList();
                }
                else
                {
                    int dateRangeIndex = 0;
                    while(dateRangeIndex < categoryDateRanges.size())
                    {
                        DateRange dateRange = categoryDateRanges.get(dateRangeIndex);
                        validateDateRange(dateRange);
                        Double budgetedAmount = categoryPeriod.getCategoryPeriodCriteria().getBudgetAmount(dateRange);
                        Double budgetActualAmount = categoryPeriod.getCategoryPeriodCriteria().getActualAmount(dateRange);
                        log.info("Budget Amount: {}, Actual: {}", budgetedAmount, budgetActualAmount);
                        String categoryName = categoryPeriod.getCategory();
                        String categoryId = categoryPeriod.getCategoryId();
                        Double budgetOverSpendingAmount = getBudgetOverSpending(budgetActualAmount, budgetedAmount);
                        boolean isOverSpentOnBudget = isBudgetOverSpending(budgetOverSpendingAmount);
                        TransactionCategory transactionCategory = createTransactionCategory(categoryId, categoryName, dateRange, transactions, budgetActualAmount, budgetedAmount, budgetOverSpendingAmount, isOverSpentOnBudget);
                        transactionCategories.add(transactionCategory);
                        dateRangeIndex++;
                    }
                }
            }catch(CategoryPeriodCriteriaException e){
                log.error("Category Period Criteria Exception: {}", e.getMessage());
                throw e;
            }

        }
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

    private void validateCategoryPeriodCriteria(final CategoryPeriodCriteria categoryPeriodCriteria)
    {
        if(categoryPeriodCriteria.getBudgetAmounts().isEmpty())
        {
            throw new CategoryPeriodCriteriaException("No Budget Period Amounts found for Category Period Criteria: " + categoryPeriodCriteria.toString());
        }
        else if(categoryPeriodCriteria.getActualAmounts().isEmpty())
        {
            throw new CategoryPeriodCriteriaException("No Budget Period Actual Amounts found for Category Period Criteria: " + categoryPeriodCriteria.toString());
        }
    }


    private CategoryPeriodCriteria buildCategoryPeriodCriteria(List<DateRange> transactionDateRanges, List<BudgetPeriodAmount> categoryBudgetedAmount, List<BudgetPeriodAmount> categoryBudgetActual)
    {
        if(transactionDateRanges == null || categoryBudgetedAmount == null || categoryBudgetActual == null)
        {
            return null;
        }
        return new CategoryPeriodCriteria(transactionDateRanges, categoryBudgetedAmount, categoryBudgetActual);
    }

    private CategoryPeriod buildCategoryPeriod(CategoryPeriodCriteria categoryPeriodCriteria,
                                               Budget budget, List<Transaction> transactions, String category) {

        CategoryPeriod categoryPeriod = new CategoryPeriod();
        categoryPeriod.setCategory(category);
        categoryPeriod.setBudgetId(budget.getId());
        categoryPeriod.setIsActive(true);
        categoryPeriod.setTransactions(transactions);
        categoryPeriod.setCategoryPeriodCriteria(categoryPeriodCriteria);

        return categoryPeriod;
    }

    //TODO: Retest this method
    public List<CategoryPeriod> createCategoryPeriods(final Budget budget, final LocalDate budgetStartDate, final LocalDate budgetEndDate, final Period period, final List<CategorySpending> categorySpendingData, final List<CategoryDesignator> categoryDesignators)
    {
        if(budgetStartDate == null || budgetEndDate == null)
        {
            return new ArrayList<>();
        }
        List<CategoryPeriod> categoryPeriods = new ArrayList<>();
        for(CategoryDesignator categoryDesignator : categoryDesignators)
        {
            String category = categoryDesignator.getCategoryName();
            String categoryId = categoryDesignator.getCategoryId();
            // Obtain the transactions
            List<Transaction> transactions = categoryDesignator.getTransactions().stream()
                    .sorted(Comparator.comparing(Transaction::getPosted))
                    .collect(Collectors.toList());
            // Build the Budget Date Ranges
            List<DateRange> budgetDateRanges = buildBudgetDateRanges(budgetStartDate, budgetEndDate, period);
            // Determine the Category Period Date Ranges
            int categorySpendingIndex = 0;
            while(categorySpendingIndex < categorySpendingData.size()) {
                CategorySpending categorySpending = categorySpendingData.get(categorySpendingIndex);
                if(categorySpending.getCategoryId().equals(categoryId) &&
                        categorySpending.getCategoryName().equals(categoryDesignator.getCategoryName())) {
                    List<DateRange> categoryPeriodDateRanges = buildCategoryPeriodDateRanges(budgetDateRanges, List.of(categorySpending));
                    BigDecimal totalSpendingOnAllCategories = budgetCalculator.getTotalSpendingOnAllCategories(categorySpendingData);
                    LOGGER.info("Total Spending on All Categories: {}", totalSpendingOnAllCategories);
                    LOGGER.info("Category Spending: {}", categorySpending.toString());
                    categoryPeriodDateRanges.forEach(transactionDateRange -> {
                        LOGGER.info("Transaction Date Range: {}", transactionDateRange.toString());
                    });
                    List<BudgetPeriodAmount> categoryBudgetedAmounts = budgetCalculator.calculateBudgetedAmountForCategoryDateRange(
                            categorySpending, totalSpendingOnAllCategories, categoryPeriodDateRanges, budget);
                    List<BudgetPeriodAmount> actualSpentOnCategories = budgetCalculator.calculateActualAmountForCategoryDateRange(
                            categorySpending, categoryDesignator, categoryPeriodDateRanges, budget);

                    // Add this block
                    CategoryPeriodCriteria categoryPeriodCriteria = new CategoryPeriodCriteria();
                    categoryPeriodCriteria.setCategoryDateRanges(categoryPeriodDateRanges);
                    categoryPeriodCriteria.setBudgetAmounts(categoryBudgetedAmounts);
                    categoryPeriodCriteria.setActualAmounts(actualSpentOnCategories);

                    CategoryPeriod categoryPeriod = new CategoryPeriod(
                            categoryId,
                            category,
                            transactions,
                            categoryPeriodCriteria,
                            budget.getId(),
                            true
                    );
                    categoryPeriods.add(categoryPeriod);
                }
                categorySpendingIndex++;
            }
        }
        return categoryPeriods;
    }

    public List<DateRange> buildCategoryPeriodDateRanges(final List<DateRange> budgetDateRanges, final List<CategorySpending> categorySpendingList)
    {
        if(budgetDateRanges.isEmpty() || categorySpendingList.isEmpty())
        {
            return Collections.emptyList();
        }
        Set<DateRange> uniqueCategoryDateRanges = new HashSet<>();
        for(DateRange budgetWeek : budgetDateRanges)
        {
            int categorySpendingIndex = 0;
            while(categorySpendingIndex < categorySpendingList.size()) {
                CategorySpending categorySpending = categorySpendingList.get(categorySpendingIndex);
                DateRange spendingRange = categorySpending.getDateRange();
                if(budgetWeek.getStartDate().equals(spendingRange.getStartDate())) {
                    uniqueCategoryDateRanges.add(budgetWeek);
                }
                categorySpendingIndex++;
            }
        }
        uniqueCategoryDateRanges.forEach(dateRange -> {
            LOGGER.info("Category Date Range: {}", dateRange.toString());
        });

        return new ArrayList<>(uniqueCategoryDateRanges);
    }

    private List<CategoryPeriod> createCategoryPeriodsForDateRanges(
            List<Transaction> transactions,
            List<DateRange> transactionDateRanges,
            List<BudgetPeriodAmount> categoryBudgetedAmounts,
            List<BudgetPeriodAmount> actualSpentOnCategories,
            Budget budget,
            String category) {

        List<CategoryPeriod> periods = new ArrayList<>();
        for (DateRange dateRange : transactionDateRanges) {
            List<Transaction> periodTransactions = transactions.stream()
                    .filter(transaction ->
                            (transaction.getPosted().isEqual(dateRange.getStartDate()) ||
                                    transaction.getPosted().isAfter(dateRange.getStartDate())) &&
                                    (transaction.getPosted().isBefore(dateRange.getEndDate()) ||
                                            transaction.getPosted().isEqual(dateRange.getEndDate()))
                    )
                    .collect(Collectors.toList());

            // Filter budget amounts for this period
            List<BudgetPeriodAmount> periodBudgetAmounts = categoryBudgetedAmounts.stream()
                    .filter(amount -> amount.getDateRange().getStartDate().equals(dateRange.getStartDate()))
                    .collect(Collectors.toList());

            // Filter actual amounts for this period
            List<BudgetPeriodAmount> periodActualAmounts = actualSpentOnCategories.stream()
                    .filter(amount -> amount.getDateRange().getStartDate().equals(dateRange.getStartDate()))
                    .collect(Collectors.toList());

            CategoryPeriod categoryPeriod = buildCategoryPeriod(
                    buildCategoryPeriodCriteria(
                            List.of(dateRange),
                            periodBudgetAmounts,
                            periodActualAmounts
                    ),
                    budget,
                    periodTransactions,
                    category
            );
            periods.add(categoryPeriod);
        }
        return periods;
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

        List<DateRange> dateRanges = new ArrayList<>();
        LocalDate currentStart = budgetStart;

        while (!currentStart.isAfter(budgetEnd)) {
            LocalDate periodEnd = switch (period) {
                case DAILY -> currentStart.plusDays(1);
                case WEEKLY -> currentStart.plusWeeks(1);
                case BIWEEKLY -> currentStart.plusWeeks(2);
                case MONTHLY -> currentStart.plusMonths(1);
            };

            LocalDate adjustedEnd = periodEnd.isAfter(budgetEnd) ? budgetEnd : periodEnd;
            DateRange newRange = new DateRange(currentStart, adjustedEnd);

            if (dateRanges.isEmpty() || !dateRanges.get(dateRanges.size()-1).equals(newRange)) {
                dateRanges.add(newRange);
                LOGGER.info("DateRange: Start = {}, End = {}", currentStart, adjustedEnd);
            }

            if (adjustedEnd.equals(budgetEnd)) {
                break;
            }
            currentStart = adjustedEnd;
        }

        return dateRanges;
    }

    private List<DateRange> buildTransactionDateRanges(List<? extends Transaction> transactions, LocalDate budgetStartDate, LocalDate budgetEndDate, Period period)
    {
        if (transactions.isEmpty()) {
            return Collections.emptyList();
        }

        // Check if this is a rent-style category (2 transactions with 1st/16th pattern)
        boolean isRentStyle = transactions.size() == 2 &&
                transactions.stream()
                        .anyMatch(t -> t.getPosted().getDayOfMonth() == 16 || t.getPosted().getDayOfMonth() == 1);

        if (isRentStyle) {
            return transactions.stream()
                    .sorted(Comparator.comparing(Transaction::getPosted))
                    .map(transaction -> {
                        LocalDate startDate = transaction.getPosted();
                        LocalDate endDate = startDate.plusWeeks(1);
                        if (endDate.isAfter(budgetEndDate)) {
                            endDate = budgetEndDate;
                        }
                        return new DateRange(startDate, endDate);
                    })
                    .collect(Collectors.toList());
        }

        // Create date ranges for the entire budget period, split into weeks
        DateRange budgetDateRange = new DateRange(budgetStartDate, budgetEndDate);
        List<DateRange> dateRanges = budgetDateRange.splitIntoWeeks();

        // Filter to only include ranges that contain transactions
        return dateRanges.stream()
                .filter(dateRange -> transactions.stream()
                        .anyMatch(transaction ->
                                (transaction.getPosted().isEqual(dateRange.getStartDate()) ||
                                        transaction.getPosted().isAfter(dateRange.getStartDate())) &&
                                        (transaction.getPosted().isBefore(dateRange.getEndDate()) ||
                                                transaction.getPosted().isEqual(dateRange.getEndDate()))
                        ))
                .collect(Collectors.toList());
    }

    private boolean isTransactionInDateRange(Transaction transaction, DateRange dateRange) {
        LocalDate transactionDate = transaction.getPosted();
        return !transactionDate.isBefore(dateRange.getStartDate()) &&
                !transactionDate.isAfter(dateRange.getEndDate());
    }
}
