package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.*;
import com.app.budgetbuddy.exceptions.BudgetPeriodException;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.budget.TransactionCategoryBuilder;
import com.app.budgetbuddy.workbench.categories.CategoryRuleEngine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TransactionCategoryRunner
{
    private final TransactionService transactionService;
    private final RecurringTransactionService recurringTransactionService;
    private final BudgetService budgetService;
    private final BudgetScheduleService budgetScheduleService;
    private final SubBudgetService subBudgetService;
    private final CategoryService categoryService;
    private final CategoryRuleEngine categoryRuleEngine;
    private final TransactionCategoryService transactionCategoryService;
    private final TransactionCategoryBuilder transactionCategoryBuilder;

    @Autowired
    public TransactionCategoryRunner(TransactionCategoryService transactionCategoryService,
                                     TransactionCategoryBuilder transactionCategoryBuilder,
                                     TransactionService transactionService,
                                     BudgetService budgetService,
                                     BudgetScheduleService budgetScheduleService,
                                     SubBudgetService subBudgetService,
                                     CategoryService categoryService,
                                     CategoryRuleEngine categoryRuleEngine,
                                     RecurringTransactionService recurringTransactionService)
    {
        this.transactionCategoryService = transactionCategoryService;
        this.transactionCategoryBuilder = transactionCategoryBuilder;
        this.transactionService = transactionService;
        this.budgetService = budgetService;
        this.budgetScheduleService = budgetScheduleService;
        this.subBudgetService = subBudgetService;
        this.categoryService = categoryService;
        this.categoryRuleEngine = categoryRuleEngine;
        this.recurringTransactionService = recurringTransactionService;
    }



    private Optional<BudgetSchedule> getBudgetScheduleParam(final Budget budget, final LocalDate startDate, final LocalDate endDate)
    {
        List<SubBudget> subBudgets = budget.getSubBudgets();
        Optional<BudgetSchedule> budgetScheduleOptional = Optional.empty();
        for(SubBudget subBudget : subBudgets)
        {
            List<BudgetSchedule> budgetSchedules = subBudget.getBudgetSchedule();
            for(BudgetSchedule budgetSchedule : budgetSchedules)
            {
                LocalDate budgetScheduleStartDate = budgetSchedule.getStartDate();
                LocalDate budgetScheduleEndDate = budgetSchedule.getEndDate();
                if(startDate.isAfter(budgetScheduleStartDate) && endDate.isBefore(budgetScheduleEndDate))
                {
                    budgetScheduleOptional = Optional.of(budgetSchedule);
                    break;
                }
            }
        }
        return budgetScheduleOptional;
    }

    /**
     * Processes and synchronizes all transaction categories for a user within a given date range.
     * This includes both regular and recurring transactions.
     */
    //TODO: Unit test this method and change output to boolean
    public void processTransactionCategories(Long userId, LocalDate startDate, LocalDate endDate)
    {
        log.info("Starting transaction category processing for user {} between {} and {}",
                userId, startDate, endDate);

        try
        {
            // 1. Get active budgets for the date range
            Optional<SubBudget> activeBudget = subBudgetService.getSubBudgetsByUserIdAndDate(userId, startDate, endDate);
            if(activeBudget.isEmpty())
            {
                return;
            }
            SubBudget subBudget = activeBudget.get();
            List<BudgetSchedule> budgetSchedules = subBudget.getBudgetSchedule();
            BudgetSchedule budgetSchedule = budgetSchedules.get(0);
            // Process each budget
            log.info("Process budget for startDate: {} endDate: {}", startDate, endDate);
            processBudgetTransactionCategories(subBudget, budgetSchedule, startDate, endDate);

        } catch (Exception e) {
            log.error("Error processing transaction categories for user {}: ", userId, e);
            throw new RuntimeException(
                    "Failed to process transaction categories", e);
        }
    }

    //TODO: Unit test this method and break it down into smaller methods
    private void processBudgetTransactionCategories(SubBudget budget,
                                                    BudgetSchedule budgetSchedule,
                                                    LocalDate startDate,
                                                    LocalDate endDate) {

        try {
            log.info("Processing budget {} for period {} to {}",
                    budget.getId(), startDate, endDate);

            // 1. Get existing transaction categories
            List<TransactionCategory> existingCategories =
                    transactionCategoryService.getTransactionCategoryListByBudgetIdAndDateRange(
                            budget.getId(), startDate, endDate);

            // 2. Get all transactions for the period
            List<Transaction> plaidTransactions =
                    transactionService.getConvertedPlaidTransactions(
                            budget.getBudget().getUserId(), startDate, endDate);

            // Verify transactions exist in database before proceeding
            List<String> plaidTransactionIds = plaidTransactions.stream()
                    .map(Transaction::getTransactionId)
                    .collect(Collectors.toList());
            List<String> existingTransactionIds = transactionService.findTransactionIdsByIds(plaidTransactionIds);

            // Filter to only include transactions that exist in database
            List<Transaction> validTransactions = plaidTransactions.stream()
                    .filter(t -> existingTransactionIds.contains(t.getTransactionId()))
                    .collect(Collectors.toList());

            // 3. Get recurring transactions
            List<RecurringTransaction> recurringTransactions =
                    recurringTransactionService.getRecurringTransactions(budget.getBudget().getUserId(), startDate, endDate);

            // 4. Create budget period
            BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, startDate, endDate);

            // 5. Process regular transactions (using validated transactions)
            List<TransactionCategory> newRegularCategories =
                    createNewTransactionCategories(validTransactions, budget, budgetSchedule, startDate, endDate);

            // 6. Process recurring transactions
            List<TransactionCategory> newRecurringCategories =
                    createNewRecurringTransactionCategories(
                            recurringTransactions, budget, budgetSchedule, startDate, endDate);

            // 7. Update existing categories with new transaction data (using validated transactions)
            List<TransactionCategory> updatedExistingCategories =
                    updateTransactionCategories(
                            existingCategories, validTransactions, budget, budgetSchedule, budgetPeriod);

            // 8. Merge all categories (existing and new)
            Set<TransactionCategory> allCategories = new HashSet<>();
            allCategories.addAll(updatedExistingCategories);
            allCategories.addAll(newRegularCategories);
            allCategories.addAll(newRecurringCategories);

            // 9. Batch save all categories
            batchSaveTransactionCategories(new ArrayList<>(allCategories));

            log.info("Successfully processed {} transaction categories for budget {}",
                    allCategories.size(), budget.getId());
        } catch (Exception e) {
            log.error("Error processing transaction categories for budget {}: ",
                    budget.getId(), e);
            throw new RuntimeException(
                    "Failed to process budget transaction categories", e);
        }
    }

    // TODO: Unit test this method
    public Boolean checkIfTransactionCategoryExists(TransactionCategory transactionCategory)
    {
        if (transactionCategory == null || transactionCategory.getSubBudgetId() == null)
        {
            return false;
        }

        List<TransactionCategoryEntity> existingCategories = transactionCategoryService
                .getTransactionCategoriesByBudgetIdAndDateRange(
                        transactionCategory.getSubBudgetId(),
                        transactionCategory.getStartDate(),
                        transactionCategory.getEndDate());

        return existingCategories.stream()
                .anyMatch(category ->
                        category.getCategory().getId().equals(transactionCategory.getCategoryId()) &&
                                category.getBudgetedAmount().equals(transactionCategory.getBudgetedAmount()));
    }

    public void batchSaveTransactionCategories(final List<TransactionCategory> transactionCategories){
        if (transactionCategories == null || transactionCategories.isEmpty()) {
            log.warn("No transaction categories to save");
            return;
        }


        try {
            for (TransactionCategory category : transactionCategories) {
                if (!checkIfTransactionCategoryExists(category)) {
                    saveCreatedTransactionCategory(category);
                } else {
                    log.info("Transaction category already exists: {}", category.getCategoryName());
                }
            }
        } catch (Exception e) {
            log.error("Error batch saving transaction categories: ", e);
            throw e;
        }
    }

    public void saveCreatedTransactionCategory(TransactionCategory transactionCategory){
        if (transactionCategory == null) {
            log.warn("Cannot save null transaction category");
            return;
        }

        try {
            log.info("Transaction Category: {}", transactionCategory.toString());
            TransactionCategoryEntity entity = convertToEntity(transactionCategory);
            transactionCategoryService.save(entity);
            log.info("Saved transaction category: {}", transactionCategory.getCategoryName());
        } catch (Exception e) {
            log.error("Error saving transaction category: {}", transactionCategory.getCategoryName(), e);
            throw e;
        }
    }

    //TODO: Unit test this method
    public List<TransactionCategory> createNewRecurringTransactionCategories(final List<RecurringTransaction> recurringTransactions, final SubBudget budget, BudgetSchedule budgetSchedule, final LocalDate startDate, final LocalDate endDate){
        if (recurringTransactions == null || recurringTransactions.isEmpty() || budget == null) {
            log.warn("Invalid parameters for creating recurring transaction categories");
            return new ArrayList<>();
        }

        try {
            BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, startDate, endDate);
            // Convert recurring transactions to regular transactions
            List<Transaction> transactions = convertRecurringToRegularTransactions(recurringTransactions);
            DateRange dateRange = new DateRange(startDate, endDate);
            Map<String, List<String>> categorizedRecurringTransactions = categoryRuleEngine.finalizeUserTransactionCategoriesForDateRange(recurringTransactions, budget.getBudget().getUserId(), dateRange);
            List<CategoryTransactions> categoryTransactions = buildCategoryTransactionsList(categorizedRecurringTransactions);
            categoryTransactions.forEach((categoryTransactions1 -> {
                log.info("Category Designator: {}", categoryTransactions1.toString());
            }) );
            return buildTransactionCategories(budget, budgetSchedule, budgetPeriod, categoryTransactions);
        } catch (Exception e) {
            log.error("Error creating recurring transaction categories: ", e);
            throw e;
        }
    }

    private boolean validateTransactionDatesMeetsBudgetPeriod(LocalDate budgetStartDate, LocalDate budgetEndDate, LocalDate transactionStartDate, LocalDate transactionEndDate){
        return !transactionStartDate.isBefore(budgetStartDate) &&
                !transactionEndDate.isAfter(budgetEndDate);
    }

    //TODO: Unit test this method
    public List<TransactionCategory> createNewTransactionCategories(final List<Transaction> transactions, SubBudget budget, BudgetSchedule budgetSchedule, LocalDate startDate, LocalDate endDate)
    {
        if (transactions == null || budget == null) {
            log.warn("Invalid parameters for creating transaction categories");
            return Collections.emptyList();
        }
        try
        {
            if(startDate == null || endDate == null)
            {
                throw new IllegalDateException("Illegal Start Date or EndDate: " + startDate + " " + endDate);
            }
            LocalDate budgetStartDate = budgetSchedule.getStartDate();
            LocalDate budgetEndDate = budgetSchedule.getEndDate();
            if(!validateTransactionDatesMeetsBudgetPeriod(budgetStartDate, budgetEndDate, startDate, endDate))
            {
                log.info("Transaction Dates: {} and {} don't meet the budget period dates: {} and {}", startDate, endDate, budgetStartDate, budgetEndDate);
                throw new BudgetPeriodException("Transaction dates don't meet the budget period dates");
            }
            else
            {
                BudgetPeriod budgetPeriod = new BudgetPeriod(Period.WEEKLY, startDate, endDate);
                // Convert transactions to CategoryDesignators
                Long userId = budget.getBudget().getUserId();
                DateRange dateRange = new DateRange(startDate, endDate);
                Map<String, List<String>> categorizedTransactions = categoryRuleEngine.finalizeUserTransactionCategoriesForDateRange(transactions, userId, dateRange);
                // Use the map to obtain the Transactions from the Transaction ids
                List<CategoryTransactions> categoryTransactions = buildCategoryTransactionsList(categorizedTransactions);
                categoryTransactions.forEach((categoryDesignator) -> {
                    log.info("Category Designator for new Transactions: {}", categoryDesignator.toString());
                });
                List<TransactionCategory> transactionCategories = buildTransactionCategories(budget, budgetSchedule, budgetPeriod, categoryTransactions);
                transactionCategories.forEach(transactionCategory -> {
                    log.info("Transaction Category: {}", transactionCategory.toString());
                });
                return transactionCategories;
            }
        }catch(IllegalDateException e){
            log.error("Unable to create transaction categories due to illegal date: ", e);
            throw e;
        }catch(BudgetPeriodException e){
            log.error("There was an error creating the transaction categories due to invalid transaction dates: ", e);
            throw e;
        }
    }

    private List<CategoryTransactions> buildCategoryTransactionsList(final Map<String, List<String>> transactionIdsByCategoryMap)
    {
        List<CategoryTransactions> categoryTransactionsList = new ArrayList<>();
        List<Transaction> transactions = new ArrayList<>();
        for(Map.Entry<String, List<String>> entry : transactionIdsByCategoryMap.entrySet())
        {
            String categoryName = entry.getKey();
            List<String> transactionIds = entry.getValue();
            for(String transactionId : transactionIds)
            {
                Transaction transaction = transactionService.findTransactionById(transactionId);
                transactions.add(transaction);
            }
            CategoryTransactions categoryTransactions = new CategoryTransactions(categoryName, transactions);
            categoryTransactionsList.add(categoryTransactions);
        }
        return categoryTransactionsList;
    }

    private List<TransactionCategory> buildTransactionCategories(final SubBudget budget, final BudgetSchedule budgetSchedule, final BudgetPeriod budgetPeriod, List<CategoryTransactions> categoryTransactions)
    {
        return transactionCategoryBuilder.initializeTransactionCategories(budget, budgetPeriod, budgetSchedule, categoryTransactions);
    }

    private boolean transactionExists(String transactionId)
    {
        Optional<TransactionsEntity> transactionsEntity = transactionService.getTransactionById(transactionId);
        return transactionsEntity.isPresent();
    }

    private List<CategoryPeriodSpending> createCategoryPeriodSpendingList(List<CategoryTransactions> categoryTransactions, final List<DateRange> budgetDateRanges)
    {
        if(budgetDateRanges == null || budgetDateRanges.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            return transactionCategoryBuilder.getCategorySpendingByCategoryDesignator(categoryTransactions, budgetDateRanges);

        }catch(Exception e){
            log.error("There was an error building the category period spending list: ", e);
            return Collections.emptyList();
        }
    }

    private List<CategoryBudget> createCategoryBudgetList(final SubBudget budget, final BudgetSchedule budgetSchedule, LocalDate budgetStartDate, LocalDate budgetEndDate, List<CategoryPeriodSpending> categoryPeriodSpendings, List<CategoryTransactions> categoryTransactions)
    {
        if(categoryTransactions == null || categoryTransactions.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            return transactionCategoryBuilder.createCategoryBudgets(budget, budgetSchedule, budgetStartDate, budgetEndDate, categoryPeriodSpendings, categoryTransactions);
        }catch(Exception e){
            log.error("There was an error building the category budget list: ", e);
            return Collections.emptyList();
        }
    }

    private List<DateRange> createBudgetDateRanges(LocalDate budgetStartDate, LocalDate budgetEndDate, Period period)
    {
        if(budgetStartDate == null || budgetEndDate == null)
        {
            return Collections.emptyList();
        }
        try
        {
            return transactionCategoryBuilder.buildBudgetDateRanges(budgetStartDate, budgetEndDate, period);
        }catch(Exception e){
            log.error("There was an error building the budget date ranges: ", e);
            return Collections.emptyList();
        }
    }

    // TODO: Unit test this method
    public List<TransactionCategory> updateTransactionCategories(final List<TransactionCategory> existingTransactionCategories, final List<Transaction> transactions, final SubBudget budget, final BudgetSchedule budgetSchedule, final BudgetPeriod budgetPeriod){
        if (existingTransactionCategories == null || transactions == null || budget == null) {
            log.warn("Invalid parameters for updating transaction categories");
            return new ArrayList<>();
        }
        try
        {
            // Categorize the new transactions
            Long userId = budget.getBudget().getUserId();
            LocalDate budgetStartDate = budgetSchedule.getStartDate();
            LocalDate budgetEndDate = budgetSchedule.getEndDate();
            Period period = budgetPeriod.getPeriod();
            List<DateRange> budgetDateRanges = createBudgetDateRanges(budgetStartDate, budgetEndDate, budgetPeriod.getPeriod());
            DateRange dateRange = new DateRange(budgetPeriod.getStartDate(), budgetPeriod.getEndDate());
            Map<String, List<String>> categorizedTransactions = categoryRuleEngine.finalizeUserTransactionCategoriesForDateRange(transactions, userId, dateRange);
            List<CategoryTransactions> categoryTransactionsList = buildCategoryTransactionsList(categorizedTransactions);
            List<CategoryPeriodSpending> categoryPeriodSpendings = createCategoryPeriodSpendingList(categoryTransactionsList, budgetDateRanges);
            List<CategoryBudget> categoryBudgets = createCategoryBudgetList(budget, budgetSchedule, budgetStartDate, budgetEndDate, categoryPeriodSpendings, categoryTransactionsList);
            return transactionCategoryBuilder.updateTransactionCategories(categoryBudgets, existingTransactionCategories);

        } catch (Exception e) {
            log.error("Error updating transaction categories: ", e);
            throw e;
        }
    }

    private BudgetEntity getBudgetEntityById(Long id){
        Optional<BudgetEntity> budgetEntityOptional = budgetService.findById(id);
        return budgetEntityOptional.orElse(null);
    }

    private CategoryEntity getCategoryEntityById(String categoryId){
        Optional<CategoryEntity> categoryEntityOptional = categoryService.findCategoryById(categoryId);
        try
        {
            return categoryEntityOptional.orElse(null);
        }catch(RuntimeException e){
            log.error("Category with id: {} not found", categoryId, e);
            throw e;
        }

    }

    private TransactionCategoryEntity convertToEntity(TransactionCategory transactionCategory) {
        // Implement conversion logic or use a converter service
        TransactionCategoryEntity entity = new TransactionCategoryEntity();
        entity.setBudgetedAmount(transactionCategory.getBudgetedAmount());
        entity.setActual(transactionCategory.getBudgetActual());
        entity.setStartDate(transactionCategory.getStartDate());
        entity.setEndDate(transactionCategory.getEndDate());
        entity.setIsactive(transactionCategory.getIsActive());
        entity.setIsOverSpent(transactionCategory.isOverSpent());
        entity.setOverspendingAmount(transactionCategory.getOverSpendingAmount());
        // Set Category Entity
        log.info("Finding category with id: {}", transactionCategory.getCategoryId());
        CategoryEntity categoryEntity = categoryService.findCategoryById(transactionCategory.getCategoryName())  // Try using the "name" as ID first
                .orElseGet(() -> {
                    // If it's not an ID, then try as a name
                    return categoryService.findCategoryByName(transactionCategory.getCategoryName())
                            .orElseThrow(() -> new IllegalStateException(
                                    "Could not find category for: " + transactionCategory.getCategoryName()));
                });
        entity.setCategory(categoryEntity);

        // Set Budget Entity
        BudgetEntity budgetEntity = budgetService.findById(transactionCategory.getSubBudgetId())
                .orElseThrow(() -> new IllegalStateException(
                        "Could not find budget with ID: " + transactionCategory.getSubBudgetId()));
        entity.setBudget(budgetEntity);
        // Set required transaction ID - use first transaction ID if available
//        if (transactionCategory.getTransactionIds() != null && !transactionCategory.getTransactionIds().isEmpty()) {
//            entity.setTransactions(Set.of(transactionCategory.getTransactionIds().get(0)));
//        }else{
//            throw new RuntimeException("No transaction IDs specified");
//        }

        // Set other fields as needed
        return entity;
    }

    private List<Transaction> convertRecurringToRegularTransactions(List<RecurringTransaction> recurringTransactions) {
        return recurringTransactions.stream()
                .map(recurring -> new Transaction(
                        recurring.getAccountId(),                          // accountId
                        recurring.getAmount(), // amount
                        "USD",                                            // isoCurrencyCode (default to USD)
                        Collections.singletonList(recurring.getCategoryId()), // categories
                        recurring.getCategoryId(),                        // categoryId
                        recurring.getFirstDate(),                         // date
                        recurring.getDescription(),                       // description
                        recurring.getMerchantName(),                      // merchantName
                        recurring.getDescription(),                       // name (using description)
                        false,                                           // pending (false for recurring)
                        recurring.getTransactionId(),                    // transactionId (generate new)
                        recurring.getFirstDate(),                        // authorizedDate
                        null,                                            // logoUrl
                        recurring.getFirstDate()                         // posted
                ))
                .collect(Collectors.toList());
    }
}
