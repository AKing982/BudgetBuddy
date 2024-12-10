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

    public List<DateRange> createBudgetDateRanges(final LocalDate budgetStartDate, final LocalDate budgetEndDate)
    {
        if (budgetStartDate == null || budgetEndDate == null)
        {
            return Collections.emptyList();
        }
        DateRange monthDateRange = new DateRange(budgetStartDate, budgetEndDate);
        return monthDateRange.splitIntoWeeks();
    }

    /**
     * Orchestrates the creation of budget statistics by gathering all required calculations
     * and initializing the budget statistics for each period
     *
     * @param budget The budget to analyze
     * @return List of BudgetStats for each date range period
     */
    public List<BudgetStats> createBudgetStatistics(final Budget budget)
    {
        if (budget == null) {
            return Collections.emptyList();
        }

        try {
            Long budgetId = budget.getId();
            LocalDate budgetStartDate = budget.getStartDate();
            LocalDate budgetEndDate = budget.getEndDate();
            List<DateRange> budgetDateRanges = createBudgetDateRanges(budgetStartDate, budgetEndDate);
            // Create all required maps
            Map<DateRange, BigDecimal> totalSpentByPeriod = createTotalSpentByPeriodMap(budget, budgetDateRanges);
            Map<DateRange, BigDecimal> totalBudgetedByPeriod = createTotalBudgetedByPeriodMap(budget, budgetDateRanges);
            Map<DateRange, BigDecimal> averageSpendingPerDay = createAverageSpendingPerDayMap(budget, budgetDateRanges);

            // Initialize and return budget statistics using the calculated maps
            return initializeUserBudgetStatistics(
                    budget,
                    budgetDateRanges,
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

    public List<TransactionCategory> createTransactionCategories(final List<Transaction> transactions, final Budget budget, final List<DateRange> dateRanges) {
        if (transactions == null || budget == null || dateRanges == null)
        {
            return Collections.emptyList();
        }
        List<TransactionCategory> transactionCategories = new ArrayList<>();
        for(DateRange dateRange : dateRanges)
        {
            if(dateRange == null){
                log.warn("Skipping null date range...");
                continue;
            }
            LocalDate startDate = dateRange.getStartDate();
            LocalDate endDate = dateRange.getEndDate();
            BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, startDate, endDate);
            List<TransactionCategory> transactionCategoriesList = budgetCategoryBuilder.initializeTransactionCategories(budget, budgetPeriod, transactions);
            transactionCategories.addAll(transactionCategoriesList);
        }
        return transactionCategories;
    }

    public List<TransactionCategory> createRecurringTransactionCategories(final List<RecurringTransaction> recurringTransactions, final Budget budget, final List<DateRange> dateRanges) {
        if (recurringTransactions == null || budget == null || dateRanges == null){
            return Collections.emptyList();
        }
        List<TransactionCategory> transactionCategories = new ArrayList<>();
        for(DateRange dateRange : dateRanges)
        {
            if(dateRange == null){
                continue;
            }
            LocalDate startDate = dateRange.getStartDate();
            LocalDate endDate = dateRange.getEndDate();
            BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, startDate, endDate);
            List<TransactionCategory> transactionCategoryList = budgetCategoryBuilder.initializeTransactionCategories(budget, budgetPeriod, recurringTransactions);
            transactionCategories.addAll(transactionCategoryList);
        }
        return transactionCategories;
    }

    /**
     * Initializes the Transaction Category's for a particular user
     * @param transactions
     * @return
     */
    public TreeMap<Long, List<TransactionCategory>> createTransactionCategories(final List<RecurringTransaction> recurringTransactions, final List<Transaction> transactions, final Budget budget, final List<DateRange> budgetDateRanges){
        TreeMap<Long, List<TransactionCategory>> transactionCategoriesMap = new TreeMap<>();
        if(recurringTransactions == null || transactions == null || budget == null || budgetDateRanges == null)
        {
            return new TreeMap<>();
        }
        Long userId = budget.getUserId();
        List<TransactionCategory> transactionCategoryList = createTransactionCategories(transactions, budget, budgetDateRanges);
        List<TransactionCategory> recurringTransactionCategories = createRecurringTransactionCategories(recurringTransactions, budget, budgetDateRanges);
        transactionCategoriesMap.putIfAbsent(userId, transactionCategoryList);
        transactionCategoriesMap.putIfAbsent(userId, recurringTransactionCategories);
        return transactionCategoriesMap;
    }


    public List<BudgetCategory> initializeBudgetExpenseCategory(final Budget budget, final List<TransactionCategory> transactionCategories, final List<DateRange> dateRanges){
        if(budget == null || transactionCategories == null || dateRanges == null){
            return null;
        }
        List<BudgetCategory> budgetCategories = new ArrayList<>();
        for(DateRange dateRange : dateRanges)
        {
            if(dateRange == null){
                log.warn("Skipping null date range...");
                continue;
            }
            LocalDate startDate = dateRange.getStartDate();
            LocalDate endDate = dateRange.getEndDate();
            int transactionIndex = 0;
            BigDecimal totalExpenses = new BigDecimal(0);
            BigDecimal budgetedAmount = budget.getBudgetAmount();
            while(transactionIndex < transactionCategories.size())
            {
                TransactionCategory transactionCategory = transactionCategories.get(transactionIndex);
                if(transactionCategory != null)
                {
                    LocalDate transactionCategoryStartDate = transactionCategory.getStartDate();
                    LocalDate transactionCategoryEndDate = transactionCategory.getEndDate();
                    if(transactionCategoryStartDate.isAfter(startDate) && transactionCategoryEndDate.isBefore(endDate))
                    {
                        BigDecimal transactionCategoryExpense = BigDecimal.valueOf(transactionCategory.getBudgetActual());
                        totalExpenses = totalExpenses.add(transactionCategoryExpense);
                        String categoryName = transactionCategory.getCategoryName();
                        BigDecimal remainingOnBudget = budgetedAmount.subtract(totalExpenses);
                        BudgetCategory budgetCategory = new BudgetCategory(categoryName, budgetedAmount, totalExpenses, remainingOnBudget, dateRange);
                        budgetCategories.add(budgetCategory);
                    }
                }
                transactionIndex++;
            }
        }
        return budgetCategories;
    }

    private boolean isMonthlyAllocationPossible(final BigDecimal monthlyAllocation, final BigDecimal budgetedAmount, final BigDecimal totalSpending)
    {
        // Check if budgeted amount can cover monthly allocation
        if (budgetedAmount.compareTo(monthlyAllocation) >= 0)
        {
            // Calculate remaining amount after spending
            BigDecimal remainingAmount = budgetedAmount.subtract(totalSpending);

            // Check if remaining amount can cover monthly allocation
            return remainingAmount.compareTo(BigDecimal.ZERO) >= 0
                    && remainingAmount.compareTo(monthlyAllocation) >= 0;
        }
        return false;
    }

    public List<BudgetCategory> initializeBudgetSavingsCategories(final BudgetGoals budgetGoals, final List<TransactionCategory> transactionCategories, final Budget budget, final List<DateRange> dateRanges)
    {
        if(transactionCategories == null || budget == null || dateRanges == null)
        {
            return Collections.emptyList();
        }
        List<BudgetCategory> budgetSavingsCategories = new ArrayList<>();
        BigDecimal targetSavingsGoal = BigDecimal.valueOf(budgetGoals.targetAmount());
        BigDecimal monthlyAllocation = BigDecimal.valueOf(budgetGoals.monthlyAllocation());
        for(DateRange dateRange : dateRanges)
        {
            if(dateRange == null){
                log.warn("Skipping null date range...");
                continue;
            }
            LocalDate startDate = dateRange.getStartDate();
            LocalDate endDate = dateRange.getEndDate();
            int transactionIndex = 0;
            BigDecimal totalSavings = new BigDecimal(0);
            BigDecimal budgetedAmount = budget.getBudgetAmount();
            while(transactionIndex < transactionCategories.size())
            {
                TransactionCategory transactionCategory = transactionCategories.get(transactionIndex);
                if(transactionCategory != null)
                {
                    // How much was spent during the period
                    BigDecimal budgetedAmountForCategory = BigDecimal.valueOf(transactionCategory.getBudgetedAmount());
                    BigDecimal categorySpend = BigDecimal.valueOf(transactionCategory.getBudgetActual());
                    // How much is remaining during the period
                    BigDecimal remainingOnBudget = budgetedAmountForCategory.subtract(categorySpend);
                    // Can we allocate the monthlyAllocation during this period?
                    if(isMonthlyAllocationPossible(monthlyAllocation, budgetedAmountForCategory, categorySpend))
                    {
                        // Add the monthly allocation
                        totalSavings = totalSavings.add(monthlyAllocation);
                        BigDecimal remainingSavings = targetSavingsGoal.subtract(totalSavings);
                        BudgetCategory budgetCategory = new BudgetCategory("Savings", targetSavingsGoal, totalSavings, remainingSavings, dateRange);
                        budgetSavingsCategories.add(budgetCategory);
                    }
                    else
                    {
                        continue;
                    }
                }
                transactionIndex++;
            }
        }
        return budgetSavingsCategories;
    }

    public List<BudgetCategory> createTopBudgetExpenseCategories(final List<TransactionCategory> transactionCategories, final List<DateRange> dateRanges)
    {
        if(dateRanges == null || transactionCategories == null)
        {
            return Collections.emptyList();
        }

        Map<String, BigDecimal> totalSpendingByCategory = new HashMap<>();
        Map<String, BigDecimal> budgetedAmountByCategory = new HashMap<>();
        for(DateRange dateRange : dateRanges)
        {
            int transactionIndex = 0;
            while(transactionIndex < transactionCategories.size())
            {
                TransactionCategory transactionCategory = transactionCategories.get(transactionIndex);
                if(transactionCategory != null)
                {
                    String categoryName = transactionCategory.getCategoryName();
                    BigDecimal categorySpending = BigDecimal.valueOf(transactionCategory.getBudgetedAmount());
                    totalSpendingByCategory.merge(categoryName, categorySpending, BigDecimal::add);
                    budgetedAmountByCategory.putIfAbsent(categoryName, BigDecimal.valueOf(transactionCategory.getBudgetedAmount()));
                }
                transactionIndex++;
            }
        }


        return null;
    }

    public Map<String, Category> loadBudgetPeriodCategories(final BudgetPeriod budgetPeriod, final Budget budget){
        return null;
    }


}
