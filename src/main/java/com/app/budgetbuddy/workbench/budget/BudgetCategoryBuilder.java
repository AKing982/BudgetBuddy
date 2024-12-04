package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.UserBudgetCategoryEntity;
import com.app.budgetbuddy.exceptions.CategoryNotFoundException;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.exceptions.TransactionRuleException;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.UserBudgetCategoryService;
import com.app.budgetbuddy.workbench.categories.CategoryRuleEngine;
import com.app.budgetbuddy.workbench.converter.UserBudgetCategoryConverter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class BudgetCategoryBuilder
{
    private UserBudgetCategoryService userBudgetCategoryService;
    private CategoryService categoryService;
    private BudgetCalculations budgetCalculator;
    private CategoryRuleEngine categoryRuleEngine;
    private UserBudgetCategoryConverter userBudgetCategoryConverter;
    private Logger LOGGER = LoggerFactory.getLogger(BudgetCategoryBuilder.class);

    @Autowired
    public BudgetCategoryBuilder(UserBudgetCategoryService userBudgetCategoryService,
                                 CategoryService categoryService,
                                 BudgetCalculations budgetCalculator,
                                 CategoryRuleEngine categoryRuleEngine,
                                 UserBudgetCategoryConverter userBudgetCategoryConverter)
    {
        this.userBudgetCategoryService = userBudgetCategoryService;
        this.categoryService = categoryService;
        this.budgetCalculator = budgetCalculator;
        this.userBudgetCategoryConverter = userBudgetCategoryConverter;
        this.categoryRuleEngine = categoryRuleEngine;
    }


    /**
     * Links transactions to a particular category within a specified date range
     * @param transactions
     * @param transactionDateRange
     * @return
     */
    public ArrayList<TransactionLink> linkCategoryToTransactionsByDateRange(final List<? extends Transaction> transactions, final DateRange transactionDateRange, final Long userId)
    {
        ArrayList<TransactionLink> transactionLinks = new ArrayList<>();
        if(transactions.isEmpty() || transactionDateRange == null) {
            return transactionLinks;
        }
        long startTime = System.currentTimeMillis();
        try
        {
            final LocalDate startDate = transactionDateRange.getStartDate();
            final LocalDate endDate = transactionDateRange.getEndDate();
            if(startDate == null || endDate == null)
            {
                throw new IllegalDateException("Start date or End date cannot be null");
            }

            List<Transaction> filteredTransactionsByDateRange = filterTransactionsByDateRange(transactions, transactionDateRange);
            Map<String, List<String>> finalizedTransactionCategories = categoryRuleEngine.finalizeUserTransactionCategoriesForDateRange(filteredTransactionsByDateRange, userId, transactionDateRange);
            if(finalizedTransactionCategories.isEmpty())
            {
                LOGGER.warn("Final categories are empty");
                return transactionLinks;
            }

            for(Map.Entry<String, List<String>> entry : finalizedTransactionCategories.entrySet())
            {
                List<String> transactionIds = entry.getValue();
                String category = entry.getKey();
                for(String transactionId : transactionIds)
                {
                    TransactionLink transactionLink = createTransactionLink(category, transactionId);
                    LOGGER.info("Transaction link created for category:{}, and transaction: {} " ,transactionLink.getCategory(), transactionLink.getTransactionId());
                    transactionLinks.add(transactionLink);
                    LOGGER.info("Transaction links size: " + transactionLinks.size());
                }
            }

        }catch(IllegalDateException e){
            LOGGER.error("There was an error fetching transaction dates: ", e);
            throw e;
        }catch(Exception e){
            LOGGER.error("There was an error fetching the categorized transactions: ", e);
            throw e;
        }
        long endTime = System.currentTimeMillis();
        LOGGER.info("Total elapsed time: {} ms", (endTime - startTime));
        return transactionLinks;
    }

    private TransactionLink createTransactionLink(String category, String transactionId)
    {
        return new TransactionLink(category, transactionId);
    }

    private List<Transaction> filterTransactionsByDateRange(final List<? extends Transaction> transactions, final DateRange dateRange)
    {
        List<Transaction> filteredTransactions = transactions.stream()
                .filter(transaction ->
                        transaction.getPosted().isAfter(dateRange.getStartDate()) &&
                                transaction.getPosted().isBefore(dateRange.getEndDate()))
                .collect(Collectors.toList());
        LOGGER.info("Filtered Transactions: {}", filteredTransactions);
        return filteredTransactions;
    }

    public UserBudgetCategory updateCategoryOnNewTransaction(final Transaction transaction, final UserBudgetCategory existingUserBudgetCategory)
    {
        List<String> transactionCategories = transaction.getCategories();
        String categoryId = transaction.getCategoryId();
        // Match the transaction against a particular category Rule using the categoryRuleEngine?

        for(String transactionCategory : transactionCategories)
        {
            CategoryEntity category = getCategoryById(categoryId);
            if(category != null)
            {
                String categoryName = category.getName();
                // If the category name matches the category name in the transaction
                if(categoryName.equals(transactionCategory))
                {
                    // Get the transaction amount
                    BigDecimal transactionAmount = transaction.getAmount();
                    if(transactionAmount == null)
                    {
                        throw new IllegalArgumentException("Transaction amount cannot be null");
                    }

                    // Update the actual spending amount
                    Double newActualAmount = existingUserBudgetCategory.getBudgetActual() + transactionAmount.doubleValue();

                    // Before setting the budget actual amount
                    // Does the new Budget actual spending stay within the budget actual spending range?
                    if(newActualAmount >= existingUserBudgetCategory.getBudgetedAmount())
                    {
                        setUserBudgetCategoryOverSpendingAmount(newActualAmount, existingUserBudgetCategory);
                        setUserBudgetCategoryBudgetActual(newActualAmount, existingUserBudgetCategory);
                    }
                    setUserBudgetCategoryBudgetActual(newActualAmount, existingUserBudgetCategory);
                }
            }
        }
        return existingUserBudgetCategory;
    }

    private void setUserBudgetCategoryOverSpendingAmount(Double overSpendingAmount, UserBudgetCategory existingUserBudgetCategory)
    {
        existingUserBudgetCategory.setOverSpendingAmount(overSpendingAmount);
        existingUserBudgetCategory.setOverSpent(true);
    }

    private void setUserBudgetCategoryBudgetActual(Double actualAmount, UserBudgetCategory existingUserBudgetCategory)
    {
        existingUserBudgetCategory.setBudgetActual(actualAmount);
    }

    public List<UserBudgetCategoryEntity> convertUserBudgetCategories(List<UserBudgetCategory> userBudgetCategories)
    {
        return null;
    }

    public boolean storeCategoriesInDatabase(Set<UserBudgetCategory> userBudgetCategories)
    {
        return false;
    }

    private CategoryEntity getCategoryById(String categoryId)
    {
        if(categoryId.isEmpty())
        {
            return null;
        }
        Optional<CategoryEntity> category = categoryService.findCategoryById(categoryId);
        return category.orElseThrow(() -> new CategoryNotFoundException(categoryId));
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

    private List<String> getCategoriesFromTransactions(final List<? extends Transaction> transactions)
    {
        List<String> categoriesList = new ArrayList<>();
        if(transactions.isEmpty())
        {
            return categoriesList;
        }
        return transactions.stream()
                .filter(transaction -> transaction.getCategories() != null)
                .flatMap(transaction -> transaction.getCategories().stream())
                .distinct()  // Optional: remove duplicates if you want only unique categories
                .toList();
    }

    public List<CategorySpending> createCategorySpendingList(final List<String> categories, final List<? extends Transaction> transactions)
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
                if (transaction.getCategories() != null && transaction.getCategories().contains(category))
                {
                    categorySpending = categorySpending.add(transaction.getAmount());
                }
            }
            // Add one CategorySpending object for each category
            categorySpendingList.add(new CategorySpending(categoryId, category, categorySpending));
        }
        LOGGER.info("Category Spending: " + categorySpendingList);
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
    public List<UserBudgetCategory> initializeUserBudgetCategories(final Budget budget, final BudgetPeriod budgetPeriod, final List<? extends Transaction> transactions)
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
        LOGGER.info("Category to Budget: " + categoryToBudgetMap);
        LOGGER.info("Category Spending List: " + categorySpendingList);
        LOGGER.info("Category Date Ranges: " + categoryDateRanges);
        return buildUserBudgetCategoryList(categoryToBudgetMap, categorySpendingList, categoryDateRanges, budget.getUserId());
    }

    public List<UserBudgetCategory> buildUserBudgetCategoryList(final Map<String, BigDecimal> categoryBudget, final List<CategorySpending> categorySpendingList, final Map<String, List<DateRange>> categoryDateRanges, Long userId)
    {
        List<UserBudgetCategory> userBudgetCategories = new ArrayList<>();
        if(categoryBudget.isEmpty() || categorySpendingList.isEmpty() || categoryDateRanges.isEmpty())
        {
            LOGGER.warn("Found empty category parameters: " + categoryBudget + ", " + categorySpendingList + ", " + categoryDateRanges);
            return userBudgetCategories;
        }
        for(CategorySpending categorySpending : categorySpendingList)
        {
            LOGGER.info("Category Spending: " + categorySpending);
            for(String category : categoryBudget.keySet())
            {
                LOGGER.info("Category: " + category);
                if(categorySpending.getCategoryName().equals(category))
                {
                    BigDecimal categoryBudgetAmount = categoryBudget.get(category);
                    BigDecimal categoryBudgetActual = categorySpending.getActualSpending();
                    LOGGER.info("Category Budget Amount: " + categoryBudgetAmount);
                    List<DateRange> dateRanges = categoryDateRanges.get(category);
                    LOGGER.info("Date Ranges: " + dateRanges);
                    for(DateRange dateRange : dateRanges){
                        UserBudgetCategory userBudgetCategory = createUserBudgetCategory(userId, Double.valueOf(categoryBudgetAmount.toString()), Double.valueOf(String.valueOf(categoryBudgetActual)),category, categorySpending.getCategoryId(), dateRange.getStartDate(), dateRange.getEndDate());
                        userBudgetCategories.add(userBudgetCategory);
                    }
                }
            }
        }
        LOGGER.info("User Budget Categories: " + userBudgetCategories);
        return userBudgetCategories;
    }

    private UserBudgetCategory createUserBudgetCategory(Long userId, Double budgetedAmount, Double budgetActual, String category, String categoryId, LocalDate startDate, LocalDate endDate){
        UserBudgetCategory userBudgetCategory = new UserBudgetCategory();
        userBudgetCategory.setUserId(userId);
        userBudgetCategory.setBudgetedAmount(Double.valueOf(budgetedAmount.toString()));
        userBudgetCategory.setIsActive(true);
        userBudgetCategory.setCategoryName(category);
        userBudgetCategory.setBudgetActual(budgetActual);
        userBudgetCategory.setCategoryId(categoryId);
        userBudgetCategory.setStartDate(startDate);
        userBudgetCategory.setEndDate(endDate);
        return userBudgetCategory;
    }

    public TransactionLink linkTransactionToCategory(Transaction transaction, String category)
    {
        //TODO: Implement full logic for linking and storing the link between the transaction and category
        if(transaction == null || category == null)
        {
            throw new IllegalArgumentException("Transaction or Category cannot be null");
        }

        return null;
//        return new TransactionLink(category, transaction);
    }

    public Map<String, List<DateRange>> createCategoryPeriods(final String categoryName, final LocalDate budgetStartDate, final LocalDate budgetEndDate, final Period period, final List<? extends Transaction> transactions)
    {
        Map<String, List<DateRange>> categoryPeriods = new HashMap<>();
        LOGGER.info("Budget StartDate: " + budgetStartDate);
        LOGGER.info("Budget EndDate: " + budgetEndDate);
        if(budgetStartDate == null || budgetEndDate == null)
        {
            throw new IllegalArgumentException("budgetStartDate or budgetEndDate cannot be null");
        }
        if(transactions.isEmpty())
        {
            return new HashMap<>();
        }

        List<? extends Transaction> transactionsByCategory = transactions.stream()
                .filter(transaction -> transaction.getCategories() != null && transaction.getCategories().contains(categoryName))
                .filter(transaction -> !transaction.getPosted().isBefore(budgetStartDate) && !transaction.getPosted().isAfter(budgetEndDate))
                .toList();

        List<DateRange> dateRanges = buildDateRanges(budgetStartDate, budgetEndDate, period, transactionsByCategory);
        categoryPeriods.put(categoryName, dateRanges);

        LOGGER.info("Transactions Filtered By Category: {}: {}", categoryName, transactionsByCategory);

        LOGGER.info("Category Periods: " + categoryPeriods);
        return categoryPeriods;
    }

    private List<? extends Transaction> filterTransactionsByDate(LocalDate startDate, LocalDate endDate, List<? extends Transaction> transactions)
    {
        return transactions.stream()
                .filter(transaction -> !transaction.getPosted().isBefore(startDate) && !transaction.getPosted().isAfter(endDate))
                .toList();
    }

    private List<DateRange> buildDateRanges(final LocalDate budgetStart, final LocalDate budgetEnd, final Period period, final List<? extends Transaction> filteredTransactions){
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

            List<? extends Transaction> transactions = filterTransactionsByDate(currentStart, currentEnd, filteredTransactions);

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
                List<? extends Transaction> filteredTransactionsByDate = filterTransactionsByDate(finalCurrentStart, finalCurrentEnd, filteredTransactions);
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
