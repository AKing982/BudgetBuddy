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


    public List<TransactionCategory> updateTransactionCategories(final Set<CategoryPeriod> categoryPeriods, final List<TransactionCategory> existingTransactionCategories)
    {
        if(categoryPeriods == null || existingTransactionCategories == null){
            return Collections.emptyList();
        }

        List<TransactionCategory> allTransactionCategories = new ArrayList<>();
        if(existingTransactionCategories != null){
            allTransactionCategories.addAll(existingTransactionCategories);
        }

        log.info("Updating transaction categories. CategoryPeriods size: {}, ExistingTransactionCategories size: {}",
                categoryPeriods != null ? categoryPeriods.size() : "null",
                existingTransactionCategories != null ? existingTransactionCategories.size() : "null");

        for (CategoryPeriod categoryPeriod : categoryPeriods) {
            for (DateRange dateRange : categoryPeriod.getDateRanges()) {
                // Try to find matching existing category
                Optional<TransactionCategory> existingCategory = existingTransactionCategories.stream()
                        .filter(tc -> tc.getCategoryName().equals(categoryPeriod.getCategory()) &&
                                tc.getStartDate().equals(dateRange.getStartDate()) &&
                                tc.getEndDate().equals(dateRange.getEndDate()))
                        .findFirst();

                if (existingCategory.isPresent()) {
                    // Update existing category
                    TransactionCategory category = existingCategory.get();
                    Double newActualAmount = categoryPeriod.getCategoryActualAmount().get(dateRange);

                    // Create new modifiable list for transaction IDs
                    List<String> updatedTransactionIds = new ArrayList<>();
                    if(category.getTransactionIds() != null){
                        updatedTransactionIds.addAll(category.getTransactionIds());
                    }
                    categoryPeriod.getTransactions().forEach(transaction ->
                            updatedTransactionIds.add(transaction.getTransactionId()));
                    category.setTransactionIds(updatedTransactionIds);

                    // Update actual spending
                    category.setBudgetActual(category.getBudgetActual() + newActualAmount);

                    // Check overspending
                    if (category.getBudgetActual() > category.getBudgetedAmount()) {
                        category.setOverSpent(true);
                        category.setOverSpendingAmount(
                                category.getBudgetActual() - category.getBudgetedAmount());
                    }
                } else {
                    // Create new category
                    Double categoryActualSpending = categoryPeriod.getCategoryActualAmount().get(dateRange);
                    Double categoryBudgetedAmount = categoryPeriod.getCategoryBudgetAmount().get(dateRange);
                    Long categoryBudgetId = categoryPeriod.getBudgetId();

                    TransactionCategory newCategory = new TransactionCategory();
                    newCategory.setCategoryName(categoryPeriod.getCategory());
                    newCategory.setStartDate(dateRange.getStartDate());
                    newCategory.setEndDate(dateRange.getEndDate());
                    newCategory.setBudgetActual(categoryActualSpending);
                    newCategory.setBudgetedAmount(categoryBudgetedAmount);
                    newCategory.setOverSpendingAmount(0.0);
                    newCategory.setOverSpent(false);
                    newCategory.setIsActive(categoryPeriod.getIsActive());
                    newCategory.setBudgetId(categoryBudgetId);

                    // Set transaction IDs with modifiable list
                    List<String> transactionIds = new ArrayList<>(
                            categoryPeriod.getTransactions().stream()
                                    .map(Transaction::getTransactionId)
                                    .collect(Collectors.toList())
                    );
                    newCategory.setTransactionIds(transactionIds);

                    allTransactionCategories.add(newCategory);
                }
            }
        }

        return allTransactionCategories;
    }


    private TransactionCategory createTransactionCategory(
            String categoryName,
            DateRange dateRange,
            List<Transaction> transactions) {

        List<String> transactionIds = transactions.stream()
                .map(Transaction::getTransactionId)
                .collect(Collectors.toList());

        double actualAmount = transactions.stream()
                .map(t -> t.getAmount().doubleValue())
                .reduce(0.0, Double::sum);

        TransactionCategory newCategory = new TransactionCategory();
        newCategory.setCategoryName(categoryName);
        newCategory.setStartDate(dateRange.getStartDate());
        newCategory.setEndDate(dateRange.getEndDate());
        newCategory.setTransactionIds(transactionIds);
        newCategory.setIsActive(true);
        newCategory.setBudgetActual(actualAmount);
        newCategory.setOverSpent(false);
        newCategory.setOverSpendingAmount(0.0);

        return newCategory;
    }

    // Maps the User
    public List<TransactionCategory> initializeTransactionCategories(final Budget budget, final BudgetPeriod budgetPeriod, final List<CategoryDesignator> categoryDesignators)
    {
        if(budget == null || budgetPeriod == null || categoryDesignators == null || categoryDesignators.isEmpty()){
            return Collections.emptyList();
        }
        // 1. Get categorized transactions from CategoryRuleEngine
        Map<String, List<String>> categorizedTransactions = categoryRuleEngine.finalizeUserTransactionCategoriesForDateRange(
                categoryDesignators.stream()
                        .flatMap(cd -> cd.getTransactions().stream())
                        .collect(Collectors.toList()),
                budget.getUserId(),
                new DateRange(budget.getStartDate(), budget.getEndDate())
        );

        categoryDesignators.forEach((categoryDesignator -> {
            LOGGER.info("Category Designator: " + categoryDesignator.toString());
        }));

        // 2. Update CategoryDesignators with categorized transactions
        List<CategoryDesignator> updatedDesignators = new ArrayList<>();
        categorizedTransactions.forEach((category, transactionIds) -> {
            CategoryDesignator designator = new CategoryDesignator(category, category);
            // Get transactions that match the category's transaction IDs
            List<Transaction> categoryTransactions = categoryDesignators.stream()
                    .flatMap(cd -> cd.getTransactions().stream())
                    .filter(t -> transactionIds.contains(t.getTransactionId()))
                    .collect(Collectors.toList());
            designator.setTransactions(categoryTransactions);
            updatedDesignators.add(designator);
        });

        // 3. Create CategoryPeriods with properly categorized transactions
        Long budgetId = budget.getId();
        Set<CategoryPeriod> categoryPeriods = createCategoryPeriods(
                budgetId,
                budget.getStartDate(),
                budget.getEndDate(),
                budgetPeriod.getPeriod(),
                updatedDesignators
        );

        // 4. Build final transaction categories
        return buildTransactionCategoryList(categoryPeriods, budget);
    }

    //TODO: Re
    public List<TransactionCategory> buildTransactionCategoryList(final Set<CategoryPeriod> categoryPeriods, final Budget budget)
    {
        if(categoryPeriods == null || budget == null){
            return Collections.emptyList();
        }

        List<TransactionCategory> transactionCategories = new ArrayList<>();

        for (CategoryPeriod categoryPeriod : categoryPeriods) {
            for (DateRange dateRange : categoryPeriod.getDateRanges()) {
                Double budgetedAmount = categoryPeriod.getCategoryBudgetAmount().get(dateRange);
                Double actualAmount = categoryPeriod.getCategoryActualAmount().get(dateRange);

                TransactionCategory transactionCategory = new TransactionCategory();
                transactionCategory.setCategoryName(categoryPeriod.getCategory());
                transactionCategory.setStartDate(dateRange.getStartDate());
                transactionCategory.setEndDate(dateRange.getEndDate());
                transactionCategory.setBudgetedAmount(budgetedAmount);
                transactionCategory.setBudgetActual(actualAmount);
                transactionCategory.setBudgetId(budget.getId());
                transactionCategory.setIsActive(categoryPeriod.getIsActive());

                // Add transaction IDs from transactions in this date range
                List<String> transactionIds = categoryPeriod.getTransactions().stream()
                        .filter(t -> isTransactionInDateRange(t, dateRange))
                        .map(Transaction::getTransactionId)
                        .collect(Collectors.toList());
                transactionCategory.setTransactionIds(transactionIds);


                // Handle overspending
                if (actualAmount > budgetedAmount) {
                    transactionCategory.setOverSpent(true);
                    transactionCategory.setOverSpendingAmount(actualAmount - budgetedAmount);
                } else {
                    transactionCategory.setOverSpent(false);
                    transactionCategory.setOverSpendingAmount(0.0);
                }

                transactionCategories.add(transactionCategory);
            }
        }

        return transactionCategories;
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


    //TODO: Retest this method
    public Set<CategoryPeriod> createCategoryPeriods(final Long budgetId, final LocalDate budgetStartDate, final LocalDate budgetEndDate, final Period period, final List<CategoryDesignator> categoryDesignators) {
        if (budgetStartDate == null || budgetEndDate == null) {
            return new HashSet<>();
        }

        Set<CategoryPeriod> categoryPeriods = new HashSet<>();
        LOGGER.info("Budget StartDate: " + budgetStartDate);
        LOGGER.info("Budget EndDate: " + budgetEndDate);

        for (CategoryDesignator categoryDesignator : categoryDesignators) {
            List<DateRange> dateRanges = buildTransactionDateRanges(
                    categoryDesignator.getTransactions(),
                    budgetStartDate,
                    budgetEndDate,
                    period
            );

            if (!dateRanges.isEmpty()) {
                CategoryPeriod categoryPeriod = new CategoryPeriod(
                        categoryDesignator.getCategoryName(),
                        dateRanges,
                        budgetId,
                        true
                );

                // Set transactions
                categoryPeriod.setTransactions(categoryDesignator.getTransactions());

                // Initialize budget and actual amount maps
                for (DateRange dateRange : dateRanges) {
                    // Calculate actual spending for this date range
                    double actualAmount = categoryDesignator.getTransactions().stream()
                            .filter(t -> isTransactionInDateRange(t, dateRange))
                            .mapToDouble(t -> t.getAmount().doubleValue())
                            .sum();

                    categoryPeriod.setCategoryActualAmountForDateRange(dateRange, actualAmount);

                    // Set initial budget amount (this might need to come from somewhere else)
                    categoryPeriod.setBudgetForDateRange(dateRange, 0.0); // Set default or calculate from budget rules
                }

                categoryPeriods.add(categoryPeriod);
            }
        }

        return categoryPeriods;
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

        // Calculate number of complete periods
        long numberOfPeriods;
        switch(period) {
            case WEEKLY:
                numberOfPeriods = ChronoUnit.WEEKS.between(budgetStart, budgetEnd) + 1;
                break;
            case BIWEEKLY:
                numberOfPeriods = (ChronoUnit.WEEKS.between(budgetStart, budgetEnd) / 2) + 1;
                break;
            case MONTHLY:
                numberOfPeriods = ChronoUnit.MONTHS.between(budgetStart, budgetEnd) + 1;
                break;
            case DAILY:
                numberOfPeriods = ChronoUnit.DAYS.between(budgetStart, budgetEnd) + 1;
                break;
            default:
                throw new IllegalArgumentException("Invalid period: " + period);
        }

        for(int i = 0; i < numberOfPeriods; i++) {
            LocalDate periodStart = (i == 0) ? budgetStart : dateRanges.get(i-1).getEndDate();
            LocalDate nextPeriodEnd = incrementCurrentStartByPeriod(periodStart, period);
            LocalDate adjustedEndDate = nextPeriodEnd.isAfter(budgetEnd) ? budgetEnd : nextPeriodEnd;

            DateRange dateRange = new DateRange(periodStart, adjustedEndDate);
            dateRanges.add(dateRange);
            LOGGER.info("DateRange: Start = {}, End = {}", periodStart, adjustedEndDate);

            if(adjustedEndDate.equals(budgetEnd)) {
                break;
            }
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
