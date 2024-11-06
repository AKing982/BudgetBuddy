package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.entities.UserBudgetCategoryEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.UserBudgetCategoryService;
import com.app.budgetbuddy.workbench.categories.CategoryRuleService;
import com.app.budgetbuddy.workbench.converter.UserBudgetCategoryConverter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Component
public class BudgetCategoryBuilder
{
    private UserBudgetCategoryService userBudgetCategoryService;
    private CategoryRuleService categoryRuleService;
    private CategoryService categoryService;
    private BudgetCalculator budgetCalculator;
    private UserBudgetCategoryConverter userBudgetCategoryConverter;
    private Logger LOGGER = LoggerFactory.getLogger(BudgetCategoryBuilder.class);

    @Autowired
    public BudgetCategoryBuilder(UserBudgetCategoryService userBudgetCategoryService,
                                 CategoryRuleService categoryRuleService,
                                 CategoryService categoryService,
                                 BudgetCalculator budgetCalculator,
                                 UserBudgetCategoryConverter userBudgetCategoryConverter)
    {
        this.userBudgetCategoryService = userBudgetCategoryService;
        this.categoryRuleService = categoryRuleService;
        this.categoryService = categoryService;
        this.budgetCalculator = budgetCalculator;
        this.userBudgetCategoryConverter = userBudgetCategoryConverter;
    }

    public Category updateCategoryOnNewTransaction(Transaction transaction)
    {
        return null;
    }

    public boolean storeCategoriesInDatabase(Set<UserBudgetCategoryEntity> userBudgetCategories)
    {
        return false;
    }

    public List<String> fetchCategoryIdByName(String categoryName)
    {
        List<String> categoryList = new ArrayList<>();
        if(categoryName.isEmpty())
        {
            return categoryList;
        }
        return categoryService.getCategoryIdByName(categoryName);
    }

    public CategoryEntity fetchCategoryByNameOrDescription(String categoryName, String categoryDescription)
    {
        if(categoryName == null || categoryDescription == null)
        {
            throw new IllegalArgumentException("Category name or description cannot be null");
        }
        return categoryService.getCategoryByNameOrDescription(categoryDescription, categoryName)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));
    }

    public BigDecimal getCategoryRemainingAmount(final CategoryBudget categoryBudget)
    {
        Double categoryBudgetAmount = categoryBudget.getCategoryBudgetAmount();
        Double categoryActualAmount = categoryBudget.getCategorySpentAmount();
        return BigDecimal.valueOf(categoryBudgetAmount - categoryActualAmount);
    }

    private List<String> getCategoriesFromTransactions(final List<Transaction> transactions)
    {
        List<String> categoriesList = new ArrayList<>();
        if(transactions.isEmpty())
        {
            return categoriesList;
        }
        return transactions.stream()
                .filter(transaction -> transaction.categories() != null)
                .flatMap(transaction -> transaction.categories().stream())
                .distinct()  // Optional: remove duplicates if you want only unique categories
                .toList();
    }

    public List<CategorySpending> createCategorySpendingList(final List<String> categories, final List<Transaction> transactions)
    {
        List<CategorySpending> categorySpendingList = new ArrayList<>();
        if(categories.isEmpty() || transactions.isEmpty())
        {
            return categorySpendingList;
        }
        for (String category : categories)
        {
            BigDecimal categorySpending = BigDecimal.ZERO;
            List<String> categoryList = fetchCategoryIdByName(category);
            String categoryId = categoryList.get(0);// Reset for each category
            for (Transaction transaction : transactions)
            {
                if (transaction.categories() != null && transaction.categories().contains(category))
                {
                    categorySpending = categorySpending.add(transaction.amount());
                }
            }
            // Add one CategorySpending object for each category
            categorySpendingList.add(new CategorySpending(categoryId, category, categorySpending));
        }
        return categorySpendingList;
    }

    public BigDecimal getSpendingOnAllCategories(final List<CategorySpending> categorySpendingList)
    {
        BigDecimal categorySpendingAmount = BigDecimal.ZERO;
        for(CategorySpending categorySpending : categorySpendingList)
        {
            BigDecimal actualSpending = categorySpending.getActualSpending();
            categorySpendingAmount = categorySpendingAmount.add(actualSpending);
        }
        return categorySpendingAmount;
    }

    // Maps the User
    public List<UserBudgetCategory> initializeUserBudgetCategories(final Budget budget, final BudgetPeriod budgetPeriod, final List<Transaction> transactions)
    {
        List<UserBudgetCategory> userBudgetCategories = new ArrayList<>();
        if(budget == null || budgetPeriod == null || transactions.isEmpty())
        {
            return userBudgetCategories;
        }

        // 1. First determine the categories from the transactions
        List<String> categories = getCategoriesFromTransactions(transactions);

        // 2. Once categories have been determined, start determine the date periods for the categories
        Map<String, List<DateRange>> categoryDateRanges = new HashMap<>();
        for(String category : categories)
        {
            LocalDate budgetStartDate = budget.getStartDate();
            LocalDate budgetEndDate = budget.getEndDate();
            Period period = budgetPeriod.period();
            categoryDateRanges = createCategoryPeriods(category, budgetStartDate, budgetEndDate, period, transactions);
        }

        // 3. Calculate/Create the category to budget map
        List<CategorySpending> categorySpendingList = createCategorySpendingList(categories, transactions);
        BigDecimal totalSpendingOnAllCategories = getSpendingOnAllCategories(categorySpendingList);
        Map<String, BigDecimal> categoryToBudgetMap = budgetCalculator.createCategoryToBudgetMap(categorySpendingList, budget, totalSpendingOnAllCategories, budgetPeriod);
        return buildUserBudgetCategoryList(categoryToBudgetMap, categorySpendingList, categoryDateRanges, budget.getUserId());
    }

    private List<UserBudgetCategory> buildUserBudgetCategoryList(final Map<String, BigDecimal> categoryBudget, final List<CategorySpending> categorySpendingList, final Map<String, List<DateRange>> categoryDateRanges, Long userId)
    {
        List<UserBudgetCategory> userBudgetCategories = new ArrayList<>();
        for(CategorySpending categorySpending : categorySpendingList)
        {
            for(String category : categoryBudget.keySet())
            {
                if(categorySpending.getCategoryName().equals(category))
                {
                    BigDecimal categoryBudgetAmount = categoryBudget.get(category);
                    List<DateRange> dateRanges = categoryDateRanges.get(category);
                    for(DateRange dateRange : dateRanges){
                        UserBudgetCategory userBudgetCategory = new UserBudgetCategory();
                        userBudgetCategory.setUserId(userId);
                        userBudgetCategory.setBudgetedAmount(Double.valueOf(categoryBudgetAmount.toString()));
                        userBudgetCategory.setIsActive(true);
                        userBudgetCategory.setCategoryId(categorySpending.getCategoryId());
                        userBudgetCategory.setStartDate(dateRange.getStartDate());
                        userBudgetCategory.setEndDate(dateRange.getEndDate());
                        userBudgetCategories.add(userBudgetCategory);
                    }
                }
            }
        }
        return userBudgetCategories;
    }


    public Category assignTransactionToCategoryByRule(CategoryRule categoryRule, Long userId)
    {
        return null;
    }

    public TransactionLink linkTransactionToCategory(Transaction transaction, Category category)
    {
        return null;
    }

    public Map<String, List<DateRange>> createCategoryPeriods(final String categoryName, final LocalDate budgetStartDate, final LocalDate budgetEndDate, final Period period, final List<Transaction> transactions)
    {
        Map<String, List<DateRange>> categoryPeriods = new HashMap<>();
        if(budgetStartDate == null || budgetEndDate == null)
        {
            throw new IllegalArgumentException("budgetStartDate or budgetEndDate cannot be null");
        }
        if(transactions.isEmpty())
        {
            return new HashMap<>();
        }

        List<Transaction> transactionsByCategory = transactions.stream()
                .filter(transaction -> transaction.categories() != null && transaction.categories().contains(categoryName))
                .filter(transaction -> !transaction.posted().isBefore(budgetStartDate) && !transaction.posted().isAfter(budgetEndDate))
                .toList();

        List<DateRange> dateRanges = buildDateRanges(budgetStartDate, budgetEndDate, period, transactionsByCategory);
        categoryPeriods.put(categoryName, dateRanges);

        LOGGER.info("Transactions Filtered By Category: {}: {}", categoryName, transactionsByCategory);

        LOGGER.info("Category Periods: " + categoryPeriods);
        return categoryPeriods;
    }

    private List<Transaction> filterTransactionsByDate(LocalDate startDate, LocalDate endDate, List<Transaction> transactions)
    {
        return transactions.stream()
                .filter(transaction -> !transaction.posted().isBefore(startDate) && !transaction.posted().isAfter(endDate))
                .toList();
    }

    private List<DateRange> buildDateRanges(final LocalDate budgetStart, final LocalDate budgetEnd, final Period period, final List<Transaction> filteredTransactions){
        List<DateRange> dateRanges = new ArrayList<>();
        LocalDate currentStart = budgetStart;
        LOGGER.info("Budget StartDate: " + budgetStart);
        LOGGER.info("Budget EndDate: " + budgetEnd);

        if(period == Period.MONTHLY)
        {
            // Set `currentEnd` to the last day of the month from `currentStart`, or `budgetEnd` if it falls earlier.
            LocalDate currentEnd = budgetEnd.isBefore(currentStart.withDayOfMonth(currentStart.lengthOfMonth()))
                    ? budgetEnd
                    : currentStart.withDayOfMonth(currentStart.lengthOfMonth());

            List<Transaction> transactions = filterTransactionsByDate(currentStart, currentEnd, filteredTransactions);

            if (!transactions.isEmpty()) {
                DateRange dateRange = new DateRange(currentStart, currentEnd);
                dateRanges.add(dateRange);
                LOGGER.info("Monthly DateRange: Start = {}, End = {}", dateRange.getStartDate(), dateRange.getEndDate());
            }
        }
        else
        {
            while(!currentStart.isAfter(budgetEnd))
            {
                LocalDate currentEnd = incrementCurrentStartByPeriod(currentStart, period);
                if(currentEnd.isAfter(budgetEnd)){
                    break;
                }

                DateRange partialWeekRange = new DateRange(currentEnd, budgetEnd);
                long numDaysBetweenBudgetEndDateAndCurrentEnd = partialWeekRange.getDaysInRange();
                if (numDaysBetweenBudgetEndDateAndCurrentEnd >= 1 && numDaysBetweenBudgetEndDateAndCurrentEnd < 7)
                {
                    if(currentEnd.isBefore(budgetEnd))
                    {
                        currentEnd = currentEnd.plusDays(numDaysBetweenBudgetEndDateAndCurrentEnd - 1);
                    }
                }
                LocalDate finalCurrentStart = currentStart;
                LocalDate finalCurrentEnd = currentEnd;
                List<Transaction> filteredTransactionsByDate = filterTransactionsByDate(finalCurrentStart, finalCurrentEnd, filteredTransactions);
                if(!filteredTransactionsByDate.isEmpty())
                {
                    LOGGER.info("Weekly StartDate: " + currentStart);
                    LOGGER.info("Weekly EndDate: " + currentEnd);
                    DateRange weeklyDateRange = new DateRange(currentStart, currentEnd);
                    dateRanges.add(weeklyDateRange);
                    LOGGER.info("Weekly DateRange: Start = {}, End = {}", weeklyDateRange.getStartDate(), weeklyDateRange.getEndDate());
                }
                currentStart = incrementCurrentStart(currentStart, period);
            }
        }


        return dateRanges;
    }

    private LocalDate incrementCurrentStart(LocalDate currentStart, Period period)
    {
        switch(period){
            case BIWEEKLY -> {
                return currentStart.plusWeeks(2);
            }
            case MONTHLY -> {
                return currentStart.plusMonths(1);
            }
            case WEEKLY -> {
                return currentStart.plusWeeks(1);
            }
        }
        return null;
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
                return currentStart.plusMonths(1);
            case DAILY:
                return currentStart.plusDays(1);
            default:
                throw new IllegalArgumentException("Invalid Period: " + period);
        }
    }

    public List<UserBudgetCategoryEntity> detectAndUpdateNewTransactions()
    {
        return null;
    }

}
