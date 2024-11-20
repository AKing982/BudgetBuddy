package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.workbench.PlaidCategoryManager;
import com.app.budgetbuddy.workbench.TransactionPatternBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@Slf4j
public class RecurringTransactionCategoryRuleMatcher extends AbstractTransactionMatcher<RecurringTransaction, RecurringTransactionRule>
{
    private Map<RecurringTransactionRule, String> matchedRecurringTransactionRules = new HashMap<>();
    private List<RecurringTransactionRule> unmatchedRecurringTransactionRules = new ArrayList<>();
    private Map<Integer, List<RecurringTransactionRule>> groupRulesByPriority = new HashMap<>();

    @Autowired
    public RecurringTransactionCategoryRuleMatcher(CategoryRuleService categoryRuleService, CategoryService categoryService, PlaidCategoryManager plaidCategoryManager) {
        super(categoryRuleService, categoryService,  plaidCategoryManager);
    }

    @Override
    public RecurringTransactionRule categorizeTransaction(RecurringTransaction transaction) {
        if(transaction == null){
            throw new IllegalArgumentException("Recurring transaction cannot be null");
        }

        loadCategoryRules();
        // Create initial transaction rule
        RecurringTransactionRule matchedRule = createTransactionRule(transaction);
        // Check system rules first
        if(!systemCategoryRules.isEmpty()){
            for (CategoryRule categoryRule : systemCategoryRules) {
                if (matchesRule(matchedRule, categoryRule)) {
                    matchedRule = createMatchedRule(transaction, categoryRule);
                    addMatchedRecurringTransactions(matchedRule, categoryRule.getCategoryName());
                    return matchedRule;
                }
            }
        }else
        {
            String category = getTransactionCategory(transaction);
            if(!UNCATEGORIZED.equals(category)){
                matchedRule = createTransactionRule(transaction);
                matchedRule.setMatchedCategory(category);
                matchedRule.setPriority(determineSystemPriority(transaction));
                addMatchedRecurringTransactions(matchedRule, category);
                return matchedRule;
            }
        }

        // If no system rule matches, add to unmatched
        addUnmatchedRecurringTransaction(matchedRule);
        return matchedRule;
    }



    public RecurringTransactionRule categorizeTransactionByUserRules(RecurringTransaction transaction, Long userId) {
        if (transaction == null) {
            throw new IllegalArgumentException("Recurring transaction cannot be null");
        }
        if (userId < 1) {
            throw new InvalidUserIDException("User ID is invalid: " + userId);
        }

        loadUserCategoryRules(userId);
        RecurringTransactionRule transactionRule = createTransactionRule(transaction);
        for (UserCategoryRule userRule : userCategoryRules) {
            if (!userRule.getUserId().equals(userId) || !userRule.isActive()) {
                continue;
            }

            if (matchesRule(transactionRule, userRule)) {
                RecurringTransactionRule matchedRule = createMatchedRule(transaction, userRule);
                addMatchedRecurringTransactions(matchedRule, userRule.getCategoryName());
                return matchedRule;
            }
        }

        addUnmatchedRecurringTransaction(transactionRule);
        return transactionRule;
    }


    public void addMatchedRecurringTransactions(RecurringTransactionRule recurringTransaction, String category) {
        matchedRecurringTransactionRules.put(recurringTransaction, category);
    }

    public void addUnmatchedRecurringTransaction(RecurringTransactionRule recurringTransaction){
        unmatchedRecurringTransactionRules.add(recurringTransaction);
    }


    private RecurringTransactionRule createTransactionRule(RecurringTransaction transaction) {
        RecurringTransactionRule rule = new RecurringTransactionRule();
        rule.setTransactionId(transaction.getTransactionId());
        rule.setRecurring(true);
        rule.setFrequency(transaction.getFrequency());

        // Build patterns using TransactionPatternBuilder
        if (transaction.getMerchantName() != null && !transaction.getMerchantName().isEmpty()) {
            rule.setMerchantPattern(TransactionPatternBuilder.buildMerchantPattern(
                    List.of(transaction.getMerchantName())
            ));
        }

        if (transaction.getDescription() != null && !transaction.getDescription().isEmpty()) {
//            rule.setDescriptionPattern(TransactionPatternBuilder.buildDescriptionPattern(
//                    transaction.getDescription(),
//                    TransactionMatchType.EXACT
//            ));
        }

        return rule;
    }

    private RecurringTransactionRule createMatchedRule(RecurringTransaction transaction, CategoryRule categoryRule) {
//        RecurringTransactionRule rule = createTransactionRule(transaction);
//        rule.setMatchedCategory(categoryRule.getCategoryName());
//        rule.setPriority(categoryRule instanceof UserCategoryRule ?
//                ((UserCategoryRule) categoryRule).getPriority() : determinePriority(transaction));
//        return rule;
        return null;
    }

    private TransactionRule createUncategorizedRule(RecurringTransaction transaction) {
        TransactionRule rule = createTransactionRule(transaction);
        rule.setMatchedCategory("Uncategorized");
        rule.setPriority(0);
        return rule;
    }


    @Override
    public Boolean matchesRule(RecurringTransactionRule transaction, CategoryRule categoryRule) {

        if (transaction == null || categoryRule == null) {
            return false;
        }

        return matchesMerchantPatternRule(transaction, categoryRule) ||
                matchesDescriptionPatternRule(transaction, categoryRule) ||
                matchesCategoryPatternRule(transaction, categoryRule) ||
                matchOnFrequency(categoryRule.getFrequency(), transaction.getFrequency()) ||
                matchOnRecurring(categoryRule.isRecurring(), transaction.isRecurring());
    }

    private boolean matchOnFrequency(String ruleFrequency, String transactionFrequency){
        return ruleFrequency != null && transactionFrequency != null &&
                Pattern.compile(ruleFrequency, Pattern.CASE_INSENSITIVE)
                        .matcher(transactionFrequency)
                        .find();
    }

    private boolean matchOnRecurring(boolean ruleRecurring, Boolean transactionRecurring) {
        return ruleRecurring == transactionRecurring;
    }
}
