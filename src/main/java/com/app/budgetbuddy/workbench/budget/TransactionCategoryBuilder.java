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
    public List<TransactionCategory> updateTransactionCategories(final List<CategoryBudget> categoryBudgets, final List<TransactionCategory> existingTransactionCategories)
    {
        if(categoryBudgets == null || existingTransactionCategories == null)
        {
            return Collections.emptyList();
        }

        Set<TransactionCategory> uniqueCategories = new LinkedHashSet<>(existingTransactionCategories);
        log.info("Updating Transaction Categories. Category Periods size: {}", categoryBudgets.size());
        // 1. CASE: WHEN Existing Transaction Categories and New Periods OverLap with existing transaction categories
        if(!existingTransactionCategories.isEmpty())
        {
            for(CategoryBudget categoryBudget : categoryBudgets)
            {
                List<DateRange> categoryPeriodDateRanges = categoryBudget.getCategoryDateRanges();
                int dateRangeIndex = 0;
                while(dateRangeIndex < categoryPeriodDateRanges.size())
                {
                    DateRange dateRange = categoryPeriodDateRanges.get(dateRangeIndex);
                    // Does any of the transaction categories match the date ranges
                    Optional<TransactionCategory> existingTransactionCategory = existingTransactionCategories.stream()
                            .filter(tc -> tc.getCategoryName().equals(categoryBudget.getCategory()) && tc.getStartDate().equals(dateRange.getStartDate()) && tc.getEndDate().equals(dateRange.getEndDate()))
                            .findFirst();

                    // If there's an existing transaction category that falls into the range of the category data range
                    // Then update the transaction category with the new category period data
                    List<Transaction> categoryPeriodTransactions = categoryBudget.getCategoryTransactions().stream()
                            .filter(t -> !t.getDate().isBefore(dateRange.getStartDate()) &&
                                    !t.getDate().isAfter(dateRange.getEndDate()))
                            .collect(Collectors.toList()); // Filter transactions for current date range

                    if(existingTransactionCategory.isPresent())
                    {
                        TransactionCategory transactionCategory = existingTransactionCategory.get();
                        uniqueCategories.remove(transactionCategory);

                        // Retrieve the budget actual amount from the category period
                        Double categoryBudgetActualAmount = categoryBudget.getActualAmount(dateRange);

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
                    else if(!categoryPeriodTransactions.isEmpty())
                    {
                        Double categoryBudgetActualAmount = categoryBudget.getActualAmount(dateRange);
                        Double categoryBudgetedAmount = categoryBudget.getBudgetAmount(dateRange);
                        String categoryName = categoryBudget.getCategory();
                        String categoryId = categoryBudget.getCategoryId();
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

        // Calculate total amount from all transactions
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

    public List<TransactionCategory> initializeTransactionCategories(final Budget budget, final BudgetPeriod budgetPeriod, final List<CategoryTransactions> categoryDesignators)
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
        List<CategoryPeriodSpending> categorySpendingList = getCategorySpendingByCategoryDesignator(categoryDesignators, budgetWeeks);
        categorySpendingList.forEach(categorySpending -> {
            LOGGER.info("Category Spending: " + categorySpending.toString());
        });
        List<CategoryBudget> categoryBudgets = createCategoryBudgets(
                budget,
                budget.getStartDate(),
                budget.getEndDate(),
                budgetPeriod.getPeriod(),
                categorySpendingList,
                categoryDesignators
        );
        categoryBudgets.forEach(categoryPeriod -> {
            LOGGER.info("Category Period: " + categoryPeriod.toString());
        });
        // 4. Build final transaction categories
        return buildTransactionCategoryList(categoryBudgets, budget);
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

    public List<CategoryPeriodSpending> getCategorySpendingByCategoryDesignator(final List<CategoryTransactions> categoryDesignators, final List<DateRange> budgetDateRanges)
    {
        List<CategoryPeriodSpending> categorySpendingList = new ArrayList<>();
        for(CategoryTransactions categoryTransaction : categoryDesignators)
        {
            String categoryId = categoryTransaction.getCategoryId();
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

                if(totalSpending.compareTo(BigDecimal.ZERO) > 0) {
                    CategoryPeriodSpending categoryPeriodSpending = new CategoryPeriodSpending(categoryId, categoryName, totalSpending, budgetWeek);
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
    public List<TransactionCategory> buildTransactionCategoryList(final List<CategoryBudget> categoryBudgets, final Budget budget)
    {
        if(categoryBudgets == null || budget == null)
        {
            return Collections.emptyList();
        }
        Set<CategoryBudget> categoryBudgetSet = new LinkedHashSet<>(categoryBudgets);
        Set<TransactionCategory> transactionCategories = new HashSet<>();
        for(CategoryBudget categoryBudget : categoryBudgetSet)
        {
            if(categoryBudget == null)
            {
                continue;
            }
            List<DateRange> categoryDateRanges = categoryBudget.getCategoryDateRanges();
            List<Transaction> transactions = categoryBudget.getCategoryTransactions();
            if(transactions.isEmpty())
            {
                return Collections.emptyList();
            }
            for(DateRange categoryDateRange : categoryDateRanges)
            {
                validateDateRange(categoryDateRange);
                List<Transaction> periodTransactions = transactions.stream()
                        .filter(t -> !t.getDate().isBefore(categoryDateRange.getStartDate()) &&
                                !t.getDate().isAfter(categoryDateRange.getEndDate()))
                        .distinct()
                        .collect(Collectors.toList());

                Double budgetedAmount = categoryBudget.getBudgetAmount(categoryDateRange);
                Double budgetActualAmount = categoryBudget.getActualAmount(categoryDateRange);
                if(!periodTransactions.isEmpty() || budgetedAmount > 0 || budgetActualAmount > 0)
                {
                    String categoryName = categoryBudget.getCategory();
                    String categoryId = categoryBudget.getCategoryId();
                    Double budgetOverSpendingAmount = getBudgetOverSpending(budgetActualAmount, budgetedAmount);
                    boolean isOverSpentOnBudget = isBudgetOverSpending(budgetOverSpendingAmount);

                    TransactionCategory transactionCategory = createTransactionCategory(
                            categoryId,
                            categoryName,
                            categoryDateRange,
                            periodTransactions,
                            budgetActualAmount,
                            budgetedAmount,
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


    //TODO: Retest this method
    public List<CategoryBudget> createCategoryBudgets(final Budget budget, final LocalDate budgetStartDate, final LocalDate budgetEndDate, final Period period, final List<CategoryPeriodSpending> categoryPeriodSpendingList, final List<CategoryTransactions> categoryTransactionsList)
    {
        if(budgetStartDate == null || budgetEndDate == null)
        {
            return new ArrayList<>();
        }
        List<CategoryBudget> categoryPeriods = new ArrayList<>();
        for(CategoryTransactions categoryTransaction : categoryTransactionsList)
        {
            String category = categoryTransaction.getCategoryName();
            String categoryId = categoryTransaction.getCategoryId();
            // Obtain the transactions
            List<Transaction> transactions = categoryTransaction.getTransactions().stream()
                    .sorted(Comparator.comparing(Transaction::getPosted))
                    .collect(Collectors.toList());
            // Build the Budget Date Ranges
            List<DateRange> budgetDateRanges = buildBudgetDateRanges(budgetStartDate, budgetEndDate, period);
            // Determine the Category Period Date Ranges
            int categorySpendingIndex = 0;
            while(categorySpendingIndex < categoryPeriodSpendingList.size()) {
                CategoryPeriodSpending categorySpending = categoryPeriodSpendingList.get(categorySpendingIndex);
                if(categorySpending.getCategoryId().equals(categoryId) &&
                        categorySpending.getCategoryName().equals(categoryTransaction.getCategoryName())) {
                    List<DateRange> categoryPeriodDateRanges = buildCategoryPeriodDateRanges(budgetDateRanges, categoryPeriodSpendingList);
                    BigDecimal totalSpendingOnAllCategories = budgetCalculator.getTotalSpendingOnAllCategories(categoryPeriodSpendingList);
                    LOGGER.info("Total Spending on All Categories: {}", totalSpendingOnAllCategories);
                    LOGGER.info("Category Spending: {}", categorySpending.toString());
                    categoryPeriodDateRanges.forEach(transactionDateRange -> {
                        LOGGER.info("Transaction Date Range: {}", transactionDateRange.toString());
                    });
                    List<BudgetPeriodAmount> categoryBudgetedAmounts = budgetCalculator.calculateBudgetedAmountForCategoryDateRange(
                            categorySpending, totalSpendingOnAllCategories, categoryPeriodDateRanges, budget);
                    List<BudgetPeriodAmount> actualSpentOnCategories = budgetCalculator.calculateActualAmountForCategoryDateRange(
                            categorySpending, categoryTransaction, categoryPeriodDateRanges, budget);

                    CategoryBudget categoryBudget = CategoryBudget.buildCategoryBudget(
                            categoryBudgetedAmounts,
                            actualSpentOnCategories,
                            categoryPeriodDateRanges,
                            budget,
                            transactions,
                            category
                    );
                    categoryPeriods.add(categoryBudget);
                }
                categorySpendingIndex++;
            }
        }
        return categoryPeriods;
    }

    public List<DateRange> buildCategoryPeriodDateRanges(final List<DateRange> budgetDateRanges, final List<CategoryPeriodSpending> categorySpendingList)
    {
        if(budgetDateRanges.isEmpty() || categorySpendingList.isEmpty())
        {
            return Collections.emptyList();
        }
        Set<DateRange> uniqueCategoryDateRanges = new HashSet<>();
        for(CategoryPeriodSpending categorySpending : categorySpendingList) {
            LOGGER.info("Category: {}", categorySpending.getCategoryName());
            LOGGER.info("Category Spending: {}", categorySpending.toString());
            LOGGER.info("Category Week: {}", categorySpending.getDateRange().toString());
            for(DateRange budgetWeek : budgetDateRanges) {
                if(datesOverlap(budgetWeek, categorySpending.getDateRange())){
                    uniqueCategoryDateRanges.add(budgetWeek);
                }
            }
        }
        uniqueCategoryDateRanges.forEach(dateRange -> {
            LOGGER.info("Category Date Range: {}", dateRange.toString());
        });

        return new ArrayList<>(uniqueCategoryDateRanges);
    }

    private boolean datesOverlap(DateRange range1, DateRange range2) {
        return !range1.getEndDate().isBefore(range2.getStartDate()) &&
                !range2.getEndDate().isBefore(range1.getStartDate());
    }

//    private List<CategoryBudget> createCategoryPeriodsForDateRanges(
//            List<Transaction> transactions,
//            List<DateRange> transactionDateRanges,
//            List<BudgetPeriodAmount> categoryBudgetedAmounts,
//            List<BudgetPeriodAmount> actualSpentOnCategories,
//            Budget budget,
//            String category) {
//
//        List<CategoryBudget> periods = new ArrayList<>();
//        for (DateRange dateRange : transactionDateRanges) {
//            List<Transaction> periodTransactions = transactions.stream()
//                    .filter(transaction ->
//                            (transaction.getPosted().isEqual(dateRange.getStartDate()) ||
//                                    transaction.getPosted().isAfter(dateRange.getStartDate())) &&
//                                    (transaction.getPosted().isBefore(dateRange.getEndDate()) ||
//                                            transaction.getPosted().isEqual(dateRange.getEndDate()))
//                    )
//                    .collect(Collectors.toList());
//
//            // Filter budget amounts for this period
//            List<BudgetPeriodAmount> periodBudgetAmounts = categoryBudgetedAmounts.stream()
//                    .filter(amount -> amount.getDateRange().getStartDate().equals(dateRange.getStartDate()))
//                    .collect(Collectors.toList());
//
//            // Filter actual amounts for this period
//            List<BudgetPeriodAmount> periodActualAmounts = actualSpentOnCategories.stream()
//                    .filter(amount -> amount.getDateRange().getStartDate().equals(dateRange.getStartDate()))
//                    .collect(Collectors.toList());
//
//            CategoryBudget categoryPeriod = buildCategoryBudget(
//                    buildCategoryPeriodCriteria(
//                            List.of(dateRange),
//                            periodBudgetAmounts,
//                            periodActualAmounts
//                    ),
//                    budget,
//                    periodTransactions,
//                    category
//            );
//            periods.add(categoryPeriod);
//        }
//        return periods;
//    }

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
