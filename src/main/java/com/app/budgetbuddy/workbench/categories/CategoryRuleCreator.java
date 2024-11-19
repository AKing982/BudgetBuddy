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

    public Set<CategoryRule> createSystemRules(final Map<TransactionRule, String> matchedTransactions){
        if(matchedTransactions.isEmpty() || matchedTransactions == null){
            return new HashSet<>();
        }

        // 1. Initialize the New rules list
        Set<CategoryRule> newRules = new HashSet<>();

        // 2. Iterate through the matched transactions
        for(Map.Entry<TransactionRule, String> entry : matchedTransactions.entrySet()){

            // 3. Validate the transaction rule and Category Name
            TransactionRule rule = entry.getKey();
            String categoryName = entry.getValue();
            CategoryRule newRule = createCategoryRule(
                    "",
                    rule.getMatchedCategory(),
                    rule.getMerchantPattern(),
                    rule.getDescriptionPattern(),
                    "ONCE",
                    TransactionType.CREDIT,
                    true,
                    rule.getPriority()
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

    public Set<UserCategoryRule> createUserDefinedRules(final Map<TransactionRule, String> matchedTransactions, final Long userId){
        if (matchedTransactions == null || matchedTransactions.isEmpty()) {
            return new HashSet<>();
        }

        Set<UserCategoryRule> newRules = new HashSet<>();
        for (Map.Entry<TransactionRule, String> entry : matchedTransactions.entrySet()) {
            TransactionRule transRule = entry.getKey();
            String categoryName = entry.getValue();
            UserCategoryRule newRule = new UserCategoryRule(
                    transRule.getMatchedCategory(),
                    transRule.getMerchantPattern(),
                    transRule.getDescriptionPattern(),
                    "ONCE",
                    TransactionType.CREDIT,
                    false,
                    transRule.getPriority(),
                    userId,
                    LocalDateTime.now(),
                    LocalDateTime.now(),
                    true
            );
            newRules.add(newRule);
        }

        return newRules;
    }

    public List<CategoryRule> loadExistingCategoryRules(){
        return categoryRuleService.getSystemCategoryRules();
    }

    public List<UserCategoryRule> loadExistingUserCategoryRules(Long userId){
        return categoryRuleService.getUserCategoryRules(userId);
    }

}
