package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.exceptions.CategoryNotFoundException;
import com.app.budgetbuddy.services.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class CategoryRuleCreator {
    private final CategoryRuleService categoryRuleService;
    private final CategoryService categoryService;
    private final List<UserCategoryRule> userDefinedRulesTransactions = new ArrayList<>();
    private final List<CategoryRule> systemDefinedRules = new ArrayList<>();

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

    public Set<CategoryRule> createSystemRules(final List<? extends TransactionRule> matchedTransactions){
        if(matchedTransactions.isEmpty() || matchedTransactions == null){
            return new HashSet<>();
        }

        // 1. Initialize the New rules list
        Set<CategoryRule> newRules = new HashSet<>();

        // 2. Iterate through the matched transactions
        for(TransactionRule transactionRule : matchedTransactions){
            String categoryName = transactionRule.getMatchedCategory();
            CategoryRule newRule = createCategoryRule(
                    "",
                   categoryName,
                    transactionRule.getMerchantPattern(),
                    transactionRule.getDescriptionPattern(),
                    "ONCE",
                    TransactionType.CREDIT,
                    true,
                    transactionRule.getPriority()
            );

            // Does the newRules already contain the newly created rule?
            newRules.add(newRule);
        }

        return newRules;
    }


    private CategoryRule createCategoryRule(String categoryId, String category, String merchantPattern, String descriptionPattern, String frequency, TransactionType transactionType, boolean isRecurring, int priority){
        return new CategoryRule(
                categoryId,
                category,
                merchantPattern,
                descriptionPattern,
                frequency,
                transactionType,
                isRecurring,
                priority);
    }

    public Set<UserCategoryRule> createUserDefinedRules(final List<? extends TransactionRule> matchedTransactions, final Long userId){
        if (matchedTransactions == null || matchedTransactions.isEmpty()) {
            return new HashSet<>();
        }

        Set<UserCategoryRule> newRules = new HashSet<>();
        for(TransactionRule transactionRule : matchedTransactions){
            String categoryName = transactionRule.getMatchedCategory();
            UserCategoryRule newRule = new UserCategoryRule(
                    null, // `ruleId` is null for a new rule
                    userId, // User ID from the method context
                    LocalDateTime.now(), // Current date-time for `createdDate`
                    LocalDateTime.now(), // Current date-time for `modifiedDate`
                    TransactionMatchType.EXACT, // Default to `EXACT` match type
                    "", // `matchByText` is an empty string as placeholder
                    true // `isActive` set to true for an active rule
            );

            // Set inherited fields from the `transactionRule`
            newRule.setCategoryName(transactionRule.getMatchedCategory());
            newRule.setMerchantPattern(transactionRule.getMerchantPattern());
            newRule.setDescriptionPattern(transactionRule.getDescriptionPattern());
            newRule.setFrequency("ONCE");
            newRule.setTransactionType(TransactionType.CREDIT); // Assuming `CREDIT` as the type
            newRule.setRecurring(false); // Assuming the rule is not recurring
            newRule.setPriority(transactionRule.getPriority());
            newRules.add(newRule);
        }
        return newRules;
    }

    public void saveUserDefinedRules(final Map<String, UserCategoryRule> userDefinedRules){

    }

    public void saveSystemDefinedRules(final Map<String, CategoryRule> systemDefinedRules){

    }

    public List<CategoryRule> loadExistingCategoryRules(){
        return categoryRuleService.getSystemCategoryRules();
    }

    public List<UserCategoryRule> loadExistingUserCategoryRules(Long userId){
        return categoryRuleService.getUserCategoryRules(userId);
    }

}
