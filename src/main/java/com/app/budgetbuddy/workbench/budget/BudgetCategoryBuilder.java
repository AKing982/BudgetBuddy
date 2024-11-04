package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.entities.UserBudgetCategoryEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.UserBudgetCategoryService;
import com.app.budgetbuddy.workbench.categories.CategoryRuleService;
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
    private CategoryRuleService categoryRuleService;
    private CategoryService categoryService;
    private BudgetCalculator budgetCalculator;
    private Logger LOGGER = LoggerFactory.getLogger(BudgetCategoryBuilder.class);

    @Autowired
    public BudgetCategoryBuilder(UserBudgetCategoryService userBudgetCategoryService,
                                 CategoryRuleService categoryRuleService,
                                 CategoryService categoryService,
                                 BudgetCalculator budgetCalculator)
    {
        this.userBudgetCategoryService = userBudgetCategoryService;
        this.categoryRuleService = categoryRuleService;
        this.categoryService = categoryService;
        this.budgetCalculator = budgetCalculator;
    }

    private boolean isTransactionAlreadyLinked(Transaction transaction)
    {
        return false;
    }

    public Category updateCategoryOnNewTransaction(Transaction transaction)
    {
        return null;
    }

    public boolean storeCategoriesInDatabase(Set<UserBudgetCategoryEntity> userBudgetCategories)
    {
        return false;
    }

    private UserEntity fetchUserEntityByUserId(Long userId)
    {
        return null;
    }

    public CategoryEntity fetchCategoryByNameOrDescription(String categoryName, String categoryDescription)
    {
        return null;
    }

    public BigDecimal getCategoryRemainingAmount(final BudgetPeriod budgetPeriod, final CategoryBudget categoryBudget)
    {
        return null;
    }

    public BigDecimal getCategoryActualAmount(final BudgetPeriod budgetPeriod, final CategoryBudget categoryBudget)
    {
        return null;
    }

    public BigDecimal getCategoryBudgetAmount(final BudgetPeriod budgetPeriod, final CategoryBudget categoryBudget)
    {
        return null;
    }

    // Maps the User
    public Map<Long, List<UserBudgetCategory>> initializeUserBudgetCategories(Budget budget, BudgetPeriod budgetPeriod)
    {
        Map<Long, List<UserBudgetCategory>> userBudgetCategories = new HashMap<>();
        if(budget == null || budgetPeriod == null)
        {
            return userBudgetCategories;
        }
        return null;
    }

    public UserBudgetCategory createUserBudgetCategory(Transaction transaction)
    {
        return null;
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
        // 1. Filter the transaction by the category in question

        // 2. As long as the transaction posted dates are within the specified budget start date and end date e.g. (Sept 1, 2024 - Sept 30, 2024)
        // Proceed to group the transactions by

        // 3. Look at the Posted dates for the transactions

        // 4. Find the earliest posted dates and the latest posted dates

        // 5. Using the earliest posted date as the start date and the latest posted dates as the end date

        // 6. Create the DateRange object.
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

        switch(period)
        {
            case DAILY:

                break;

            case BIWEEKLY:



                return categoryPeriods;
            case WEEKLY:
                LocalDate currentStart = budgetStartDate;
                LOGGER.info("BudgetStartDate: " + budgetStartDate);
                LOGGER.info("BudgetEndDate: " + budgetEndDate);
                while(!currentStart.isAfter(budgetEndDate)) {
                    LocalDate currentEnd = currentStart.plusDays(7);
                    if (currentEnd.isAfter(budgetEndDate)) {
                        break;
                    }

                    DateRange partialWeekRange = new DateRange(currentEnd, budgetEndDate);
                    // TODO: If the currentEnd falls before the budgetEndDate and its before the end of the month
                    // TODO: Extend the currentEnd till the budgetEndDate
                    long numDaysBetweenBudgetEndDateAndCurrentEnd = partialWeekRange.getDaysInRange();
                    if (numDaysBetweenBudgetEndDateAndCurrentEnd >= 1 && numDaysBetweenBudgetEndDateAndCurrentEnd < 7)
                    {
                        if(currentEnd.isBefore(budgetEndDate)) {
                            currentEnd = currentEnd.plusDays(numDaysBetweenBudgetEndDateAndCurrentEnd - 1);
                            // Does the current fall on the start of the next month?]
                        }
                    }
                    LOGGER.info("Number of Days in Partial Week: " + numDaysBetweenBudgetEndDateAndCurrentEnd);
                    // If the current end is at the last week and its a partial week that's less than 7 days and greater than 1 day
                    // Then reset the current end to add the difference between the budget end date and the current end date

                    LocalDate finalCurrentStart = currentStart;
                    LOGGER.info("Final Current Start: " + finalCurrentStart);
                    LOGGER.info("Current End: " + currentEnd);
                    LocalDate finalCurrentEnd = currentEnd;
                    List<Transaction> weeklyTransactions = transactionsByCategory.stream()
                            .filter(transaction -> !transaction.posted().isBefore(finalCurrentStart) && !transaction.posted().isAfter(finalCurrentEnd))
                            .toList();
                    LOGGER.info("Weekly Transactions: " + weeklyTransactions);

                    if (!weeklyTransactions.isEmpty())
                    {
                        LOGGER.info("Weekly StartDate: " + currentStart);
                        LOGGER.info("Weekly EndDate: " + currentEnd);
                        DateRange weeklyDateRange = new DateRange(currentStart, currentEnd);
                        categoryPeriods.computeIfAbsent(categoryName, k -> new ArrayList<>()).add(weeklyDateRange);
                        LOGGER.info("Weekly DateRange: Start = {}, End = {}", weeklyDateRange.getStartDate(), weeklyDateRange.getEndDate());
                    }
                    // Move to the next week
                    currentStart = currentStart.plusWeeks(1);
                }

                break;
            case MONTHLY:

                break;
            default:
                throw new IllegalDateException("Illegal Date Found: " + period);
        }

        LOGGER.info("Transactions Filtered By Category: {}: {}", categoryName, transactionsByCategory);

        LOGGER.info("Category Periods: " + categoryPeriods);
        return categoryPeriods;
    }

    private List<DateRange> buildDateRanges(final LocalDate budgetStart, final LocalDate budgetEnd, final Period period, final List<Transaction> filteredTransactions){
        List<DateRange> dateRanges = new ArrayList<>();
        LocalDate currentStart = budgetStart;
        LOGGER.info("Budget StartDate: " + budgetStart);
        LOGGER.info("Budget EndDate: " + budgetEnd);

        while(!currentStart.isAfter(budgetEnd))
        {
            LocalDate currentEnd = incrementCurrentStartByPeriod(currentStart, period);
            if(currentEnd.isAfter(budgetStart)){
                break;
            }

            DateRange partialWeekRange = new DateRange(currentStart, budgetEnd);
            long numDaysBetweenBudgetEndDateAndCurrentEnd = partialWeekRange.getDaysInRange();
            if(currentEnd.isBefore(budgetEnd))
            {
                if (numDaysBetweenBudgetEndDateAndCurrentEnd >= 1 && numDaysBetweenBudgetEndDateAndCurrentEnd < 7)
                {
                    currentEnd = currentEnd.plusDays(numDaysBetweenBudgetEndDateAndCurrentEnd - 1);
                }
            }

        }
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

    public List<UserBudgetCategoryEntity> createUserBudgetCategoryFromTransaction(List<TransactionsEntity> transactionsEntities)
    {
        return null;
    }

}
