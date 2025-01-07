package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionCategoryEntity;
import com.app.budgetbuddy.exceptions.CategoryNotFoundException;
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
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Component
@Slf4j
public class TransactionCategoryBuilder
{
    private TransactionCategoryService transactionCategoryService;
    private CategoryService categoryService;
    private BudgetCalculations budgetCalculator;
    private CategoryRuleEngine categoryRuleEngine;
    private TransactionCategoryConverter transactionCategoryConverter;
    private Logger LOGGER = LoggerFactory.getLogger(TransactionCategoryBuilder.class);

    @Autowired
    public TransactionCategoryBuilder(TransactionCategoryService transactionCategoryService,
                                 CategoryService categoryService,
                                 BudgetCalculations budgetCalculator,
                                 CategoryRuleEngine categoryRuleEngine,
                                 TransactionCategoryConverter transactionCategoryConverter)
    {
        this.transactionCategoryService = transactionCategoryService;
        this.categoryService = categoryService;
        this.budgetCalculator = budgetCalculator;
        this.transactionCategoryConverter = transactionCategoryConverter;
        this.categoryRuleEngine = categoryRuleEngine;
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

    // Maps the User
    public List<TransactionCategory> initializeTransactionCategories(final Budget budget, final BudgetPeriod budgetPeriod, final List<CategoryDesignator> categoryDesignators)
    {
//        if(budget == null || budgetPeriod == null || categoryDesignators == null || categoryDesignators.isEmpty()){
//            return Collections.emptyList();
//        }
//        // 1. Get categorized transactions from CategoryRuleEngine
//        Map<String, List<String>> categorizedTransactions = categoryRuleEngine.finalizeUserTransactionCategoriesForDateRange(
//                categoryDesignators.stream()
//                        .flatMap(cd -> cd.getTransactions().stream())
//                        .collect(Collectors.toList()),
//                budget.getUserId(),
//                new DateRange(budget.getStartDate(), budget.getEndDate())
//        );
//
//        categoryDesignators.forEach((categoryDesignator -> {
//            LOGGER.info("Category Designator: " + categoryDesignator.toString());
//        }));
//
//        // 2. Update CategoryDesignators with categorized transactions
//        List<CategoryDesignator> updatedDesignators = new ArrayList<>();
//        categorizedTransactions.forEach((category, transactionIds) -> {
//            CategoryDesignator designator = new CategoryDesignator(category, category);
//            // Get transactions that match the category's transaction IDs
//            List<Transaction> categoryTransactions = categoryDesignators.stream()
//                    .flatMap(cd -> cd.getTransactions().stream())
//                    .filter(t -> transactionIds.contains(t.getTransactionId()))
//                    .collect(Collectors.toList());
//            designator.setTransactions(categoryTransactions);
//            updatedDesignators.add(designator);
//        });
//
//        // 3. Create CategoryPeriods with properly categorized transactions
//        Long budgetId = budget.getId();
//        Set<CategoryPeriod> categoryPeriods = createCategoryPeriods(
//                budgetId,
//                budget.getStartDate(),
//                budget.getEndDate(),
//                budgetPeriod.getPeriod(),
//                updatedDesignators
//        );
//
//        // 4. Build final transaction categories
//        return buildTransactionCategoryList(categoryPeriods, budget);
        return null;
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
//
//        List<TransactionCategory> transactionCategories = new ArrayList<>();
//
//        for (CategoryPeriod categoryPeriod : categoryPeriods) {
//            for (DateRange dateRange : categoryPeriod.getDateRanges()) {
//                Double budgetedAmount = categoryPeriod.getCategoryBudgetAmount().get(dateRange);
//                Double actualAmount = categoryPeriod.getCategoryActualAmount().get(dateRange);
//
//                TransactionCategory transactionCategory = new TransactionCategory();
//                transactionCategory.setCategoryName(categoryPeriod.getCategory());
//                transactionCategory.setStartDate(dateRange.getStartDate());
//                transactionCategory.setEndDate(dateRange.getEndDate());
//                transactionCategory.setBudgetedAmount(budgetedAmount);
//                transactionCategory.setBudgetActual(actualAmount);
//                transactionCategory.setBudgetId(budget.getId());
//                transactionCategory.setIsActive(categoryPeriod.getIsActive());
//
//                // Add transaction IDs from transactions in this date range
//                List<String> transactionIds = categoryPeriod.getTransactions().stream()
//                        .filter(t -> isTransactionInDateRange(t, dateRange))
//                        .map(Transaction::getTransactionId)
//                        .collect(Collectors.toList());
//                transactionCategory.setTransactionIds(transactionIds);
//
//
//                // Handle overspending
//                if (actualAmount > budgetedAmount) {
//                    transactionCategory.setOverSpent(true);
//                    transactionCategory.setOverSpendingAmount(actualAmount - budgetedAmount);
//                } else {
//                    transactionCategory.setOverSpent(false);
//                    transactionCategory.setOverSpendingAmount(0.0);
//                }
//
//                transactionCategories.add(transactionCategory);
//            }
//        }
//
//        return transactionCategories;
        return null;
    }

    private TransactionCategory createTransactionCategory(Long userId, Double budgetedAmount, Double budgetActual, String category, String categoryId, LocalDate startDate, LocalDate endDate){
        TransactionCategory userBudgetCategory = new TransactionCategory();
        userBudgetCategory.setBudgetId(userId);
        userBudgetCategory.setBudgetedAmount(Double.valueOf(budgetedAmount.toString()));
        userBudgetCategory.setIsActive(true);
        userBudgetCategory.setCategoryName(category);
        userBudgetCategory.setBudgetActual(budgetActual);
        userBudgetCategory.setCategoryId(categoryId);
        userBudgetCategory.setStartDate(startDate);
        userBudgetCategory.setEndDate(endDate);
        return userBudgetCategory;
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
        for (CategoryDesignator categoryDesignator : categoryDesignators)
        {
            String category = categoryDesignator.getCategoryName();
            String categoryId = categoryDesignator.getCategoryId();
            // Obtain the transactions
            List<Transaction> transactions = categoryDesignator.getTransactions();
            List<DateRange> transactionDateRanges = buildTransactionDateRanges(transactions, budgetStartDate, budgetEndDate, period);
            CategorySpending categorySpending = categorySpendingData.stream()
                    .filter(spending -> spending.getCategoryId().equals(categoryId) && spending.getCategoryName().equals(categoryDesignator.getCategoryName()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Category does not exist"));
            BigDecimal totalSpendingOnAllCategories = budgetCalculator.getTotalSpendingOnAllCategories(categorySpendingData);
            List<BudgetPeriodAmount> categoryBudgetedAmounts = budgetCalculator.calculateBudgetedAmountForCategoryDateRange(categorySpending, totalSpendingOnAllCategories, transactionDateRanges, budget);
            List<BudgetPeriodAmount> actualSpentOnCategories = budgetCalculator.calculateActualAmountForCategoryDateRange(categorySpending, categoryDesignator, transactionDateRanges, budget);
            CategoryPeriodCriteria categoryPeriodCriteria = buildCategoryPeriodCriteria(transactionDateRanges, categoryBudgetedAmounts, actualSpentOnCategories);
            CategoryPeriod categoryPeriod = buildCategoryPeriod(categoryPeriodCriteria, budget, transactions, category);
            categoryPeriods.add(categoryPeriod);
        }
        return categoryPeriods;
    }

    private double getActualTransactionAmountSum(final List<Transaction> transactions, final DateRange dateRange)
    {
        return transactions.stream()
                .filter(t -> isTransactionInDateRange(t, dateRange))
                .mapToDouble(t -> t.getAmount().doubleValue())
                .sum();
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

    private List<DateRange> buildTransactionDateRanges(List<? extends Transaction> transactions, LocalDate budgetStart, LocalDate budgetEnd, Period period){
            // First get all possible date ranges for the budget period
            List<DateRange> budgetDateRanges = buildBudgetDateRanges(budgetStart, budgetEnd, period);

            // Filter to only keep date ranges that contain transactions
            return budgetDateRanges.stream()
                    .filter(dateRange ->
                            transactions.stream()
                                    .anyMatch(transaction ->
                                            isTransactionInDateRange(transaction, dateRange)))
                    .collect(Collectors.toList());
    }

    private boolean isTransactionInDateRange(Transaction transaction, DateRange dateRange) {
        LocalDate transactionDate = transaction.getPosted();
        return !transactionDate.isBefore(dateRange.getStartDate()) &&
                !transactionDate.isAfter(dateRange.getEndDate());
    }

    private LocalDate incrementCurrentStartByPeriod(LocalDate currentStart, Period period)
    {
        switch(period)
        {
            case WEEKLY:
                return currentStart.plusDays(7);
            case BIWEEKLY:
                return currentStart.plusDays(14);
            case MONTHLY:
                return currentStart.withDayOfMonth(currentStart.lengthOfMonth());
            case DAILY:
                return currentStart.plusDays(1);
            default:
                throw new IllegalArgumentException("Invalid Period: " + period);
        }
    }

}
