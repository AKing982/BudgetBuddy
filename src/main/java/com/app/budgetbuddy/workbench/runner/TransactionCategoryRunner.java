package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.*;
import com.app.budgetbuddy.exceptions.BudgetPeriodException;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.budget.BudgetCategoryBuilder;
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
    private final BudgetCategoryService budgetCategoryService;
    private final BudgetCategoryBuilder budgetCategoryBuilder;

    @Autowired
    public TransactionCategoryRunner(BudgetCategoryService budgetCategoryService,
                                     BudgetCategoryBuilder budgetCategoryBuilder,
                                     TransactionService transactionService,
                                     BudgetService budgetService,
                                     BudgetScheduleService budgetScheduleService,
                                     SubBudgetService subBudgetService,
                                     CategoryService categoryService,
                                     CategoryRuleEngine categoryRuleEngine,
                                     RecurringTransactionService recurringTransactionService)
    {
        this.budgetCategoryService = budgetCategoryService;
        this.budgetCategoryBuilder = budgetCategoryBuilder;
        this.transactionService = transactionService;
        this.budgetService = budgetService;
        this.budgetScheduleService = budgetScheduleService;
        this.subBudgetService = subBudgetService;
        this.categoryService = categoryService;
        this.categoryRuleEngine = categoryRuleEngine;
        this.recurringTransactionService = recurringTransactionService;
    }

    /**
     * Processes and synchronizes all transaction categories for a user within a given date range.
     * This includes both regular and recurring transactions.
     */
    //TODO: Unit test this method and change output to boolean
    public void processTransactionCategories(Long userId, LocalDate startDate, LocalDate endDate)
    {
//        log.info("Starting transaction category processing for user {} between {} and {}",
//                userId, startDate, endDate);
//
//        try
//        {
//            // 1. Get active budgets for the date range
//            Optional<SubBudget> activeBudget = subBudgetService.getSubBudgetsByUserIdAndDate(userId, startDate, endDate);
//            if(activeBudget.isEmpty())
//            {
//                return;
//            }
//            SubBudget subBudget = activeBudget.get();
//            List<BudgetSchedule> budgetSchedules = subBudget.getBudgetSchedule();
//            BudgetSchedule budgetSchedule = budgetSchedules.get(0);
//            // Process each budget
//            log.info("Process budget for startDate: {} endDate: {}", startDate, endDate);
//            processBudgetTransactionCategories(subBudget, budgetSchedule, startDate, endDate);
//
//        } catch (Exception e) {
//            log.error("Error processing transaction categories for user {}: ", userId, e);
//            throw new RuntimeException(
//                    "Failed to process transaction categories", e);
//        }
    }

    //TODO: Unit test this method and break it down into smaller methods
    private void processBudgetTransactionCategories(SubBudget budget,
                                                    BudgetSchedule budgetSchedule,
                                                    LocalDate startDate,
                                                    LocalDate endDate) {

//        try
//        {
//            log.info("Processing budget {} for period {} to {}",
//                    budget.getId(), startDate, endDate);
//
//            // 1. Get existing transaction categories
//            List<TransactionCategory> existingCategories =
//                    transactionCategoryService.getTransactionCategoryListByBudgetIdAndDateRange(
//                            budget.getId(), startDate, endDate);
//
//            // 2. Get all transactions for the period
//            List<Transaction> plaidTransactions =
//                    transactionService.getConvertedPlaidTransactions(
//                            budget.getBudget().getUserId(), startDate, endDate);
//
//            // Verify transactions exist in database before proceeding
//            List<String> plaidTransactionIds = plaidTransactions.stream()
//                    .map(Transaction::getTransactionId)
//                    .collect(Collectors.toList());
//            List<String> existingTransactionIds = transactionService.findTransactionIdsByIds(plaidTransactionIds);
//
//            // Filter to only include transactions that exist in database
//            List<Transaction> validTransactions = plaidTransactions.stream()
//                    .filter(t -> existingTransactionIds.contains(t.getTransactionId()))
//                    .collect(Collectors.toList());
//
//            // 3. Get recurring transactions
//            List<RecurringTransaction> recurringTransactions =
//                    recurringTransactionService.getRecurringTransactions(budget.getBudget().getUserId(), startDate, endDate);
//
//            // 4. Create budget period
//            BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, startDate, endDate);
//
//            // 5. Process regular transactions (using validated transactions)
//            List<TransactionCategory> newRegularCategories =
//                    createNewTransactionCategories(validTransactions, budget, budgetSchedule, startDate, endDate);
//
//            // 6. Process recurring transactions
//            List<TransactionCategory> newRecurringCategories =
//                    createNewRecurringTransactionCategories(
//                            recurringTransactions, budget, budgetSchedule, startDate, endDate);
//
//            // 7. Update existing categories with new transaction data (using validated transactions)
//            List<TransactionCategory> updatedExistingCategories =
//                    updateTransactionCategories(
//                            existingCategories, validTransactions, budget, budgetSchedule, budgetPeriod);
//
//            // 8. Merge all categories (existing and new)
//            Set<TransactionCategory> allCategories = new HashSet<>();
//            allCategories.addAll(updatedExistingCategories);
//            allCategories.addAll(newRegularCategories);
//            allCategories.addAll(newRecurringCategories);
//
//            // 9. Batch save all categories
//            batchSaveTransactionCategories(new ArrayList<>(allCategories));
//
//            log.info("Successfully processed {} transaction categories for budget {}",
//                    allCategories.size(), budget.getId());
//        } catch (Exception e) {
//            log.error("Error processing transaction categories for budget {}: ",
//                    budget.getId(), e);
//            throw new RuntimeException(
//                    "Failed to process budget transaction categories", e);
//        }

    }

    // TODO: Unit test this method
    public Boolean checkIfTransactionCategoryExists(BudgetCategory budgetCategory)
    {
        if (budgetCategory == null || budgetCategory.getSubBudgetId() == null)
        {
            return false;
        }

        List<BudgetCategoryEntity> existingCategories = budgetCategoryService
                .getBudgetCategoriesByBudgetIdAndDateRange(
                        budgetCategory.getSubBudgetId(),
                        budgetCategory.getStartDate(),
                        budgetCategory.getEndDate());

        return existingCategories.stream()
                .anyMatch(category ->
                        category.getCategory().getName().equals(budgetCategory.getCategoryName()) &&
                                category.getBudgetedAmount().equals(budgetCategory.getBudgetedAmount()));
    }

    public void batchSaveTransactionCategories(final List<BudgetCategory> transactionCategories){
        if (transactionCategories == null || transactionCategories.isEmpty()) {
            log.warn("No transaction categories to save");
            return;
        }


        try {
            for (BudgetCategory category : transactionCategories) {
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

    public void saveCreatedTransactionCategory(BudgetCategory transactionCategory){
        if (transactionCategory == null) {
            log.warn("Cannot save null transaction category");
            return;
        }

        try {
            log.info("Transaction Category: {}", transactionCategory.toString());
            BudgetCategoryEntity entity = convertToEntity(transactionCategory);
            budgetCategoryService.save(entity);
            log.info("Saved transaction category: {}", transactionCategory.getCategoryName());
        } catch (Exception e) {
            log.error("Error saving transaction category: {}", transactionCategory.getCategoryName(), e);
            throw e;
        }
    }

    //TODO: Unit test this method
    public List<BudgetCategory> createNewRecurringTransactionCategories(final List<RecurringTransaction> recurringTransactions, final SubBudget budget, BudgetSchedule budgetSchedule, final LocalDate startDate, final LocalDate endDate){
//        if (recurringTransactions == null || recurringTransactions.isEmpty() || budget == null) {
//            log.warn("Invalid parameters for creating recurring transaction categories");
//            return new ArrayList<>();
//        }
//
//        try {
//            BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, startDate, endDate);
//            // Convert recurring transactions to regular transactions
//            DateRange dateRange = new DateRange(startDate, endDate);
//            Map<String, List<String>> categorizedRecurringTransactions = categoryRuleEngine.finalizeUserTransactionCategoriesForDateRange(recurringTransactions, budget.getBudget().getUserId(), dateRange);
//            List<CategoryTransactions> categoryTransactions = buildCategoryTransactionsList(categorizedRecurringTransactions);
//            categoryTransactions.forEach((categoryTransactions1 -> {
//                log.info("Category Designator: {}", categoryTransactions1.toString());
//            }) );
//            return buildTransactionCategories(budget, budgetSchedule, budgetPeriod, categoryTransactions);
//        } catch (Exception e) {
//            log.error("Error creating recurring transaction categories: ", e);
//            throw e;
//        }
        return null;
    }

    private boolean validateTransactionDatesMeetsBudgetPeriod(LocalDate budgetStartDate, LocalDate budgetEndDate, LocalDate transactionStartDate, LocalDate transactionEndDate){
        return !transactionStartDate.isBefore(budgetStartDate) &&
                !transactionEndDate.isAfter(budgetEndDate);
    }

    //TODO: Unit test this method
    public List<BudgetCategory> createNewTransactionCategories(final List<Transaction> transactions, SubBudget subBudget, BudgetSchedule budgetSchedule, LocalDate startDate, LocalDate endDate)
    {
//        if (transactions == null || subBudget == null) {
//            log.warn("Invalid parameters for creating transaction categories");
//            return Collections.emptyList();
//        }
//        try
//        {
//            if(startDate == null || endDate == null)
//            {
//                throw new IllegalDateException("Illegal Start Date or EndDate: " + startDate + " " + endDate);
//            }
//            LocalDate budgetStartDate = budgetSchedule.getStartDate();
//            LocalDate budgetEndDate = budgetSchedule.getEndDate();
//            if(!validateTransactionDatesMeetsBudgetPeriod(budgetStartDate, budgetEndDate, startDate, endDate))
//            {
//                log.info("Transaction Dates: {} and {} don't meet the budget period dates: {} and {}", startDate, endDate, budgetStartDate, budgetEndDate);
//                throw new BudgetPeriodException("Transaction dates don't meet the budget period dates");
//            }
//            else
//            {
//                BudgetPeriod budgetPeriod = new BudgetPeriod(Period.WEEKLY, startDate, endDate);
//                // Convert transactions to CategoryDesignators
//                Long userId = subBudget.getBudget().getUserId();
//                DateRange dateRange = new DateRange(startDate, endDate);
//                Map<String, List<String>> categorizedTransactions = categoryRuleEngine.finalizeUserTransactionCategoriesForDateRange(transactions, userId, dateRange);
//                // Use the map to obtain the Transactions from the Transaction ids
//                List<CategoryTransactions> categoryTransactions = buildCategoryTransactionsList(categorizedTransactions);
//                categoryTransactions.forEach((categoryDesignator) -> {
//                    log.info("Category Designator for new Transactions: {}", categoryDesignator.toString());
//                });
//                List<TransactionCategory> transactionCategories = buildTransactionCategories(subBudget, budgetSchedule, budgetPeriod, categoryTransactions);
//                transactionCategories.forEach(transactionCategory -> {
//                    log.info("Transaction Category: {}", transactionCategory.toString());
//                });
//                return transactionCategories;
//            }
//        }catch(IllegalDateException e){
//            log.error("Unable to create transaction categories due to illegal date: ", e);
//            throw e;
//        }catch(BudgetPeriodException e){
//            log.error("There was an error creating the transaction categories due to invalid transaction dates: ", e);
//            throw e;
//        }
        return null;
    }

    private List<CategoryTransactions> buildCategoryTransactionsList(final Map<String, List<String>> transactionIdsByCategoryMap)
    {
//        List<CategoryTransactions> categoryTransactionsList = new ArrayList<>();
//        List<Transaction> transactions = new ArrayList<>();
//        for(Map.Entry<String, List<String>> entry : transactionIdsByCategoryMap.entrySet())
//        {
//            String categoryName = entry.getKey();
//            List<String> transactionIds = entry.getValue();
//            for(String transactionId : transactionIds)
//            {
//                Optional<Transaction> transactionOptional = transactionService.findTransactionById(transactionId);
//                if(transactionOptional.isEmpty())
//                {
//                    log.info("Skipping transaction with id: {}", transactionId);
//                    continue;
//                }
//                Transaction transaction = transactionOptional.get();
//                transactions.add(transaction);
//            }
//            CategoryTransactions categoryTransactions = new CategoryTransactions(categoryName, transactions);
//            categoryTransactionsList.add(categoryTransactions);
//        }
//        return categoryTransactionsList;
        return null;
    }

    private List<BudgetCategory> buildTransactionCategories(final SubBudget budget, final BudgetSchedule budgetSchedule, final BudgetPeriod budgetPeriod, List<CategoryTransactions> categoryTransactions)
    {
//        return transactionCategoryBuilder.initializeTransactionCategories(budget, budgetPeriod, budgetSchedule, categoryTransactions);
        return null;
    }

    private boolean transactionExists(String transactionId)
    {
        Optional<TransactionsEntity> transactionsEntity = transactionService.getTransactionById(transactionId);
        return transactionsEntity.isPresent();
    }

    private List<CategoryPeriodSpending> createCategoryPeriodSpendingList(List<CategoryTransactions> categoryTransactions, final List<DateRange> budgetDateRanges)
    {
//        if(budgetDateRanges == null || budgetDateRanges.isEmpty())
//        {
//            return Collections.emptyList();
//        }
//        try
//        {
//            return transactionCategoryBuilder.getCategorySpendingByCategoryDesignator(categoryTransactions, budgetDateRanges);
//
//        }catch(Exception e){
//            log.error("There was an error building the category period spending list: ", e);
//            return Collections.emptyList();
//        }
        return null;
    }

    private List<BudgetCategoryCriteria> createCategoryBudgetList(final SubBudget budget, final BudgetSchedule budgetSchedule, LocalDate budgetStartDate, LocalDate budgetEndDate, List<CategoryPeriodSpending> categoryPeriodSpendings, List<CategoryTransactions> categoryTransactions)
    {
//        if(categoryTransactions == null || categoryTransactions.isEmpty())
//        {
//            return Collections.emptyList();
//        }
//        try
//        {
//            return transactionCategoryBuilder.createCategoryBudgets(budget, budgetSchedule, budgetStartDate, budgetEndDate, categoryPeriodSpendings, categoryTransactions);
//        }catch(Exception e){
//            log.error("There was an error building the category budget list: ", e);
//            return Collections.emptyList();
//        }
        return null;
    }

    private List<DateRange> createBudgetDateRanges(LocalDate budgetStartDate, LocalDate budgetEndDate, Period period)
    {
//        if(budgetStartDate == null || budgetEndDate == null)
//        {
//            return Collections.emptyList();
//        }
//        try
//        {
//            return transactionCategoryBuilder.buildBudgetDateRanges(budgetStartDate, budgetEndDate, period);
//        }catch(Exception e){
//            log.error("There was an error building the budget date ranges: ", e);
//            return Collections.emptyList();
//        }
        return null;
    }

//    // TODO: Unit test this method
//    public List<TransactionCategory> updateTransactionCategories(final List<TransactionCategory> existingTransactionCategories, final List<Transaction> transactions, final SubBudget budget, final BudgetSchedule budgetSchedule, final BudgetPeriod budgetPeriod){
//        if (existingTransactionCategories == null || transactions == null || budget == null) {
//            log.warn("Invalid parameters for updating transaction categories");
//            return new ArrayList<>();
//        }
//        try
//        {
//            // Categorize the new transactions
//            Long userId = budget.getBudget().getUserId();
//            LocalDate budgetStartDate = budgetSchedule.getStartDate();
//            LocalDate budgetEndDate = budgetSchedule.getEndDate();
//            Period period = budgetPeriod.getPeriod();
//            List<DateRange> budgetDateRanges = createBudgetDateRanges(budgetStartDate, budgetEndDate, budgetPeriod.getPeriod());
//            DateRange dateRange = new DateRange(budgetPeriod.getStartDate(), budgetPeriod.getEndDate());
//            Map<String, List<String>> categorizedTransactions = categoryRuleEngine.finalizeUserTransactionCategoriesForDateRange(transactions, userId, dateRange);
//            List<CategoryTransactions> categoryTransactionsList = buildCategoryTransactionsList(categorizedTransactions);
//            List<CategoryPeriodSpending> categoryPeriodSpendings = createCategoryPeriodSpendingList(categoryTransactionsList, budgetDateRanges);
//            List<CategoryBudget> categoryBudgets = createCategoryBudgetList(budget, budgetSchedule, budgetStartDate, budgetEndDate, categoryPeriodSpendings, categoryTransactionsList);
//            return transactionCategoryBuilder.updateTransactionCategories(categoryBudgets, existingTransactionCategories);
//
//        } catch (Exception e) {
//            log.error("Error updating transaction categories: ", e);
//            throw e;
//        }
//    }

    private BudgetCategoryEntity convertToEntity(BudgetCategory transactionCategory) {
        // Implement conversion logic or use a converter service
        BudgetCategoryEntity entity = new BudgetCategoryEntity();
        entity.setBudgetedAmount(transactionCategory.getBudgetedAmount());
        entity.setActual(transactionCategory.getBudgetActual());
        entity.setStartDate(transactionCategory.getStartDate());
        entity.setEndDate(transactionCategory.getEndDate());
        entity.setIsactive(transactionCategory.getIsActive());
        entity.setIsOverSpent(transactionCategory.isOverSpent());
        entity.setOverspendingAmount(transactionCategory.getOverSpendingAmount());
        // Set Category Entity
        log.info("Finding category with name: {}", transactionCategory.getCategoryName());
        CategoryEntity categoryEntity = categoryService.findCategoryById(transactionCategory.getCategoryName())  // Try using the "name" as ID first
                .orElseGet(() -> {
                    // If it's not an ID, then try as a name
                    return categoryService.findCategoryByName(transactionCategory.getCategoryName())
                            .orElseThrow(() -> new IllegalStateException(
                                    "Could not find category for: " + transactionCategory.getCategoryName()));
                });
        entity.setCategory(categoryEntity);

        // Set Budget Entity
        SubBudgetEntity budgetEntity = subBudgetService.findById(transactionCategory.getSubBudgetId())
                .orElseThrow(() -> new IllegalStateException(
                        "Could not find budget with ID: " + transactionCategory.getSubBudgetId()));
        entity.setSubBudget(budgetEntity);
        // Set required transaction ID - use first transaction ID if available
//        if (transactionCategory.getTransactionIds() != null && !transactionCategory.getTransactionIds().isEmpty()) {
//            entity.setTransactions(Set.of(transactionCategory.getTransactionIds().get(0)));
//        }else{
//            throw new RuntimeException("No transaction IDs specified");
//        }

        // Set other fields as needed
        return entity;
    }
}
