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
    private final CategoryService categoryService;
    private final CategoryRuleEngine categoryRuleEngine;
    private final TransactionCategoryService transactionCategoryService;
    private final TransactionCategoryBuilder transactionCategoryBuilder;

    @Autowired
    public TransactionCategoryRunner(TransactionCategoryService transactionCategoryService,
                                     TransactionCategoryBuilder transactionCategoryBuilder,
                                     TransactionService transactionService,
                                     BudgetService budgetService,
                                     CategoryService categoryService,
                                     CategoryRuleEngine categoryRuleEngine,
                                     RecurringTransactionService recurringTransactionService)
    {
        this.transactionCategoryService = transactionCategoryService;
        this.transactionCategoryBuilder = transactionCategoryBuilder;
        this.transactionService = transactionService;
        this.budgetService = budgetService;
        this.categoryService = categoryService;
        this.categoryRuleEngine = categoryRuleEngine;
        this.recurringTransactionService = recurringTransactionService;
    }

    /**
     * Processes and synchronizes all transaction categories for a user within a given date range.
     * This includes both regular and recurring transactions.
     */
    //TODO: Unit test this method and change output to boolean
    public void processTransactionCategories(Long userId, LocalDate startDate, LocalDate endDate) {
        log.info("Starting transaction category processing for user {} between {} and {}",
                userId, startDate, endDate);

        try {
            // 1. Get active budgets for the date range
            Budget activeBudget = budgetService.loadUserBudgetForPeriod(userId, startDate, endDate);

            // Process each budget
            log.info("Process budget for startDate: {} endDate: {}", startDate, endDate);
            processBudgetTransactionCategories(activeBudget, startDate, endDate);

        } catch (Exception e) {
            log.error("Error processing transaction categories for user {}: ", userId, e);
            throw new RuntimeException(
                    "Failed to process transaction categories", e);
        }
    }

    //TODO: Unit test this method and break it down into smaller methods
    private void processBudgetTransactionCategories(Budget budget,
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
                            budget.getUserId(), startDate, endDate);

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
                    recurringTransactionService.getRecurringTransactions(budget.getUserId(), startDate, endDate);

            // 4. Create budget period
            BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, startDate, endDate);

            // 5. Process regular transactions (using validated transactions)
            List<TransactionCategory> newRegularCategories =
                    createNewTransactionCategories(validTransactions, budget, startDate, endDate);

            // 6. Process recurring transactions
            List<TransactionCategory> newRecurringCategories =
                    createNewRecurringTransactionCategories(
                            recurringTransactions, budget, startDate, endDate);

            // 7. Update existing categories with new transaction data (using validated transactions)
            List<TransactionCategory> updatedExistingCategories =
                    updateTransactionCategories(
                            existingCategories, validTransactions, budget, budgetPeriod);

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
    public Boolean checkIfTransactionCategoryExists(TransactionCategory transactionCategory){
        if (transactionCategory == null || transactionCategory.getBudgetId() == null) {
            return false;
        }

        List<TransactionCategoryEntity> existingCategories = transactionCategoryService
                .getTransactionCategoriesByBudgetIdAndDateRange(
                        transactionCategory.getBudgetId(),
                        transactionCategory.getStartDate(),
                        transactionCategory.getEndDate());

        return existingCategories.stream()
                .anyMatch(category ->
                        category.getCategory().getId().equals(transactionCategory.getCategoryId()) &&
                                category.getBudgetedAmount().equals(transactionCategory.getBudgetedAmount())
                );
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
    public List<TransactionCategory> createNewRecurringTransactionCategories(final List<RecurringTransaction> recurringTransactions, final Budget budget, final LocalDate startDate, final LocalDate endDate){
        if (recurringTransactions == null || recurringTransactions.isEmpty() || budget == null) {
            log.warn("Invalid parameters for creating recurring transaction categories");
            return new ArrayList<>();
        }

        try {
            BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, startDate, endDate);
            // Convert recurring transactions to regular transactions
            List<Transaction> transactions = convertRecurringToRegularTransactions(recurringTransactions);
            DateRange dateRange = new DateRange(startDate, endDate);
            Map<String, List<String>> categorizedRecurringTransactions = categoryRuleEngine.finalizeUserTransactionCategoriesForDateRange(recurringTransactions, budget.getUserId(), dateRange);
            List<CategoryTransactions> categoryTransactions = buildCategoryTransactionsList(categorizedRecurringTransactions);
            categoryTransactions.forEach((categoryTransactions1 -> {
                log.info("Category Designator: {}", categoryTransactions1.toString());
            }) );
            return buildTransactionCategories(budget, budgetPeriod, categoryTransactions);
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
    public List<TransactionCategory> createNewTransactionCategories(final List<Transaction> transactions, Budget budget, LocalDate startDate, LocalDate endDate)
    {
        if (transactions == null || budget == null) {
            log.warn("Invalid parameters for creating transaction categories");
            return Collections.emptyList();
        }
        try
        {
            if(startDate == null || endDate == null)
            {
                throw new IllegalDateException("Illegal Start Date or EndDate: " + startDate);
            }
            LocalDate budgetStartDate = budget.getStartDate();
            LocalDate budgetEndDate = budget.getEndDate();
            if(!validateTransactionDatesMeetsBudgetPeriod(budgetStartDate, budgetEndDate, startDate, endDate))
            {
                log.info("Transaction Dates: {} and {} don't meet the budget period dates: {} and {}", startDate, endDate, budgetStartDate, budgetEndDate);
                throw new BudgetPeriodException("Transaction dates don't meet the budget period dates");
            }
            else
            {
                BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, startDate, endDate);
                // Convert transactions to CategoryDesignators
                Long userId = budget.getUserId();
                DateRange dateRange = new DateRange(startDate, endDate);
                Map<String, List<String>> categorizedTransactions = categoryRuleEngine.finalizeUserTransactionCategoriesForDateRange(transactions, userId, dateRange);
                // Use the map to obtain the Transactions from the Transaction ids
                List<CategoryTransactions> categoryTransactions = buildCategoryTransactionsList(categorizedTransactions);
                categoryTransactions.forEach((categoryDesignator) -> {
                    log.info("Category Designator for new Transactions: {}", categoryDesignator.toString());
                });
                return buildTransactionCategories(budget, budgetPeriod, categoryTransactions);
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

    private List<TransactionCategory> buildTransactionCategories(Budget budget, BudgetPeriod budgetPeriod, List<CategoryTransactions> categoryTransactions)
    {
        return transactionCategoryBuilder.initializeTransactionCategories(budget, budgetPeriod, categoryTransactions);
    }

    private boolean transactionExists(String transactionId)
    {
        Optional<TransactionsEntity> transactionsEntity = transactionService.getTransactionById(transactionId);
        return transactionsEntity.isPresent();
    }

    // TODO: Unit test this method
    public List<TransactionCategory> updateTransactionCategories(final List<TransactionCategory> existingTransactionCategories, final List<Transaction> transactions, final Budget budget, final BudgetPeriod budgetPeriod){
        if (existingTransactionCategories == null || transactions == null || budget == null) {
            log.warn("Invalid parameters for updating transaction categories");
            return new ArrayList<>();
        }

        Set<TransactionCategory> uniqueTransactionCategories = new HashSet<>();
        uniqueTransactionCategories.addAll(existingTransactionCategories);
        try {
            for(TransactionCategory transactionCategory : existingTransactionCategories)
            {
                final LocalDate transactionCategoryStartDate = transactionCategory.getStartDate();
                final LocalDate transactionCategoryEndDate = transactionCategory.getEndDate();
                for(Transaction transaction : transactions)
                {
                    String transactionId = transaction.getTransactionId();
                    LocalDate transactionPostedDate = transaction.getPosted();
                    // Does the Transaction Id exist in the database?
                    if(!transactionExists(transactionId) && transactionPostedDate.isAfter(transactionCategoryStartDate) && transactionPostedDate.isAfter(transactionCategoryEndDate))
                    {
                        //  Build the Category Periods
                        LocalDate startDate = budgetPeriod.getStartDate();
                        LocalDate endDate = budgetPeriod.getEndDate();
                        List<TransactionCategory> newTransactionCategories = createNewTransactionCategories(transactions, budget, startDate, endDate);
                        uniqueTransactionCategories.addAll(newTransactionCategories);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error updating transaction categories: ", e);
            throw e;
        }
        return new ArrayList<>(uniqueTransactionCategories);
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
        BudgetEntity budgetEntity = budgetService.findById(transactionCategory.getBudgetId())
                .orElseThrow(() -> new IllegalStateException(
                        "Could not find budget with ID: " + transactionCategory.getBudgetId()));
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
