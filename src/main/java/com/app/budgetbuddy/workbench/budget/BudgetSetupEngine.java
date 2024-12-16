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
import com.app.budgetbuddy.workbench.TransactionDataLoaderImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.support.AbstractLobCreatingPreparedStatementCallback;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Component
@Slf4j
public class BudgetSetupEngine
{
    private final UserService userService;
    private final BudgetService budgetService;
    private final BudgetGoalsService budgetGoalsService;
    private final CategoryService categoryService;
    private final RecurringTransactionService recurringTransactionService;
    private final TransactionCategoryService transactionCategoryService;
    private final BudgetCalculations budgetCalculations;
    private final TransactionCategoryBuilder budgetCategoryBuilder;
    private final TransactionService transactionService;

    @Autowired
    public BudgetSetupEngine(UserService userService,
                             BudgetService budgetService,
                             BudgetGoalsService budgetGoalsService,
                             CategoryService categoryService,
                             RecurringTransactionService recurringTransactionService,
                             TransactionCategoryService transactionCategoryService,
                             BudgetCalculations budgetCalculator,
                             TransactionCategoryBuilder budgetCategoryBuilder,
                             TransactionService transactionService){
        this.userService = userService;
        this.budgetService = budgetService;
        this.budgetGoalsService = budgetGoalsService;
        this.categoryService = categoryService;
        this.recurringTransactionService = recurringTransactionService;
        this.transactionCategoryService = transactionCategoryService;
        this.budgetCalculations = budgetCalculator;
        this.budgetCategoryBuilder = budgetCategoryBuilder;
        this.transactionService = transactionService;
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

    public List<DateRange> createDateRanges(final LocalDate startDate, final LocalDate endDate, final Period period){
        List<DateRange> dateRanges = new ArrayList<>();
        DateRange dateRange = new DateRange(startDate, endDate);
        switch(period){
            case DAILY -> {
                dateRanges.add(new DateRange(startDate, startDate));
                return dateRanges;
            }
            case BIWEEKLY -> {
                return dateRange.splitIntoBiWeeks();
            }
            case WEEKLY -> {
                return dateRange.splitIntoWeeks();
            }
            case MONTHLY -> {
                return dateRange.splitIntoMonths();
            }
            default -> {
                throw new IllegalDateException("Invalid period: " + period);
            }
        }
    }

    private BudgetGoals loadUserBudgetGoals(Long userId)
    {
        Optional<BudgetGoalsEntity> budgetGoalsEntity = budgetGoalsService.findByUserId(userId);
        if(budgetGoalsEntity.isEmpty())
        {
            throw new RuntimeException("There was an error with the userId: " + userId);
        }
        BudgetGoalsEntity budgetGoals = budgetGoalsEntity.get();
        return budgetGoalsService.convertToBudgetGoals(budgetGoals);
    }


    /**
     * Initializes the entire budget setup process
     * @return
     */
    public Boolean budgetSetupInitializer(final LocalDate startDate, final LocalDate endDate, final Period period, final Long userID){

        try {
            // Input validation
            if (startDate == null || endDate == null || period == null || userID == null || userID < 1L) {
                log.error("Invalid input parameters provided for budget setup");
                return false;
            }

            // 1. Create the Date Ranges based on period
            List<DateRange> dateRanges = createDateRanges(startDate, endDate, period);
            if (dateRanges.isEmpty()) {
                log.error("Failed to create date ranges for budget setup");
                return false;
            }

            // 2. Load Transactions for user
            List<Transaction> transactions = transactionService.getConvertedPlaidTransactions(userID, startDate, endDate);

            // 3. Load Recurring Transactions for user
            List<RecurringTransaction> recurringTransactions = recurringTransactionService.getRecurringTransactions(userID, startDate, endDate);

            // 4. Load or create user's budget
            Budget budget = loadUserBudget(userID);
            if (budget == null) {
                log.error("Failed to load budget for user: {}", userID);
                return false;
            }

            // 5. Load budget goals for user
            BudgetGoals budgetGoals = loadUserBudgetGoals(userID);

            // 6. Initialize transaction categories
            TreeMap<Long, List<TransactionCategory>> transactionCategoriesMap = createTransactionCategories(
                    recurringTransactions,
                    transactions,
                    budget,
                    dateRanges
            );
            log.info("Transaction Categories Map: {}", transactionCategoriesMap.size());

            // Save the Transaction Categories


            if (transactionCategoriesMap.isEmpty()) {
                log.warn("No transaction categories created for user: {}", userID);
                return false;
            }

            // 7. Create budget statistics
            List<BudgetStats> budgetStats = createBudgetStatistics(budget);
            for(BudgetStats budgetStat : budgetStats){
                log.info("Budget stats: {}", budgetStat.toString());
            }

            // 8. Create budget expense categories
            List<TransactionCategory> allTransactionCategories = transactionCategoriesMap.get(userID);
            if (allTransactionCategories != null) {
                List<BudgetCategory> expenseCategories = initializeBudgetExpenseCategory(
                        budget,
                        allTransactionCategories,
                        dateRanges
                );

                // 9. Create budget savings categories if budget goals exist
                if (budgetGoals != null) {
                    Map<DateRange, Budget> budgetMap = new HashMap<>();
                    for (DateRange range : dateRanges) {
                        budgetMap.put(range, budget);
                    }

                    List<BudgetCategory> savingsCategories = initializeBudgetSavingsCategories(
                            budgetGoals,
                            allTransactionCategories,
                            budgetMap,
                            dateRanges
                    );

                    // 10. Create top expense categories
                    List<BudgetCategory> topExpenseCategories = createTopBudgetExpenseCategories(
                            allTransactionCategories,
                            dateRanges
                    );

                    // If we've made it here, all initialization steps completed successfully
                    log.info("Successfully completed budget setup for user: {}", userID);
                    return true;
                }
            }

            log.warn("Budget setup completed with warnings for user: {}", userID);
            return false;

        } catch (Exception e) {
            log.error("Error during budget setup initialization for user: " + userID, e);
            return false;
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

    private void validateDateRangeParameters(DateRange dateRange)
    {
        try
        {
            LocalDate startDate = dateRange.getStartDate();
            LocalDate endDate = dateRange.getEndDate();
            if(startDate == null || endDate == null){
                throw new IllegalDateException("Start date or End date cannot be null");
            }
        }catch(IllegalDateException e){
            log.error("There was an error with one of the date range parameters: {}, {} ", dateRange.toString(), e.getMessage());
            throw e;
        }
    }

    private boolean isTransactionInDateRange(TransactionCategory transaction, DateRange dateRange) {
        LocalDate transactionStart = transaction.getStartDate();
        LocalDate transactionEnd = transaction.getEndDate();

        return !transactionStart.isAfter(dateRange.getEndDate()) &&
                !transactionEnd.isBefore(dateRange.getStartDate());
    }

    public List<BudgetCategory> initializeBudgetExpenseCategory(final Budget budget, final List<TransactionCategory> transactionCategories, final List<DateRange> dateRanges){
        if(budget == null || transactionCategories == null || dateRanges == null)
        {
            return Collections.emptyList();
        }
        List<BudgetCategory> budgetCategories = new ArrayList<>();
        for(DateRange dateRange : dateRanges)
        {
            if(dateRange == null)
            {
                log.warn("Skipping null date range....");
                continue;
            }
            validateDateRangeParameters(dateRange);
            int transactionIndex = 0;
            BigDecimal totalExpenses = BigDecimal.ZERO;
            BigDecimal budgetedAmount = budget.getBudgetAmount();
            while(transactionIndex < transactionCategories.size())
            {
                TransactionCategory transactionCategory = transactionCategories.get(transactionIndex);
                if(transactionCategory == null)
                {
                    transactionIndex++;
                    continue;
                }
                log.info("Grabbed the transaction category");
                if(isTransactionInDateRange(transactionCategory, dateRange)){
                    log.info("Inside if statement after date check");
                    BigDecimal transactionCategoryExpense = BigDecimal.valueOf(transactionCategory.getBudgetActual());
                    totalExpenses = totalExpenses.add(transactionCategoryExpense);
                    BigDecimal remainingOnBudget = budgetedAmount.subtract(totalExpenses);
                    final String expenseCategory = "Expenses";
                    BudgetCategory budgetCategory = new BudgetCategory(expenseCategory, budgetedAmount, totalExpenses, remainingOnBudget, dateRange);
                    budgetCategories.add(budgetCategory);
                }
                transactionIndex++;
            }
        }
        return budgetCategories;
    }

    private boolean isMonthlyAllocationPossible(final BigDecimal monthlyAllocation, final BigDecimal budgetAmount, final BigDecimal totalSpending)
    {
        if(monthlyAllocation == null || totalSpending == null || budgetAmount == null){
            log.info("Returning false from null values");
            return false;
        }
        // Check if budgeted amount can cover monthly allocation
        // First check if both budget amounts can cover monthly allocation
        double budgetAmountDouble = budgetAmount.doubleValue();
        double monthlyAllocationDouble = monthlyAllocation.doubleValue();
        if (budgetAmountDouble > monthlyAllocationDouble)
        {
            // Calculate remaining amount after spending for both budget and category
            BigDecimal remainingBudgetAmount = budgetAmount.subtract(totalSpending);
            log.info("Remaining budget amount: {}", remainingBudgetAmount);

            // Verify remaining amount can cover the monthly allocation
            return remainingBudgetAmount.compareTo(monthlyAllocation) >= 0;
        }
        log.info("Returning false from monthly allocation not possible");
        return false;
    }

    public List<BudgetCategory> initializeBudgetSavingsCategories(final BudgetGoals budgetGoals, final List<TransactionCategory> transactionCategories, final Map<DateRange, Budget> budgets, final List<DateRange> dateRanges)
    {
        List<BudgetCategory> savingsBudgetCategory = new ArrayList<>();
        if(budgetGoals == null || transactionCategories == null || budgets == null || dateRanges == null)
        {
            return savingsBudgetCategory;
        }

        BigDecimal targetSavingsAmount = BigDecimal.valueOf(budgetGoals.targetAmount());
        BigDecimal monthlyAllocation = BigDecimal.valueOf(budgetGoals.monthlyAllocation());
        BigDecimal totalSavings = new BigDecimal(0);
        for(DateRange dateRange : dateRanges)
        {
            int transactionIndex = 0;
            validateDateRangeParameters(dateRange);
            BigDecimal totalSpent = new BigDecimal(0);
            BigDecimal remainingOnBudget = BigDecimal.ZERO;
            Budget budget = budgets.get(dateRange);
            BigDecimal budgetAmount = budget.getBudgetAmount();
            if(budgetAmount.compareTo(BigDecimal.ZERO) > 0)
            {
                while(transactionIndex < transactionCategories.size())
                {
                    // Get the Budget with the correct date range
                    log.info("Budget amount for Date Range: {}, Budget Amount: {} ", dateRange.toString(), budgetAmount);
                    TransactionCategory transactionCategory = transactionCategories.get(transactionIndex);
                    // Check if the transaction category is within the given date range (i.e. month ranges).
                    if(isTransactionInDateRange(transactionCategory, dateRange))
                    {
                        // Get the total spent on the transaction category
                        BigDecimal totalSpentOnCategory = BigDecimal.valueOf(transactionCategory.getBudgetActual());

                        // Add the total spent on the category to the total spent overall
                        totalSpent = totalSpent.add(totalSpentOnCategory);
                        log.info("Total spent on category: " + totalSpentOnCategory);
                        // How much is remaining in our budget after spending in the transaction category
                        remainingOnBudget = budgetAmount.subtract(totalSpentOnCategory);
                        log.info("Remaining budget: " + remainingOnBudget);
                    }
                    transactionIndex++;
                }

            }
            else
            {
                return savingsBudgetCategory;
            }
            log.info("Total Spending: " + totalSpent);
            log.info("Monthly Allocation: " + monthlyAllocation);
            log.info("Budget Amount: " + budgetAmount);
            if(isMonthlyAllocationPossible(monthlyAllocation, budgetAmount, totalSpent))
            {
                log.info("Entering Monthly allocation ");
                totalSavings = totalSavings.add(monthlyAllocation);
                BigDecimal savingsForMonth = totalSavings;
                log.info("Total Savings: " + totalSavings);
                BigDecimal remainingSavings = targetSavingsAmount.subtract(totalSavings);
                BudgetCategory budgetCategory = new BudgetCategory("Savings", monthlyAllocation, savingsForMonth, remainingSavings, dateRange);
                log.info("Adding savings category: " + budgetCategory.toString());
                savingsBudgetCategory.add(budgetCategory);
            }

        }
        return savingsBudgetCategory;
    }

    public List<BudgetCategory> createTopBudgetExpenseCategories(final List<TransactionCategory> transactionCategories, final List<DateRange> dateRanges)
    {
        List<BudgetCategory> topBudgetExpenseCategories = new ArrayList<>();
        if(transactionCategories == null || dateRanges == null)
        {
            return topBudgetExpenseCategories;
        }

        for(DateRange dateRange : dateRanges)
        {
            int transactionIndex = 0;
            while(transactionIndex < transactionCategories.size())
            {
                TransactionCategory transactionCategory = transactionCategories.get(transactionIndex);
                if(transactionCategory != null)
                {
                    String categoryName = transactionCategory.getCategoryName();
                    BigDecimal categoryBudget = BigDecimal.valueOf(transactionCategory.getBudgetedAmount());
                    BigDecimal categorySpending = BigDecimal.valueOf(transactionCategory.getBudgetActual());
                    BigDecimal remainingAmount = categoryBudget.subtract(categorySpending);
                    BudgetCategory budgetCategory = new BudgetCategory(categoryName, categoryBudget, categorySpending, remainingAmount, dateRange);
                    topBudgetExpenseCategories.add(budgetCategory);
                }
                transactionIndex++;
            }
        }

        return topBudgetExpenseCategories.stream()
                .sorted(Comparator.comparing(BudgetCategory::getActualAmount).reversed())
                .limit(5)
                .collect(Collectors.toList());
    }

    public List<Transaction> getTransactionsByDate(LocalDate date, Long userId)
    {
        List<Transaction> postedTransactionsByDate = new ArrayList<>();
        if(date == null)
        {
            return postedTransactionsByDate;
        }
        return transactionService.getTransactionsByDate(date, userId);
    }

    public List<BudgetCategory> loadDailyBudgetPeriodData(final LocalDate date, final List<TransactionCategory> transactionCategories, final Budget budget)
    {
        List<BudgetCategory> budgetCategories = new ArrayList<>();
        if(date == null || transactionCategories == null)
        {
            return budgetCategories;
        }
        Long userId = budget.getUserId();
        for(TransactionCategory transactionCategory : transactionCategories)
        {
            if(transactionCategory != null)
            {
                LocalDate transactionCategoryStartDate = transactionCategory.getStartDate();
                LocalDate transactionCategoryEndDate = transactionCategory.getEndDate();
                log.info("Entering if loop with date boolean check");
                if(date.isAfter(transactionCategoryStartDate) && date.isBefore(transactionCategoryEndDate))
                {
                    log.info("Entered if loop with date boolean check");
                    String categoryName = transactionCategory.getCategoryName();
                    BigDecimal categoryBudget = BigDecimal.valueOf(transactionCategory.getBudgetedAmount());
                    log.info("Grabbing Transactions with date: {} and userId: {}", date, userId);
                    List<Transaction> transactionsByPostedDate = getTransactionsByDate(date, userId);
                    log.info("Transaction List size: " + transactionsByPostedDate.size());
                    BigDecimal totalSpendingForDay = BigDecimal.ZERO;
                    int transactionIndex = 0;
                    BigDecimal remainingOnBudgetForDay = BigDecimal.ZERO;
                    while(transactionIndex < transactionsByPostedDate.size())
                    {
                        Transaction transaction = transactionsByPostedDate.get(transactionIndex);
                        log.info("Transaction: " + transaction.toString());
                        if(transaction.getCategories().stream()
                                .anyMatch(cat -> cat.equalsIgnoreCase(categoryName)))
                        {
                            BigDecimal amount = transaction.getAmount();
                            log.info("Transaction Amount: " + amount);
                            totalSpendingForDay = totalSpendingForDay.add(amount);
                            remainingOnBudgetForDay = categoryBudget.subtract(totalSpendingForDay);
                            log.info("Total spending For Day: " + totalSpendingForDay);
                        }
                        transactionIndex++;
                    }
                    DateRange sameDate = new DateRange(date, date);
                    BudgetCategory budgetCategory = new BudgetCategory(categoryName, categoryBudget, totalSpendingForDay, remainingOnBudgetForDay, sameDate);
                    log.info("Budget Category: " + budgetCategory.toString());
                    budgetCategories.add(budgetCategory);
                }
            }
        }
        return budgetCategories;
    }

    public List<BudgetCategory> loadWeeklyBudgetPeriodData(final List<DateRange> weekRanges, final List<TransactionCategory> transactionCategories)
    {
        List<BudgetCategory> budgetCategories = new ArrayList<>();
        if(weekRanges == null || transactionCategories == null)
        {
            return budgetCategories;
        }

        // Iterate through the weeks
            int transactionIndex = 0;
            while(transactionIndex < transactionCategories.size())
            {
                TransactionCategory transactionCategory = transactionCategories.get(transactionIndex);
                if(transactionCategory != null)
                {
                    LocalDate transactionCategoryStartDate = transactionCategory.getStartDate();
                    LocalDate transactionCategoryEndDate = transactionCategory.getEndDate();
                        String categoryName = transactionCategory.getCategoryName();
                        BigDecimal categoryBudgetedAmount = BigDecimal.valueOf(transactionCategory.getBudgetedAmount());
                        BigDecimal categoryActualAmount = BigDecimal.valueOf(transactionCategory.getBudgetActual());
                        BigDecimal remainingAmount = categoryBudgetedAmount.subtract(categoryActualAmount);
                        BudgetCategory budgetCategory = new BudgetCategory(
                                categoryName,
                                categoryBudgetedAmount,
                                categoryActualAmount,
                                remainingAmount,
                                new DateRange(transactionCategoryStartDate, transactionCategoryEndDate));
                        log.info("Budget Category: " + budgetCategory.toString());
                        budgetCategories.add(budgetCategory);
                }
                transactionIndex++;
            }

        return budgetCategories;
    }

    public List<BudgetCategory> loadBiWeeklyBudgetPeriodData(final List<DateRange> dateRanges, final List<TransactionCategory> transactionCategories){
        List<BudgetCategory> biWeeklyBudgetCategories = new ArrayList<>();
        if(dateRanges == null || transactionCategories == null || dateRanges.size() != 2)
        {
            return biWeeklyBudgetCategories;
        }

        for(TransactionCategory transactionCategory : transactionCategories)
        {
            if(transactionCategory != null)
            {
                LocalDate transactionCategoryStartDate = transactionCategory.getStartDate();
                LocalDate transactionCategoryEndDate = transactionCategory.getEndDate();
                for(DateRange biWeek : dateRanges)
                {
                    LocalDate biWeekStartDate = biWeek.getStartDate();
                    LocalDate biWeekEndDate = biWeek.getEndDate();
                    if(transactionCategoryStartDate.isAfter(biWeekStartDate) && transactionCategoryEndDate.isBefore(biWeekEndDate))
                    {
                        String categoryName = transactionCategory.getCategoryName();
                        BigDecimal categoryBudgetedAmount = BigDecimal.valueOf(transactionCategory.getBudgetedAmount());
                        BigDecimal categoryActualAmount = BigDecimal.valueOf(transactionCategory.getBudgetActual());
                        BigDecimal remainingAmount = categoryBudgetedAmount.subtract(categoryActualAmount);
                        BudgetCategory budgetCategory = new BudgetCategory(categoryName, categoryBudgetedAmount, categoryActualAmount, remainingAmount, new DateRange(biWeekStartDate, biWeekEndDate));
                        log.info("Budget Category: " + budgetCategory.toString());
                        biWeeklyBudgetCategories.add(budgetCategory);
                    }
                }
            }
        }
        return biWeeklyBudgetCategories;
    }

    public List<BudgetCategory> loadBudgetPeriodData(final Period period, final LocalDate startDate, final LocalDate endDate, final Budget budget)
    {
        List<BudgetCategory> budgetCategories = new ArrayList<>();

        // Load the Transaction Categories
        List<TransactionCategory> transactionCategories = transactionCategoryService.getTransactionCategoryListByBudgetIdAndDateRange(budget.getId(), startDate, endDate);
        DateRange defaultDateRange = new DateRange(startDate, endDate);
        switch(period){
            case DAILY -> {
                if(startDate.isEqual(endDate))
                {
                    return loadDailyBudgetPeriodData(startDate, transactionCategories, budget);
                }
            }
            case WEEKLY -> {
                List<DateRange> weeklyRanges = defaultDateRange.splitIntoWeeks();
                return loadWeeklyBudgetPeriodData(weeklyRanges, transactionCategories);
            }
            case BIWEEKLY -> {
                return loadBiWeeklyBudgetPeriodData(defaultDateRange.splitIntoBiWeeks(), transactionCategories);
            }
            case MONTHLY -> {
                return loadMonthlyBudgetPeriodData(defaultDateRange, transactionCategories);
            }
            default -> {
                throw new IllegalStateException("Unexpected value: " + period);
            }
        }
        return budgetCategories;
    }

    public List<BudgetCategory> loadMonthlyBudgetPeriodData(final DateRange monthlyDateRange, final List<TransactionCategory> transactionCategories){
        List<BudgetCategory> monthlyBudgetCategories = new ArrayList<>();
        if(monthlyDateRange == null || transactionCategories == null) {
            return monthlyBudgetCategories;
        }

        for(TransactionCategory transactionCategory : transactionCategories) {
            if(transactionCategory != null) {
                LocalDate transactionCategoryStartDate = transactionCategory.getStartDate();
                LocalDate transactionCategoryEndDate = transactionCategory.getEndDate();

                LocalDate monthStartDate = monthlyDateRange.getStartDate();
                LocalDate monthEndDate = monthlyDateRange.getEndDate();

                if(transactionCategoryStartDate.isAfter(monthStartDate) && transactionCategoryEndDate.isBefore(monthEndDate)) {
                    String categoryName = transactionCategory.getCategoryName();
                    BigDecimal categoryBudgetedAmount = BigDecimal.valueOf(transactionCategory.getBudgetedAmount());
                    BigDecimal categoryActualAmount = BigDecimal.valueOf(transactionCategory.getBudgetActual());
                    BigDecimal remainingAmount = categoryBudgetedAmount.subtract(categoryActualAmount);
                    BudgetCategory budgetCategory = new BudgetCategory(
                            categoryName,
                            categoryBudgetedAmount,
                            categoryActualAmount,
                            remainingAmount,
                            new DateRange(monthStartDate, monthEndDate)
                    );
                    log.info("Budget Category: " + budgetCategory.toString());
                    monthlyBudgetCategories.add(budgetCategory);
                }
            }
        }
        return monthlyBudgetCategories;
    }


}
