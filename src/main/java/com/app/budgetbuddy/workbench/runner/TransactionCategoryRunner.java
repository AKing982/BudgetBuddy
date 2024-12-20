package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.TransactionCategoryEntity;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.budget.TransactionCategoryBuilder;
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
    private final TransactionCategoryService transactionCategoryService;
    private final TransactionCategoryBuilder transactionCategoryBuilder;

    @Autowired
    public TransactionCategoryRunner(TransactionCategoryService transactionCategoryService,
                                     TransactionCategoryBuilder transactionCategoryBuilder,
                                     TransactionService transactionService,
                                     BudgetService budgetService,
                                     RecurringTransactionService recurringTransactionService)
    {
        this.transactionCategoryService = transactionCategoryService;
        this.transactionCategoryBuilder = transactionCategoryBuilder;
        this.transactionService = transactionService;
        this.budgetService = budgetService;
        this.recurringTransactionService = recurringTransactionService;
    }

    /**
     * Processes and synchronizes all transaction categories for a user within a given date range.
     * This includes both regular and recurring transactions.
     */
    public void processTransactionCategories(Long userId, LocalDate startDate, LocalDate endDate) {
        log.info("Starting transaction category processing for user {} between {} and {}",
                userId, startDate, endDate);

        try {
            // 1. Get active budgets for the date range
            Budget activeBudget = budgetService.loadUserBudget(userId);

            // Process each budget
            processBudgetTransactionCategories(activeBudget, startDate, endDate);

        } catch (Exception e) {
            log.error("Error processing transaction categories for user {}: ", userId, e);
            throw new RuntimeException(
                    "Failed to process transaction categories", e);
        }
    }

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
            List<Transaction> transactions =
                    transactionService.getConvertedPlaidTransactions(
                            budget.getUserId(), startDate, endDate);

            // 3. Get recurring transactions
            List<RecurringTransaction> recurringTransactions =
                    recurringTransactionService.getRecurringTransactions(
                            budget.getUserId(), startDate, endDate);

            // 4. Create budget period
            BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, startDate, endDate);

            // 5. Process regular transactions
            List<TransactionCategory> newRegularCategories =
                    createNewTransactionCategories(transactions, budget, startDate, endDate);

            // 6. Process recurring transactions
            List<TransactionCategory> newRecurringCategories =
                    createNewRecurringTransactionCategories(
                            recurringTransactions, budget, startDate, endDate);

            // 7. Update existing categories with new transaction data
            List<TransactionCategory> updatedExistingCategories =
                    updateTransactionCategories(
                            existingCategories, transactions, budget, budgetPeriod);

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



    public Boolean checkIfTransactionCategoryExists(TransactionCategory transactionCategory){
        if (transactionCategory == null || transactionCategory.getBudgetId() == null) {
            return false;
        }

        List<TransactionCategoryEntity> existingCategories = transactionCategoryService
                .getTransactionCategoriesByBudgetIdAndDateRange(
                        transactionCategory.getBudgetId(),
                        transactionCategory.getStartDate(),
                        transactionCategory.getEndDate()
                );

        return existingCategories.stream()
                .anyMatch(category ->
                        category.getCategory().getId().equals(transactionCategory.getCategoryId()) &&
                                category.getBudgetedAmount().equals(transactionCategory.getBudgetedAmount())
                );
    }

    public void batchSaveTransactionCategories(List<TransactionCategory> transactionCategories){
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
            TransactionCategoryEntity entity = convertToEntity(transactionCategory);
            transactionCategoryService.save(entity);
            log.info("Saved transaction category: {}", transactionCategory.getCategoryName());
        } catch (Exception e) {
            log.error("Error saving transaction category: {}", transactionCategory.getCategoryName(), e);
            throw e;
        }
    }

    public List<TransactionCategory> createNewRecurringTransactionCategories(List<RecurringTransaction> recurringTransactions, Budget budget, LocalDate startDate, LocalDate endDate){
        if (recurringTransactions == null || recurringTransactions.isEmpty() || budget == null) {
            log.warn("Invalid parameters for creating recurring transaction categories");
            return new ArrayList<>();
        }

        try {
            BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, startDate, endDate);
            List<Transaction> transactions = convertRecurringToRegularTransactions(recurringTransactions);

            return transactionCategoryBuilder.initializeTransactionCategories(
                    budget,
                    budgetPeriod,
                    transactions
            );
        } catch (Exception e) {
            log.error("Error creating recurring transaction categories: ", e);
            throw e;
        }
    }

    public List<TransactionCategory> createNewTransactionCategories(List<Transaction> transactions, Budget budget, LocalDate startDate, LocalDate endDate){
        if (transactions == null || transactions.isEmpty() || budget == null) {
            log.warn("Invalid parameters for creating transaction categories");
            return new ArrayList<>();
        }

        try {
            BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, startDate, endDate);

            return transactionCategoryBuilder.initializeTransactionCategories(
                    budget,
                    budgetPeriod,
                    transactions
            );
        } catch (Exception e) {
            log.error("Error creating transaction categories: ", e);
            throw e;
        }
    }

    public List<TransactionCategory> updateTransactionCategories(final List<TransactionCategory> existingTransactionCategories, final List<Transaction> transactions, final Budget budget, final BudgetPeriod budgetPeriod){
        if (existingTransactionCategories == null || transactions == null || budget == null) {
            log.warn("Invalid parameters for updating transaction categories");
            return new ArrayList<>();
        }

        try {
            List<TransactionCategory> updatedCategories = new ArrayList<>();

            for (TransactionCategory existingCategory : existingTransactionCategories) {
                // Find relevant transactions for this category
                List<Transaction> categoryTransactions = transactions.stream()
                        .filter(transaction ->
                                transaction.getCategories() != null &&
                                        transaction.getCategories().contains(existingCategory.getCategoryName()))
                        .toList();

                if (!categoryTransactions.isEmpty()) {
                    TransactionCategory updatedCategory = existingCategory;
                    for (Transaction transaction : categoryTransactions) {
                        updatedCategory = transactionCategoryBuilder
                                .updateCategoryOnNewTransaction(transaction, updatedCategory);
                    }
                    updatedCategories.add(updatedCategory);
                } else {
                    updatedCategories.add(existingCategory);
                }
            }

            return updatedCategories;
        } catch (Exception e) {
            log.error("Error updating transaction categories: ", e);
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
