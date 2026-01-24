package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryType;
import com.app.budgetbuddy.domain.PriorityLevel;
import com.app.budgetbuddy.domain.TransactionRule;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.TransactionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@Deprecated
public class AutoCategorizeTransactionService
{
    private final TransactionRuleService transactionRuleService;
    private final TransactionService transactionService;
    private final CategoryService categoryService;

    private Map<String, List<TransactionRule>> merchantRules = new HashMap<>();
    private Map<String, List<TransactionRule>> descriptionRules = new HashMap<>();
    private Map<String, List<TransactionRule>> categoryIdRules = new HashMap<>();
    private Map<String, List<TransactionRule>> categoryNameRules = new HashMap<>();
    private Map<String, List<TransactionRule>> combinationRules = new HashMap<>();
    private Map<String, BigDecimal> specialAmountRules = new HashMap<>();

    @Autowired
    public AutoCategorizeTransactionService(TransactionRuleService transactionRuleService, TransactionService transactionService, CategoryService categoryService)
    {
        this.transactionRuleService = transactionRuleService;
        this.transactionService = transactionService;
        this.categoryService = categoryService;

        initializeRules();
    }

    private void initializeRules()
    {

    }

    private List<TransactionRule> loadSystemRules()
    {
        return List.of();
    }

    private void createMerchantRule(String merchant, CategoryType categoryType)
    {
        TransactionRule transactionRule = new TransactionRule();
        transactionRule.setMerchantRule(merchant);
        transactionRule.setCategoryName(categoryType.name());
        transactionRule.setPriority(PriorityLevel.MERCHANT_ONLY.getValue());
        transactionRule.setActive(true);
        transactionRule.setDescriptionRule("");

        transactionRuleService.create(transactionRule);
        merchantRules.computeIfAbsent(merchant, k -> new ArrayList<>()).add(transactionRule);
    }

//    private void createCategoryRule(String categoryId, CategoryType categoryType)
//    {
//        TransactionRule transactionRule = new TransactionRule();
//        transactionRule.setCategoryId(categoryId);
//        transactionRule.setPriority(PriorityLevel.CATEGORY_ID_ONLY.getValue());
//        transactionRule.setMatchedCategory(categoryType.name());
//        transactionRule.setActive(true);
//        transactionRule.setDescriptionPattern("");
//        transactionRule.setSystemRule(true);
//        transactionRuleService.create(transactionRule);
//        categoryIdRules.computeIfAbsent(categoryId, k -> new ArrayList<>()).add(transactionRule);
//    }
//
//    private void createMerchantCategoryRules(String merchant, String categoryId, CategoryType categoryType)
//    {
//        TransactionRule transactionRule = new TransactionRule();
//        transactionRule.setMerchantPattern(merchant);
//        transactionRule.setCategoryId(categoryId);
//        transactionRule.setMatchedCategory(categoryType.name());
//        transactionRule.setPriority(PriorityLevel.MERCHANT_CATEGORY.getValue());
//        transactionRule.setSystemRule(true);
//        transactionRule.setActive(true);
//        transactionRule.setDescriptionPattern("");
//        transactionRuleService.create(transactionRule);
//
//        combinationRules.computeIfAbsent(merchant, k -> new ArrayList<>()).add(transactionRule);
//    }
//
//    private void createCategoryNameRule(String categoryName, CategoryType categoryType)
//    {
//        TransactionRule rule = new TransactionRule();
//        rule.setCategoryName(categoryName);
//        rule.setMatchedCategory(categoryType.name());
//        rule.setPriority(PriorityLevel.CATEGORY_NAME_ONLY.getValue());
//        rule.setSystemRule(true);
//        rule.setActive(true);
//
//        transactionRuleService.create(rule);
//        categoryNameRules.computeIfAbsent(categoryName, k -> new ArrayList<>()).add(rule);
//    }
//
//    private void createSpecialCaseRules(String categoryName, String categoryId, CategoryType categoryType)
//    {
//        TransactionRule transactionRule = new TransactionRule();
//        transactionRule.setCategoryName(categoryName);
//        transactionRule.setCategoryId(categoryId);
//        transactionRule.setMatchedCategory(categoryType.name());
//        transactionRule.setActive(true);
//        transactionRule.setDescriptionPattern("");
//        transactionRule.setSystemRule(true);
//        transactionRuleService.create(transactionRule);
//
//        String key = categoryName + ":" + categoryId;
//        combinationRules.computeIfAbsent(key, k -> new ArrayList<>()).add(transactionRule);
//    }
//
//    private void createDescriptionRules(String description, String categoryId, CategoryType categoryType)
//    {
//        TransactionRule transactionRule = new TransactionRule();
//        transactionRule.setDescriptionPattern(description);
//        transactionRule.setCategoryId(categoryId);
//        transactionRule.setMatchedCategory(categoryType.name());
//        transactionRule.setActive(true);
//        transactionRule.setDescriptionPattern("");
//        transactionRule.setSystemRule(true);
//        transactionRuleService.create(transactionRule);
//        descriptionRules.computeIfAbsent(description, k -> new ArrayList<>()).add(transactionRule);
//    }
//
//


}
