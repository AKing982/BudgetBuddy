package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.UserCategoryRule;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.CategoryRuleEntity;
import com.app.budgetbuddy.services.CategoryService;
import lombok.Getter;
import lombok.Setter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

@Service
@Getter
@Setter
public class TransactionCategoryRuleMatcher extends AbstractTransactionMatcher<Transaction>
{
    private List<UserCategoryRule> userCategoryRules;
    private Map<Transaction, String> matchedTransactions = new HashMap<>();
    private List<Transaction> unmatchedTransactions = new ArrayList<>();
    private Logger LOGGER = LoggerFactory.getLogger(TransactionCategoryRuleMatcher.class);

    @Autowired
    public TransactionCategoryRuleMatcher(CategoryRuleService categoryRuleService, CategoryService categoryService) {
        super(categoryRuleService, categoryService);
    }

    public void addUnmatchedTransactions(Transaction transaction){
        unmatchedTransactions.add(transaction);
    }

    public void addMatchedTransactions(String category, Transaction transaction){
        this.matchedTransactions.putIfAbsent(transaction, category);
    }

    /**
     * Loads the user category rules by a particular userId
     * @param userId
     */
    public void loadUserCategoryRules(Long userId)
    {
        List<CategoryRuleEntity> categoryRuleEntities = categoryRuleService.findByUserId(userId);
        if(!categoryRuleEntities.isEmpty()) {
            List<CategoryRule> categoryRulesForUser = categoryRuleService.getConvertedCategoryRules(categoryRuleEntities);
            if(!categoryRulesForUser.isEmpty()) {
                this.systemCategoryRules.addAll(categoryRulesForUser);
            }
        }
    }

    public String categorizeTransactionByCustomRule(Transaction transaction, UserCategoryRule userCategoryRule)
    {
        return null;
    }

    public String categorizeTransaction(Transaction transaction)
    {
        if(transaction == null){
            return "";
        }

        loadCategoryRules();
        for(CategoryRule categoryRule : systemCategoryRules){
            if(matchesRule(transaction, categoryRule)){
                String categoryName = categoryRule.getCategoryName();
                addMatchedTransactions(categoryName, transaction);
                return categoryRule.getCategoryName();
            }
            addUnmatchedTransactions(transaction);
        }

        return "Uncategorized";
    }

    public Boolean matchesRule(Transaction transaction, CategoryRule categoryRule)
    {
        if(transaction == null || categoryRule == null)
        {
            return false;
        }
        boolean merchantMatches = false;
        boolean descriptionMatches = false;
        boolean categoryListMatches = false;
        boolean categoryIdMatches = false;

        // Match on the merchant pattern
        if(categoryRule.getMerchantPattern() != null && transaction.getMerchantName() != null && !transaction.getMerchantName().isEmpty()){
            merchantMatches = Pattern.compile(categoryRule.getMerchantPattern(), Pattern.CASE_INSENSITIVE)
                    .matcher(transaction.getMerchantName())
                    .find();
        }

        // Match on the description pattern
        if(categoryRule.getDescriptionPattern() != null && transaction.getDescription() != null && !transaction.getDescription().isEmpty()){
            descriptionMatches = Pattern.compile(categoryRule.getDescriptionPattern(), Pattern.CASE_INSENSITIVE)
                    .matcher(transaction.getDescription())
                    .find();

        }

        // Match on Category List
        if(categoryRule.getCategoryName() != null && transaction.getCategories() != null) {
            String categoryRuleName = categoryRule.getCategoryName();
            categoryListMatches = transaction.getCategories().contains(categoryRuleName);
        }

        // Match on Category Id
        if(categoryRule.getCategoryName() != null && transaction.getCategoryId() != null) {
            String transactionCategoryId = transaction.getCategoryId();
            LOGGER.info("Transaction category ID: " + transactionCategoryId);
            // Does the transaction categoryId have a name that matches the category name in the category rule?
            String foundCategoryName = getCategoryNameById(transactionCategoryId);
            LOGGER.info("Found Category Name: " + foundCategoryName);
            categoryIdMatches = foundCategoryName.equals(categoryRule.getCategoryName());
        }

        return merchantMatches || descriptionMatches || categoryListMatches || categoryIdMatches;
    }

    public List<CategoryRule> getMatchingCategoryRulesForTransaction(Transaction transaction)
    {
        return null;
    }
}
