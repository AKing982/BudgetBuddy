package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.services.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class RecurringTransactionCategoryRuleMatcher extends AbstractTransactionMatcher<RecurringTransaction>
{
    private Map<RecurringTransaction, String> matchedRecurringTransactions = new HashMap<>();
    private List<RecurringTransaction> unmatchedRecurringTransactions = new ArrayList<>();

    @Autowired
    public RecurringTransactionCategoryRuleMatcher(CategoryRuleService categoryRuleService, CategoryService categoryService) {
        super(categoryRuleService, categoryService);
    }

    @Override
    public String categorizeTransaction(RecurringTransaction transaction) {
        if(transaction == null){
            throw new IllegalArgumentException("Recurring transaction cannot be null");
        }

        loadCategoryRules();
        for(CategoryRule categoryRule : systemCategoryRules){
            if(matchesRule(transaction, categoryRule)){
                String categoryName = categoryRule.getCategoryName();
                addMatchedRecurringTransactions(transaction, categoryName);
                return categoryName;
            }
        }
        addUnmatchedRecurringTransaction(transaction);
        return "Uncategorized";
    }

    public void addMatchedRecurringTransactions(RecurringTransaction recurringTransaction, String category) {
        matchedRecurringTransactions.put(recurringTransaction, category);
    }

    public void addUnmatchedRecurringTransaction(RecurringTransaction recurringTransaction){
        unmatchedRecurringTransactions.add(recurringTransaction);
    }


    @Override
    public Boolean matchesRule(RecurringTransaction transaction, CategoryRule categoryRule) {

        if (transaction == null || categoryRule == null) {
            return false;
        }

        return matchOnMerchantPattern(categoryRule.getMerchantPattern(), transaction.getMerchantName()) ||
                matchOnDescription(categoryRule.getDescriptionPattern(), transaction.getDescription()) ||
                matchOnCategoryId(categoryRule.getCategoryId(), transaction.getCategoryId()) ||
                matchOnFrequency(categoryRule.getFrequency(), transaction.getFrequency()) ||
                matchOnRecurring(categoryRule.isRecurring(), transaction.getActive());
    }

    private boolean matchOnMerchantPattern(String ruleMerchantPattern, String transactionMerchantName){
        return ruleMerchantPattern != null && transactionMerchantName != null &&
                Pattern.compile(ruleMerchantPattern, Pattern.CASE_INSENSITIVE)
                        .matcher(transactionMerchantName)
                        .find();
    }

    private boolean matchOnFrequency(String ruleFrequency, String transactionFrequency){
        return ruleFrequency != null && transactionFrequency != null &&
                Pattern.compile(ruleFrequency, Pattern.CASE_INSENSITIVE)
                        .matcher(transactionFrequency)
                        .find();
    }

    private boolean matchOnDescription(String ruleDescription, String transactionDescription){
        return ruleDescription != null && transactionDescription != null &&
                Pattern.compile(transactionDescription, Pattern.CASE_INSENSITIVE)
                        .matcher(transactionDescription)
                        .find();
    }

    private boolean matchOnCategoryId(String ruleCategoryId, String transactionCategoryId) {
        return ruleCategoryId != null && ruleCategoryId.equals(transactionCategoryId);
    }

    private boolean matchOnRecurring(boolean ruleRecurring, Boolean transactionRecurring) {
        return ruleRecurring == transactionRecurring;
    }
}
