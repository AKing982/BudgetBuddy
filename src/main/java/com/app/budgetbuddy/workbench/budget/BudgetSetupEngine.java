package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.RecurringTransactionEntity;
import com.app.budgetbuddy.entities.TransactionCategoryEntity;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.repositories.RecurringTransactionsRepository;
import com.app.budgetbuddy.services.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.support.AbstractLobCreatingPreparedStatementCallback;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Component
@Slf4j
public class BudgetSetupEngine
{
    private final UserService userService;
    private final BudgetService budgetService;
    private final CategoryService categoryService;
    private final RecurringTransactionService recurringTransactionService;
    private final TransactionCategoryService transactionCategoryService;
    private final BudgetCalculations budgetCalculations;
    private final TransactionCategoryBuilder budgetCategoryBuilder;

    @Autowired
    public BudgetSetupEngine(UserService userService,
                             BudgetService budgetService,
                             CategoryService categoryService,
                             RecurringTransactionService recurringTransactionService,
                             TransactionCategoryService transactionCategoryService,
                             BudgetCalculations budgetCalculator,
                             TransactionCategoryBuilder budgetCategoryBuilder){
        this.userService = userService;
        this.budgetService = budgetService;
        this.categoryService = categoryService;
        this.recurringTransactionService = recurringTransactionService;
        this.transactionCategoryService = transactionCategoryService;
        this.budgetCalculations = budgetCalculator;
        this.budgetCategoryBuilder = budgetCategoryBuilder;
    }

    private Budget loadUserBudget(Long userId)
    {
        try
        {
            if(userId < 1L)
            {
                throw new InvalidUserIDException("Invalid UserID found: " + userId);
            }
            return budgetService.loadUserBudget(userId);
        }catch(InvalidUserIDException e){
            log.error("There was an error with the userId: ", e);
            throw e;
        }
    }
    
    public void setupBudgetPeriodData(Long userId, BudgetPeriod budgetPeriod)
    {

    }

    private BudgetGoalsEntity loadUserBudgetGoals(Long userId)
    {
        return null;
    }

    public List<TransactionLink> linkRecurringTransactionsToCategoryByDateRange(final List<RecurringTransaction> recurringTransactions, final DateRange dateRange){
        return null;
    }

    public List<TransactionLink> linkTransactionsToCategoryByDateRange(final List<Transaction> transactions, final DateRange dateRange){
        return null;
    }

    /**
     * Initializes the entire budget setup process
     * @return
     */
    public Boolean budgetSetupInitializer(){
        return null;
    }

    /**
     * Initializes all the default UserBudgetCategories
     * @param userId
     * @param transactions
     * @param recurringTransactions
     * @param budgetPeriod
     * @return
     */
    public List<TransactionCategory> initializeDefaultUserBudgetCategories(final Long userId, final List<Transaction> transactions, final List<RecurringTransaction> recurringTransactions, final BudgetPeriod budgetPeriod)
    {
        List<TransactionCategory> userBudgetCategories = new ArrayList<>();
        if(transactions.isEmpty() || recurringTransactions.isEmpty() || budgetPeriod == null)
        {
            return userBudgetCategories;
        }
        LocalDate startDate = budgetPeriod.startDate();
        LocalDate endDate = budgetPeriod.endDate();
        Period period = budgetPeriod.period();
        validateBudgetPeriodDates(startDate, endDate, period);

        // Obtain the budget data the user created during the questionnaire phase.
        Budget budget = loadUserBudget(userId);
        // If the user has no budget then return an empty list
        if(budget == null)
        {
            return userBudgetCategories;
        }
        else
        {
            List<TransactionCategory> userBudgetCategoriesTransactions = budgetCategoryBuilder.initializeUserBudgetCategories(budget, budgetPeriod, transactions);
            if(!userBudgetCategoriesTransactions.isEmpty())
            {
               userBudgetCategories.addAll(userBudgetCategoriesTransactions);
            }

            List<TransactionCategory> userBudgetCategoriesRecurringTransactions = budgetCategoryBuilder.initializeUserBudgetCategories(budget, budgetPeriod, recurringTransactions);
            if(!userBudgetCategoriesRecurringTransactions.isEmpty())
            {
                userBudgetCategories.addAll(userBudgetCategoriesRecurringTransactions);
            }
        }
        return userBudgetCategories;
    }

    private void validateBudgetPeriodDates(LocalDate startDate, LocalDate endDate, Period period)
    {
        try
        {
            if(startDate == null || endDate == null){
                throw new IllegalDateException("Start date or End date cannot be null");
            }
        }catch(IllegalDateException e){
            log.error("There was an error fetching budget period dates: ", e);
            throw e;
        }

    }

    public List<TransactionCategoryEntity> convertUserBudgetCategoriesToEntities(final List<TransactionCategory> userBudgetCategories)
    {
        return null;
    }


    /**
     * Initializes the Budget Category's when the user creates a controlling spending plan
     * @param categories
     * @return
     */
    public List<ControlledBudgetCategory> createControlledSpendingCategories(final Budget budget, final BudgetGoals budgetGoals, final List<CategoryQuestionnaireData> categories){
        List<ControlledBudgetCategory> controlledBudgetCategories = new ArrayList<>();
        if(categories.isEmpty())
        {
            return controlledBudgetCategories;
        }

        BigDecimal budgetAmount = budget.getBudgetAmount();
        // Fetch the budget goals
        double targetAmount = budgetGoals.targetAmount();
        double currentMonthlyAllocation = budgetGoals.monthlyAllocation();
        double currentSavings = budgetGoals.currentSavings();
        for(CategoryQuestionnaireData categoryQuestionnaireData : categories)
        {
            if(categoryQuestionnaireData != null)
            {
                try
                {
                    String categoryName = categoryQuestionnaireData.getCategoryName();
                    double currentSpending = categoryQuestionnaireData.getCurrentSpending();
                    double spendingLimit = categoryQuestionnaireData.getSpendingLimit();
                    int priority = categoryQuestionnaireData.getPriority();
                    Double categoryAllocatedAmount = budgetCalculations.calculateAllocatedAmount(budgetAmount, targetAmount, currentMonthlyAllocation, currentSpending, spendingLimit, currentSavings);
                    ControlledBudgetCategory controlledBudgetCategory = new ControlledBudgetCategory(budget.getId(), categoryName, categoryAllocatedAmount, spendingLimit, currentSpending, false, true,  priority);
                    controlledBudgetCategories.add(controlledBudgetCategory);

                }catch(NumberFormatException e)
                {
                    log.error("There was an error calculating the category allocation amount for category: " + categoryQuestionnaireData.getCategoryName(), e);
                    throw e;
                }
            }
        }
        return controlledBudgetCategories;
    }

    public Category initializeIncomeCategory(final Long userId, final DateRange dateRange)
    {
        final String PAYROLL = "Payroll";
        final String payrollCategory = "21009000";
        try
        {
            LocalDate startDate = dateRange.getStartDate();
            LocalDate endDate = dateRange.getEndDate();
            List<RecurringTransaction> recurringTransactionsWithIncome = recurringTransactionService.findIncomeRecurringTransactionByCategoryAndUserId(PAYROLL, payrollCategory, userId, startDate, endDate);
            RecurringTransaction recurringTransaction = recurringTransactionsWithIncome.get(0);
            return new Category(payrollCategory, PAYROLL, recurringTransaction.getDescription(), recurringTransaction.getAverageAmount(), recurringTransaction.getFirstDate(), recurringTransaction.getLastDate(), BigDecimal.ZERO, true, CategoryType.PAYMENT);
        }catch(ArrayIndexOutOfBoundsException e){
            log.error("There was an error initializing the income category for user {}: {}", userId, e.getMessage());
            throw e;
        }
    }

    /**
     * Creates a map of total spending for each date range period
     * @param budget The budget to calculate totals for
     * @param dateRanges The list of date ranges to calculate over
     * @return Map of total spent amounts keyed by date range
     */
    public Map<DateRange, BigDecimal> createTotalSpentByPeriodMap(final Budget budget, final List<DateRange> dateRanges) {
        if (budget == null || dateRanges == null || dateRanges.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<DateRange, BigDecimal> totalSpentByPeriod = new HashMap<>();

        for (DateRange dateRange : dateRanges) {
            List<TransactionCategory> transactionCategories = transactionCategoryService
                    .getTransactionCategoryListByBudgetIdAndDateRange(
                            budget.getId(),
                            dateRange.getStartDate(),
                            dateRange.getEndDate()
                    );

            BigDecimal totalSpent = budgetCalculations.calculateTotalSpendingOnBudget(
                    dateRange,
                    transactionCategories,
                    budget
            );

            totalSpentByPeriod.put(dateRange, totalSpent);
        }
        return totalSpentByPeriod;
    }

    /**
     * Creates a map of total budgeted amounts for each date range period
     * @param budget The budget to calculate totals for
     * @param dateRanges The list of date ranges to calculate over
     * @return Map of total budgeted amounts keyed by date range
     */
    public Map<DateRange, BigDecimal> createTotalBudgetedByPeriodMap(final Budget budget, final List<DateRange> dateRanges) {
        if (budget == null || dateRanges == null || dateRanges.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<DateRange, BigDecimal> totalBudgetedByPeriod = new HashMap<>();

        for (DateRange dateRange : dateRanges) {
            List<RecurringTransaction> recurringTransactions = recurringTransactionService
                    .getRecurringTransactions(
                            budget.getUserId(),
                            dateRange.getStartDate(),
                            dateRange.getEndDate()
                    );

            BigDecimal totalFixedRecurringExpenses = budgetCalculations
                    .calculateTotalFixedRecurringExpenses(
                            budget,
                            dateRange,
                            recurringTransactions
                    );

            BigDecimal totalSpent = budgetCalculations.calculateTotalSpendingOnBudget(
                    dateRange,
                    transactionCategoryService.getTransactionCategoryListByBudgetIdAndDateRange(
                            budget.getId(),
                            dateRange.getStartDate(),
                            dateRange.getEndDate()
                    ),
                    budget
            );

            BigDecimal totalBudgeted = budgetCalculations.calculateTotalBudgetAmount(
                    dateRange,
                    budget,
                    totalFixedRecurringExpenses,
                    totalSpent
            );

            totalBudgetedByPeriod.put(dateRange, totalBudgeted);
        }

        return totalBudgetedByPeriod;
    }

    /**
     * Creates a map of average daily spending for each date range period
     * @param budget The budget to calculate averages for
     * @param dateRanges The list of date ranges to calculate over
     * @return Map of average daily spending amounts keyed by date range
     */
    public Map<DateRange, BigDecimal> createAverageSpendingPerDayMap(final Budget budget, final List<DateRange> dateRanges) {
        if (budget == null || dateRanges == null || dateRanges.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<DateRange, BigDecimal> averageSpendingByPeriod = new HashMap<>();

        // Get the total spent and budgeted maps first to avoid recalculating
        Map<DateRange, BigDecimal> totalSpentMap = createTotalSpentByPeriodMap(budget, dateRanges);
        Map<DateRange, BigDecimal> totalBudgetedMap = createTotalBudgetedByPeriodMap(budget, dateRanges);

        for (DateRange dateRange : dateRanges) {
            BudgetPeriod budgetPeriod = new BudgetPeriod(
                    Period.MONTHLY,
                    dateRange.getStartDate(),
                    dateRange.getEndDate()
            );

            BigDecimal averageSpending = budgetCalculations.calculateAverageSpendingPerDayOnBudget(
                    totalBudgetedMap.get(dateRange),
                    totalSpentMap.get(dateRange),
                    budgetPeriod
            );

            averageSpendingByPeriod.put(dateRange, averageSpending);
        }

        return averageSpendingByPeriod;
    }

    /**
     * Orchestrates the creation of budget statistics by gathering all required calculations
     * and initializing the budget statistics for each period
     *
     * @param budget The budget to analyze
     * @param dateRanges The list of date ranges to calculate over
     * @return List of BudgetStats for each date range period
     */
    public List<BudgetStats> createBudgetStatistics(final Budget budget, final List<DateRange> dateRanges)
    {
        if (budget == null || dateRanges == null || dateRanges.isEmpty()) {
            return Collections.emptyList();
        }

        try {
            // Create all required maps
            Map<DateRange, BigDecimal> totalSpentByPeriod = createTotalSpentByPeriodMap(budget, dateRanges);
            Map<DateRange, BigDecimal> totalBudgetedByPeriod = createTotalBudgetedByPeriodMap(budget, dateRanges);
            Map<DateRange, BigDecimal> averageSpendingPerDay = createAverageSpendingPerDayMap(budget, dateRanges);

            // Initialize and return budget statistics using the calculated maps
            return initializeUserBudgetStatistics(
                    budget,
                    dateRanges,
                    totalSpentByPeriod,
                    totalBudgetedByPeriod,
                    averageSpendingPerDay
            );
        } catch (Exception e) {
            log.error("Error creating budget statistics for budget ID: " + budget.getId(), e);
            return Collections.emptyList();
        }
    }

    /**
     * Initializes the budget statistics over several date ranges e.g. a Month
     * This is to be used when creating budget statistics over past periods
     * @param budget
     * @param periodDateRange
     * @return
     */
    public List<BudgetStats> initializeUserBudgetStatistics(final Budget budget, final List<DateRange> periodDateRange, final Map<DateRange, BigDecimal> totalSpentByPeriod,
                                                            final Map<DateRange, BigDecimal> totalBudgetedByPeriod, final Map<DateRange, BigDecimal> averageSpendingPerDay)
    {
        List<BudgetStats> userBudgetStatistics = new ArrayList<>();
        if(budget == null || periodDateRange == null)
        {
            return userBudgetStatistics;
        }
        BigDecimal budgetedAmount = budget.getBudgetAmount();
        Long budgetId = budget.getId();
        for(DateRange dateRange : periodDateRange)
       {
            BigDecimal totalSpentForPeriod = totalSpentByPeriod.get(dateRange);
            BigDecimal totalBudgetedForPeriod = totalBudgetedByPeriod.get(dateRange);
            BigDecimal averageSpendingForPeriod = averageSpendingPerDay.get(dateRange);
            BigDecimal remainingBudgetForPeriod = totalBudgetedForPeriod.subtract(totalSpentForPeriod);
            BudgetStats budgetStats = new BudgetStats(budgetId, budgetedAmount, totalSpentForPeriod, remainingBudgetForPeriod,remainingBudgetForPeriod, averageSpendingForPeriod, dateRange);
            userBudgetStatistics.add(budgetStats);
        }
        return userBudgetStatistics;
    }

    /**
     * Initializes the Category's for a particular user
     * @param transactions
     * @param budgetCategories
     * @param userId
     * @param budgetPeriod
     * @return
     */
    public TreeMap<Long, List<Category>> initializeUserCategories(final List<Transaction> transactions, final List<ControlledBudgetCategory> budgetCategories, Long userId, BudgetPeriod budgetPeriod){
        return null;
    }

    public Category initializeBudgetExpenses(List<Transaction> transactions, Budget budget, BudgetPeriod budgetPeriod){
        return null;
    }

    public Category initializeBudgetSavings(List<Transaction> transactions, Budget budget, BudgetPeriod budgetPeriod){
        return null;
    }

    public Map<Long, List<Category>> loadTopBudgetExpenseCategories(final List<Transaction> transactions, BudgetPeriod budgetPeriod){
        return null;
    }

    public Map<String, Category> loadBudgetPeriodCategories(final BudgetPeriod budgetPeriod, final Budget budget){
        return null;
    }


}
