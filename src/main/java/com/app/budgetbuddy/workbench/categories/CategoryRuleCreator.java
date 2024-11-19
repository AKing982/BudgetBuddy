package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.exceptions.CategoryNotFoundException;
import com.app.budgetbuddy.services.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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


    public List<CategoryRule> createSystemRules(Map<TransactionRule, String> matchedTransactions){
        if(matchedTransactions.isEmpty() || matchedTransactions == null){
            return new ArrayList<>();
        }
        List<CategoryRule> newRules = new ArrayList<>();
        for(Map.Entry<TransactionRule, String> entry : matchedTransactions.entrySet()){
            TransactionRule rule = entry.getKey();
            String categoryName = entry.getValue();

            if(categoryRuleService.ruleExistsForPattern(
                    rule.getMerchantPattern(),
                    rule.getDescriptionPattern())){
                continue;
            }
            CategoryRule newRule = new CategoryRule(
                    "",
                    rule.getMatchedCategory(),
                    rule.getMerchantPattern(),
                    rule.getDescriptionPattern(),
                    rule.getFrequency(),
                    determineTransactionType(rule),
                    true,
                    rule.getPriority()
            );
            newRules.add(newRule);

        }
        return null;
    }

    public List<UserCategoryRule> createUserDefinedRules(Map<TransactionRule, String> matchedTransactions, Long userId){
        if (matchedTransactions == null || matchedTransactions.isEmpty()) {
            return Collections.emptyList();
        }

        List<UserCategoryRule> newRules = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (Map.Entry<TransactionRule, String> entry : matchedTransactions.entrySet()) {
            TransactionRule transRule = entry.getKey();
            String categoryName = entry.getValue();

            // Skip if user rule already exists
            if (categoryRuleService.userRuleExistsForPattern(
                    userId,
                    transRule.getMerchantPattern(),
                    transRule.getDescriptionPattern())) {
                continue;
            }


            UserCategoryRule newRule = new UserCategoryRule(
                    transRule.getMatchedCategory(),
                    transRule.getMerchantPattern(),
                    transRule.getDescriptionPattern(),
                    transRule.getFrequency(),
                    determineTransactionType(transRule),
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

    private TransactionType determineTransactionType(TransactionRule rule){
        if(rule == null){
            return TransactionType.NONE;
        }
        return "";
    }


    public List<CategoryRule> loadExistingCategoryRules(){
        return null;
    }

    public List<UserCategoryRule> loadExistingUserCategoryRules(){
        return null;
    }

}
