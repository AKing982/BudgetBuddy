package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.exceptions.CategoryNotFoundException;
import com.app.budgetbuddy.services.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Service
public class CategoryRuleCreator {
    private final CategoryRuleService categoryRuleService;
    private final CategoryService categoryService;
    private final Map<String, UserCategoryRule> userDefinedRulesTransactionsMap = new HashMap<>();
    private final Map<String, UserCategoryRule> userDefinedRulesRecurringTransactionsMap = new HashMap<>();
    private final Map<String, CategoryRule> transactionRuleMap = new HashMap<>();
    private final Map<String, CategoryRule> recurringTransactionRuleMap = new HashMap<>();

    @Autowired
    public CategoryRuleCreator(CategoryRuleService categoryRuleService,
                               CategoryService categoryService) {
        this.categoryRuleService = categoryRuleService;
        this.categoryService = categoryService;
    }

    private String getCategoryNameById(String categoryId){
        if(categoryId.isEmpty() || categoryId == null){
            return "";
        }
        CategoryEntity category = categoryService.findCategoryById(categoryId)
                .orElseThrow(() -> new CategoryNotFoundException(categoryId));
        return category.getName();
    }

    /**
     * Determines if a recurring transaction already has an associated category rule.
     * If no rule exists, adds the transaction to uncategorized transactions.
     *
     * @param recurringTransaction The transaction to check
     * @return true if a category rule exists for the transaction; false otherwise
     */
    public boolean categoryRuleIsCreatedForRecurringTransaction(final RecurringTransaction recurringTransaction){
        return false;
    }

    /**
     * Determines if a transaction already has an associated category rule.
     * If no rule exists, adds the transaction to uncategorized transactions.
     *
     * @param transaction The transaction to check
     * @return true if a category rule exists for the transaction; false otherwise
     */
    public boolean categoryRuleIsCreatedForTransaction(final Transaction transaction) {
        return false;
    }

    public void addUncategorizedTransactions(Transaction transaction) {

    }

    public void addCreatedTransactionCategoryRules(final String transactionId, final CategoryRule categoryRule){

    }

    public List<UserCategoryRule> createUserDefinedRulesForTransactions(Map<Transaction, String> transactionsToCategory){
        return null;
    }

    public List<UserCategoryRule> createUserDefinedRulesForRecurringTransactions(Map<RecurringTransaction, String> recurringTransactionToCategory){
        return null;
    }

    public List<CategoryRule> createCategoryRulesFromRecurringTransactions(final Map<RecurringTransaction, String> recurringTransactionToCategory)
    {
        return null;
    }

    public List<CategoryRule> createCategoryRulesFromTransactions(final Map<Transaction, String> transactionToCategory)
    {
        return null;
    }

    public List<CategoryRule> loadExistingCategoryRules(){
        return null;
    }

    public List<UserCategoryRule> loadExistingUserCategoryRules(){
        return null;
    }

    /**
     * Creates one or more CategoryRules from a single recurring transaction.
     */
    public List<CategoryRule> createCategoryRulesFromRecurringTransaction(RecurringTransaction recurringTransaction) {
        List<CategoryRule> rules = new ArrayList<>();
        String merchantPattern = recurringTransaction.getMerchantName() != null ? recurringTransaction.getMerchantName() : "";
        String descriptionPattern = recurringTransaction.getDescription() != null ? recurringTransaction.getDescription() : "";
        TransactionType transactionType = determineTransactionType(recurringTransaction);
        boolean isRecurring = true; // Since it's a recurring transaction

        String categoryName = getCategoryNameById(recurringTransaction.getCategoryId());

        // Generate rules based on different categories the transaction might belong to
        CategoryRule rule = new CategoryRule(
                UUID.randomUUID().toString(),               // Generate a unique ID
                categoryName,                               // Use category ID or description as the category name
                merchantPattern,                            // Merchant pattern
                descriptionPattern,                         // Description pattern
                recurringTransaction.getFrequency(),        // Use transaction's frequency
                transactionType,                            // Transaction type
                isRecurring                                 // Mark as recurring
        );

        rules.add(rule); // Add the rule to the list
        return rules;
    }

    public UserCategoryRule createUserCategoryRuleForTransaction(Transaction transaction) {
        return null;
    }

    public UserCategoryRule createUserCategoryRuleForRecurringTransaction(RecurringTransaction recurringTransaction){
        return null;
    }

    public CategoryRule createCategoryRuleFromTransaction(Transaction transaction)
    {
        // Generate a unique ID for the rule (could be null if ID is auto-generated by the database)
        String categoryId = transaction.getCategoryId() != null ? transaction.getCategoryId() : UUID.randomUUID().toString();

        // Use the transaction's first category if available, otherwise default to "Uncategorized"
        String categoryName = (transaction.getCategories() != null && !transaction.getCategories().isEmpty())
                ? transaction.getCategories().get(0)
                : "Uncategorized";

        // Extract merchant and description patterns from the transaction
        String merchantPattern = transaction.getMerchantName() != null ? transaction.getMerchantName() : "";
        String descriptionPattern = transaction.getDescription() != null ? transaction.getDescription() : "";

        // Determine transaction type using helper method
        TransactionType transactionType = determineTransactionType(transaction);

        // Default frequency to "DAILY" if unspecified or if there's no recurring pattern
        String frequency = "DAILY";

        // Assume non-recurring unless otherwise specified or detectable
        boolean isRecurring = false;

        // Create and return the new CategoryRule
        return new CategoryRule(
                categoryId,
                categoryName,
                merchantPattern,
                descriptionPattern,
                frequency,
                transactionType,
                isRecurring
        );
    }

    private TransactionType determineTransactionType(Transaction transaction)
    {
        if (transaction.getAmount().compareTo(BigDecimal.ZERO) < 0) {
            return TransactionType.DEBIT;
        } else {
            return TransactionType.CREDIT;
        }
    }

    private TransactionType determineTransactionType(RecurringTransaction recurringTransaction)
    {
        if (recurringTransaction.getAverageAmount().compareTo(BigDecimal.ZERO) < 0) {
            return TransactionType.DEBIT;
        } else {
            return TransactionType.CREDIT;
        }
    }


}
