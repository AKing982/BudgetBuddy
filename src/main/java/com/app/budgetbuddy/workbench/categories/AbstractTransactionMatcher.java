package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.CategoryRuleEntity;
import com.app.budgetbuddy.exceptions.CategoryNotFoundException;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.workbench.PlaidCategoryManager;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

@Getter
@Setter
@Slf4j
public abstract class AbstractTransactionMatcher<T extends Transaction, S extends TransactionRule> implements TransactionMatcher<T, S> {
    protected final CategoryRuleService categoryRuleService;
    protected final CategoryService categoryService;
    protected List<CategoryRule> systemCategoryRules = new ArrayList<>();
    protected List<UserCategoryRule> userCategoryRules;
    protected final PlaidCategoryManager plaidCategoryManager;
    protected final String UNCATEGORIZED = "Uncategorized";

    public AbstractTransactionMatcher(CategoryRuleService categoryRuleService, CategoryService categoryService,
                                      PlaidCategoryManager plaidCategoryManager) {
        this.categoryRuleService = categoryRuleService;
        this.categoryService = categoryService;
        this.systemCategoryRules = loadCategoryRules();
        this.plaidCategoryManager = plaidCategoryManager;
    }

    protected List<CategoryRule> loadCategoryRules(){
        return categoryRuleService.getConvertedCategoryRules(
                categoryRuleService.findAllSystemCategoryRules()
        );
    }


    protected boolean hasMatchingUserRule(T transaction, List<UserCategoryRule> userCategoryRules){
        if(userCategoryRules == null || userCategoryRules.isEmpty()){
            return false;
        }

        return userCategoryRules.stream()
                .filter(UserCategoryRule::isActive)
                .anyMatch(rule -> matchesUserRule(transaction, rule));
    }

    protected boolean isValidPlaidCategory(String category){
        try
        {
            PlaidCategory plaidCategory = plaidCategoryManager.getCategory(category);
            log.info("Plaid Category: {}", plaidCategory);
            return plaidCategoryManager.getCategory(category) != null;
        }catch(Exception e){
            log.warn("Invalid Plaid Category attempted: {}", category, e);
            return false;
        }

    }

    protected boolean matchesUserRule(T transaction, UserCategoryRule userCategoryRule){
        return (matchesMerchantPattern(transaction, userCategoryRule) ||
                matchesDescriptionPattern(transaction, userCategoryRule) ||
                matchesCategoryPattern(transaction, userCategoryRule));
    }

    protected String getTransactionCategory(T transaction) {
        List<String> categories = transaction.getCategories();
        log.info("Categories: {}", categories);
        if(categories == null){
            return UNCATEGORIZED;
        }

        if(!categories.isEmpty())
        {
            for(String category : categories)
            {
                if(category == null){
                    continue;
                }
                return category;
            }
        }else
        {
            String categoryId = transaction.getCategoryId();
            log.info("Category Id: {}", categoryId);
            return getCategoryNameById(categoryId);
        }
        return UNCATEGORIZED;
    }

    protected boolean matchesMerchantPattern(T transaction, UserCategoryRule userCategoryRule){
        if(transaction.getMerchantName() == null || userCategoryRule.getMerchantPattern() == null){
            return false;
        }
        try
        {
            return Pattern.compile(userCategoryRule.getMerchantPattern(), Pattern.CASE_INSENSITIVE)
                    .matcher(transaction.getMerchantName())
                    .find();

        }catch(PatternSyntaxException e){
            log.error("Invalid Merchant pattern in rule: {}", userCategoryRule.getMerchantPattern(), e);
            return false;
        }
    }

    protected boolean matchesDescriptionPattern(T transaction, UserCategoryRule userCategoryRule){
        if(transaction.getDescription() == null || userCategoryRule.getDescriptionPattern() == null){
            return false;
        }
        try
        {
            return Pattern.compile(userCategoryRule.getDescriptionPattern(), Pattern.CASE_INSENSITIVE)
                    .matcher(transaction.getDescription())
                    .find();
        }catch(PatternSyntaxException e){
            log.error("Invalid description pattern in rule: {}", userCategoryRule.getDescriptionPattern(), e);
            return false;
        }
    }

    protected boolean matchesCategoryPattern(T transaction, UserCategoryRule userCategoryRule){
        if(transaction.getCategories() == null || userCategoryRule.getCategoryName() == null){
            return false;
        }
        try
        {
            if(!isValidPlaidCategory(userCategoryRule.getCategoryName())){
                log.warn("Rule contains invalid Plaid Category: {}", userCategoryRule.getCategoryName());
                return false;
            }

            Pattern categoryPattern = Pattern.compile(userCategoryRule.getCategoryName(), Pattern.CASE_INSENSITIVE);
            return transaction.getCategories().stream()
                    .filter(this::isValidPlaidCategory)
                    .anyMatch(category -> categoryPattern.matcher(category).find());
        }catch(PatternSyntaxException e){
            log.error("Invalid category pattern in rule: {}", userCategoryRule.getCategoryName(), e);
            return false;
        }
    }

    protected boolean matchesMerchantPatternRule(S transaction, CategoryRule rule) {
        if (transaction.getMerchantPattern() == null || rule.getMerchantPattern() == null) {
            return false;
        }
        try {
            return Pattern.compile(rule.getMerchantPattern(), Pattern.CASE_INSENSITIVE)
                    .matcher(transaction.getMerchantPattern())
                    .find();
        } catch (PatternSyntaxException e) {
            log.error("Invalid merchant pattern in rule: {}", rule.getMerchantPattern(), e);
            return false;
        }
    }

    protected boolean matchesDescriptionPatternRule(S transaction, CategoryRule rule) {
        if (transaction.getDescriptionPattern() == null || rule.getDescriptionPattern() == null) {
            return false;
        }
        try {
            return Pattern.compile(rule.getDescriptionPattern(), Pattern.CASE_INSENSITIVE)
                    .matcher(transaction.getDescriptionPattern())
                    .find();
        } catch (PatternSyntaxException e) {
            log.error("Invalid description pattern in rule: {}", rule.getDescriptionPattern(), e);
            return false;
        }
    }

    protected boolean matchesCategoryPatternRule(S transaction, CategoryRule rule) {
        if (transaction.getCategories() == null || rule.getCategoryName() == null) {
            return false;
        }
        try {
            Pattern categoryPattern = Pattern.compile(rule.getCategoryName(), Pattern.CASE_INSENSITIVE);
            return transaction.getCategories().stream()
                    .anyMatch(category -> categoryPattern.matcher(category).find());
        } catch (PatternSyntaxException e) {
            log.error("Invalid category pattern in rule: {}", rule.getCategoryName(), e);
            return false;
        }
    }

    protected int determinePriority(final T transaction, final List<UserCategoryRule> userCategoryRules)
    {
        if(transaction == null)
        {
            return PriorityLevel.NONE.getValue();
        }

        if(hasMatchingUserRule(transaction, userCategoryRules)){
            return PriorityLevel.USER_DEFINED.getValue();
        }

        return determineSystemPriority(transaction);
    }

    protected int determineSystemPriority(final T transaction){
        boolean hasMerchant = (transaction.getMerchantName() != null && !transaction.getMerchantName().isEmpty());
        boolean hasDescription = (transaction.getDescription() != null && !transaction.getDescription().isEmpty());
        boolean hasCategories = (transaction.getCategories() != null && !transaction.getCategories().isEmpty());
        if(hasMerchant && hasDescription && hasCategories){
            return PriorityLevel.HIGHEST.getValue();
        }else if(hasMerchant && (hasDescription || hasCategories)){
            return PriorityLevel.HIGH.getValue();
        }else if(hasDescription && hasCategories || hasMerchant){
            return PriorityLevel.MEDIUM.getValue();
        }else if(hasDescription || hasCategories){
            return PriorityLevel.LOW.getValue();
        }
        return PriorityLevel.NONE.getValue();
    }

    protected void loadUserCategoryRules(Long userId)
    {
        List<CategoryRuleEntity> categoryRuleEntities = categoryRuleService.findByUserId(userId);
        if(!categoryRuleEntities.isEmpty()) {
            List<CategoryRule> categoryRulesForUser = categoryRuleService.getConvertedCategoryRules(categoryRuleEntities);
            if(!categoryRulesForUser.isEmpty()) {
                this.systemCategoryRules.addAll(categoryRulesForUser);
            }
        }

    }

    protected abstract Boolean matchesRule(S transaction, CategoryRule categoryRule);

    protected String getCategoryNameById(String categoryId) {
        if (categoryId == null) {
            return "";
        }
        Optional<CategoryEntity> category = categoryService.findCategoryById(categoryId);
        if(category.isEmpty()){
            throw new CategoryNotFoundException(categoryId);
        }
        log.info("Found Category: " + category);
        return category.get().getName();
    }
}
