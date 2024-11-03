package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;


import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.services.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CategoryRuleManagerImpl implements CategoryRuleManager
{
    private CategoryRuleService categoryRuleService;
    private CategoryService categoryService;

    @Autowired
    public CategoryRuleManagerImpl(CategoryRuleService categoryRuleService,
                                   CategoryService categoryService)
    {
        this.categoryRuleService = categoryRuleService;
        this.categoryService = categoryService;
    }

    @Override
    public CategoryRule userUpdatedCategoryRule(UserCategoryRule userCategoryRule) {
        return null;
    }

    @Override
    public CategoryRule updateCategoryRuleForTransaction(CategoryRule categoryRule, Transaction transaction) {

        return null;
    }

    @Override
    public Boolean ruleMatchesTransaction(CategoryRule categoryRule, Transaction transaction) {
        if(categoryRule == null || transaction == null)
        {
            return false;
        }
        return null;
    }

    @Override
    public List<UserCategoryRule> getUserCategoryRules(Long userId) {
        return List.of();
    }

    @Override
    public List<CategoryRule> createCategoryRuleListFromTransactions(List<Transaction> transactions,
                                                                     List<RecurringTransaction> recurringTransactionDTOs) {
        if(transactions.isEmpty())
        {
            return List.of();
        }
        List<CategoryRule> categoryRules = new ArrayList<>();
        for(Transaction transaction : transactions)
        {
            String description = transaction.description();
            String merchantName = transaction.merchantName();
            CategoryEntity category = fetchCategoryById(transaction.categoryId());
            CategoryRule categoryRule = new CategoryRule(
                    category.getName(),
                    merchantName,
                    description,
                    null,
                    getTransactionType(transaction),
                    false
            );

            categoryRules.add(categoryRule);
        }

        for(RecurringTransaction recurringTransactionDTO : recurringTransactionDTOs)
        {
            String description = recurringTransactionDTO.getDescription();
            String merchantName = recurringTransactionDTO.getMerchantName();
            CategoryEntity category = fetchCategoryById(recurringTransactionDTO.getCategoryId());
            String frequency = recurringTransactionDTO.getFrequency();
            CategoryRule categoryRule = new CategoryRule(
                    category.getName(),
                    merchantName,
                    description,
                    frequency,
                    getTransactionType(recurringTransactionDTO),
                    true
            );

            categoryRules.add(categoryRule);
        }
        return categoryRules;
    }

    private TransactionType getTransactionType(RecurringTransaction recurringTransaction) {
        // Similar logic for recurring transactions
        if (recurringTransaction.getAverageAmount().compareTo(BigDecimal.ZERO) < 0) {
            if(recurringTransaction.getDescription().contains("PAY")){return TransactionType.CREDIT;};
        } else if (recurringTransaction.getAverageAmount().compareTo(BigDecimal.ZERO) > 0) {
            return TransactionType.PURCHASE;
        }
        return TransactionType.TRANSFER;
    }

    private TransactionType getTransactionType(Transaction transaction) {
        BigDecimal transactionAmount = transaction.amount();
        String description = transaction.description();
        if(transactionAmount.compareTo(BigDecimal.ZERO) < 0){
            if(description.contains("Transfer"))
            {
                return TransactionType.TRANSFER;
            }
        }
        else
        {
            if(description.contains("Withdrawal Transfer"))
            {
                return TransactionType.TRANSFER;
            }else if(description.contains("Purchase") || description.contains("PIN Purchase"))
            {
                return TransactionType.PURCHASE;
            }
        }
        return null;
    }

    private CategoryEntity fetchCategoryById(String categoryId)
    {
        if(categoryId == null || categoryId.isEmpty())
        {
            return null;
        }
        Optional<CategoryEntity> category = categoryService.findCategoryById(categoryId);
        return category.orElse(null);
    }


    @Override
    public List<CategoryRule> getMatchingCategoryRulesForTransaction(final Transaction transaction) {
        return List.of();
    }

    @Override
    public boolean validateCategoryRule(CategoryRule categoryRule) {
        return false;
    }

    @Override
    public void saveOverrideAsNewRule(Transaction transaction, CategoryRule categoryRule, Category category) {

    }

    @Override
    public List<Transaction> getUncategorizedTransactions(List<Transaction> transactions) {
        return List.of();
    }

    @Override
    public List<RecurringTransaction> getUncategorizedRecurringTransactions(List<Transaction> transactions) {
        return List.of();
    }

    @Override
    public Map<CategoryRule, Double> getRuleSuccessRate() {
        return Map.of();
    }

    @Override
    public CategoryRule getTransactionCategoryRule(Transaction transaction) {
        return null;
    }

    @Override
    public UserCategoryRule getTransactionUserCategoryRule(Transaction transaction) {
        return null;
    }

    @Override
    public Set<UserCategoryRule> getCategoryRulesByUserId(Long userId, List<Transaction> userTransactions) {
        return Set.of();
    }

    @Override
    public Category resolveCategoryRuleConflict(Transaction transaction, List<CategoryRule> categoryRules) {
        return null;
    }

    @Override
    public void setCategoryRulePriority(int priority, CategoryRule categoryRule) {

    }

    @Override
    public void setUserCategoryRulePriority(int priority, UserCategoryRule userCategoryRule) {

    }

    @Override
    public double getCategoryRuleSuccessRate(CategoryRule categoryRule) {
        return 0;
    }

    @Override
    public void notifyUserOnCategoryRuleAssignment(Transaction transaction, Category category) {

    }

    private CategoryRule createCategoryRule(String categoryName, String merchantName, String description, TransactionType transactionType, String frequency, boolean isRecurring)
    {
        return new CategoryRule(categoryName, merchantName, description, frequency,transactionType, isRecurring);
    }
}
