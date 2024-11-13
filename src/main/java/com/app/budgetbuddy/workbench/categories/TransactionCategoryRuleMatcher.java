package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.User;
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

    public String categorizeTransactionByUserRules(Transaction transaction, Long userId){
        if(transaction == null){
            throw new IllegalArgumentException("Transaction cannot be null");
        }
        loadUserCategoryRules(userId);
        for(UserCategoryRule userCategoryRule : userCategoryRules){
            if(matchesRule(transaction, userCategoryRule)){
                String categoryName = userCategoryRule.getCategoryName();
                addMatchedTransactions(categoryName, transaction);
                return categoryName;
            }
        }
        addUnmatchedTransactions(transaction);
        return "Uncategorized";
    }

    public String categorizeTransactionByCustomRule(Transaction transaction, UserCategoryRule userCategoryRule)
    {
        if(transaction == null || userCategoryRule == null){
            throw new IllegalArgumentException("Transaction or UserCategoryRule cannot be null");
        }
        if(matchesRule(transaction, userCategoryRule)){
            String categoryName = userCategoryRule.getCategoryName();
            addMatchedTransactions(categoryName, transaction);
            return categoryName;
        }
        addUnmatchedTransactions(transaction);
        return "Uncategorized";
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
        if (transaction == null || categoryRule == null) {
            return false;
        }
        return matchesMerchantPattern(transaction, categoryRule) ||
                matchesDescriptionPattern(transaction, categoryRule) ||
                matchesCategoryList(transaction, categoryRule) ||
                matchesCategoryId(transaction, categoryRule);
    }

    private boolean matchesMerchantPattern(Transaction transaction, CategoryRule rule) {
        return rule.getMerchantPattern() != null && transaction.getMerchantName() != null &&
                Pattern.compile(rule.getMerchantPattern(), Pattern.CASE_INSENSITIVE)
                        .matcher(transaction.getMerchantName())
                        .find();
    }

    private boolean matchesDescriptionPattern(Transaction transaction, CategoryRule rule) {
        return rule.getDescriptionPattern() != null && transaction.getDescription() != null &&
                Pattern.compile(rule.getDescriptionPattern(), Pattern.CASE_INSENSITIVE)
                        .matcher(transaction.getDescription())
                        .find();
    }

    private boolean matchesCategoryList(Transaction transaction, CategoryRule rule) {
        return rule.getCategoryName() != null && transaction.getCategories() != null &&
                transaction.getCategories().contains(rule.getCategoryName());
    }

    private boolean matchesCategoryId(Transaction transaction, CategoryRule rule) {
        String transactionCategoryId = transaction.getCategoryId();
        return rule.getCategoryName() != null && transactionCategoryId != null &&
                rule.getCategoryName().equals(getCategoryNameById(transactionCategoryId));
    }

    public List<CategoryRule> getMatchingCategoryRulesForTransaction(Transaction transaction)
    {
        List<CategoryRule> matchingRules = new ArrayList<>();
        for (CategoryRule rule : systemCategoryRules) {
            if (matchesRule(transaction, rule)) {
                matchingRules.add(rule);
            }
        }
        for (UserCategoryRule rule : userCategoryRules) {
            if (matchesRule(transaction, rule)) {
                matchingRules.add(rule);
            }
        }
        return matchingRules;
    }
}
