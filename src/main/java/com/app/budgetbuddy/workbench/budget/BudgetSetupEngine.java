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
    private final CategoryService categoryService;
    private final RecurringTransactionService recurringTransactionService;
    private final TransactionCategoryService transactionCategoryService;
    private final BudgetCalculations budgetCalculations;
    private final TransactionCategoryBuilder budgetCategoryBuilder;
    private final TransactionService transactionService;

    @Autowired
    public BudgetSetupEngine(UserService userService,
                             BudgetService budgetService,
                             CategoryService categoryService,
                             RecurringTransactionService recurringTransactionService,
                             TransactionCategoryService transactionCategoryService,
                             BudgetCalculations budgetCalculator,
                             TransactionCategoryBuilder budgetCategoryBuilder,
                             TransactionService transactionService){
        this.userService = userService;
        this.budgetService = budgetService;
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
    
    public void setupBudgetPeriodData(Long userId, BudgetPeriod budgetPeriod)
    {

    }

    private BudgetGoalsEntity loadUserBudgetGoals(Long userId)
    {
        return null;
    }


    /**
     * Initializes the entire budget setup process
     * @return
     */
    public Boolean budgetSetupInitializer(){
        return null;
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
        for(DateRange weekRange : weekRanges)
        {
            LocalDate WeekStartDate = weekRange.getStartDate();
            LocalDate WeekEndDate = weekRange.getEndDate();
            int transactionIndex = 0;
            while(transactionIndex < transactionCategories.size())
            {
                TransactionCategory transactionCategory = transactionCategories.get(transactionIndex);
                if(transactionCategory != null)
                {

                }
                transactionIndex++;
            }
        }

        return null;
    }

    public List<BudgetCategory> loadBiWeeklyBudgetPeriodData(final List<DateRange> dateRanges, final List<TransactionCategory> transactionCategories){
        return null;
    }

    public List<BudgetCategory> loadMonthlyBudgetPeriodData(final DateRange monthlyDateRange, final List<TransactionCategory> transactionCategories){
        return null;
    }

    public Map<String, Category> loadBudgetPeriodCategories(final Period period, final List<DateRange> dateRanges, final Budget budget){
        return null;
    }


}
