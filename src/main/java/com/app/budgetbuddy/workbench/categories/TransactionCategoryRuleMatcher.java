package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
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
    private Map<TransactionRule, String> matchedTransactions = new HashMap<>();
    private List<TransactionRule> unmatchedRules = new ArrayList<>();
    private final Map<Integer, List<TransactionRule>> groupedRulesByPriority = new HashMap<>();
    private final String UNCATEGORIZED = "Uncategorized";
    private final List<String> defaultPriorityOrders = new ArrayList<>();
    private final Map<Long, List<String>> userDefinedPriorities = new HashMap<>();
    private final String[] plaidCategoryList = {"Supermarkets and Groceries", "Financial", "Automotive", "Credit", "Third Party", "Withdrawal", "Gas Stations",
    "Payroll", "Digital Purchase", "Interest Earned", "Sports Clubs", "Utilities", "Glasses and Optometrist", "Personal Care", "Restaurants", "Gyms and Fitness Centers"};
    private Logger LOGGER = LoggerFactory.getLogger(TransactionCategoryRuleMatcher.class);

    @Autowired
    public TransactionCategoryRuleMatcher(CategoryRuleService categoryRuleService, CategoryService categoryService) {
        super(categoryRuleService, categoryService);
    }

    public void addUnmatchedTransactions(TransactionRule transaction){
        unmatchedRules.add(transaction);
    }

    public void addMatchedTransactionRule(String category, TransactionRule transaction){
        this.matchedTransactions.putIfAbsent(transaction, category);
    }

    public boolean isTransactionMatched(Transaction transaction){
        return this.matchedTransactions.containsKey(transaction);
    }

    public boolean isHighPriority(Transaction transaction) {
        return transaction.getMerchantName() != null && !transaction.getMerchantName().isEmpty()
                && transaction.getCategories() != null && !transaction.getCategories().isEmpty();
    }

    public boolean isMediumPriority(Transaction transaction) {
        return transaction.getDescription() != null && !transaction.getDescription().isEmpty()
                && transaction.getCategories() != null && !transaction.getCategories().isEmpty()
                && (transaction.getMerchantName() == null || transaction.getMerchantName().isEmpty());
    }

    public boolean isLowPriority(Transaction transaction) {
        return transaction.getCategories() != null && !transaction.getCategories().isEmpty()
                && (transaction.getMerchantName() == null || transaction.getMerchantName().isEmpty())
                && (transaction.getDescription() == null || transaction.getDescription().isEmpty());
    }

    public boolean isUncategorized(Transaction transaction) {
        return (transaction.getMerchantName() == null || transaction.getMerchantName().isEmpty())
                && (transaction.getDescription() == null || transaction.getDescription().isEmpty())
                && (transaction.getCategories() == null || transaction.getCategories().isEmpty());
    }

    public Integer getPriorityLevelForRule(TransactionRule transactionRule) {
        return null;
    }

    public List<TransactionRule> sortTransactionRulesByPriority(List<TransactionRule> transactionRules) {
        return transactionRules.stream()
                .sorted(Comparator.comparingInt(this::getPriorityLevelForRule))
                .toList();
    }

    /**
     * Checks if the transactionRule has a matching a UserCategory Rule with matching priority
     * @param transactionRule
     * @return
     */
    public Boolean hasUserAssignedPriority(TransactionRule transactionRule) {

        // 1. Get the Priority from the transactionRule

        // 2. Iterate through the user assigned rules

        // 3. If there's a priority in the user assigned rules that matches the priority in the transactionRule
        // Return true

        // Else return false

        return null;
    }

    public TransactionRule categorizeTransactionByUserRules(Transaction transaction, Long userId){
        if(transaction == null){
            throw new IllegalArgumentException("Transaction cannot be null");
        }

        // 1. Load the user Category Rules

        // 2. Iterate through the user Category Rules

        // 3. Does the transaction meet the priority criteria in the user defined rule?

        // 4. If the transaction meets the priority criteria in the user defined rule, then
        // create a Transaction Rule and return the rule
            // Else if the transaction doesn't meet the priority criteria then return as "Uncategorized"
            // Create an uncategorized TransactionRule and store in list

        // 5. Check that the created TransactionRule doesn't conflict with any existing TransactionRule already created?

        // 6. Add the Transaction Rule to the matched TransactionRules Map

        // 7. Return the Transaction Rule

//        loadUserCategoryRules(userId);
//        for(UserCategoryRule userCategoryRule : userCategoryRules){
//            if(matchesRule(transaction, userCategoryRule)){
//                String categoryName = userCategoryRule.getCategoryName();
//                addMatchedTransactionRule(categoryName, transaction);
//
//            }
//        }
//        addUnmatchedTransactions(transaction);
//        return "Uncategorized";
        return null;
    }

    public TransactionRule categorizeTransactionByCustomRule(Transaction transaction, UserCategoryRule userCategoryRule)
    {
        if(transaction == null || userCategoryRule == null){
            throw new IllegalArgumentException("Transaction or UserCategoryRule cannot be null");
        }

        // Does the user Category Rule exist in the known user category rules? (Check to see if UserCategoryRule is in the system)
        // If the user category rule doesn't exist, then throw an exception "No User Rule Exists".

        // 1. Does the transaction match the priority level of the user category rule?

        // 2. If the there's a match in the priority level, then create the TransactionRule
        // Else if there's no match then add to the unmatched transaction rules and create an uncategorizedTransactionRule

        // 3. Add the Transaction Rule to the matchedTransactionRules

//        if(matchesRule(transaction, userCategoryRule)){
//            String categoryName = userCategoryRule.getCategoryName();
//            addMatchedTransactionRule(categoryName, transaction);
//            return categoryName;
//        }
//        addUnmatchedTransactions(transaction);
//        return "Uncategorized";
        return null;
    }

    public void addTransactionRuleToGroup(TransactionRule transactionRule){

    }

    public TransactionRule categorizeTransactionNoDefaultRules(Transaction transaction){
        return null;
    }

    public void groupRulesByPriority(List<TransactionRule> transactionRules){

    }

    public TransactionRule matchByGroupedPriority(Transaction transaction){
        return null;
    }

    public TransactionRule resolveConflictsForTransaction(Transaction transaction, List<TransactionRule> transactionRules){
        return null;
    }

    public TransactionRule resolvePriorityConflict(TransactionRule transactionRule1, TransactionRule transactionRule2){
        return null;
    }

    /**
     * Matches the transaction by priority against default system category rules
     * @param priority
     * @param transaction
     * @return
     */
    public TransactionRule matchByPriority(int priority, Transaction transaction){
        return null;
    }

    public TransactionRule categorizeTransaction(Transaction transaction)
    {
//        if(transaction == null){
//            return "";
//        }
//
//        loadCategoryRules();
//        for(CategoryRule categoryRule : systemCategoryRules){
//            if(matchesRule(transaction, categoryRule)){
//                String categoryName = categoryRule.getCategoryName();
//                addMatchedTransactionRule(categoryName, transaction);
//                return categoryRule.getCategoryName();
//            }
//            addUnmatchedTransactions(transaction);
//        }
//        return "Uncategorized";
        return null;
    }

    @Override
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

    public void setCustomPriority(Long userId, List<String> customPriority){

    }

    private TransactionRule createTransactionRule(Transaction transaction, String category, int priorityLevel){
        TransactionRule transactionRule = new TransactionRule();
        transactionRule.setCategories(transaction.getCategories());
        transactionRule.setRecurring(false);
        transactionRule.setPriority(priorityLevel);
        transactionRule.setTransactionId(transaction.getTransactionId());
        transactionRule.setMerchantPattern(transaction.getMerchantName());
        transactionRule.setDescriptionPattern(transaction.getDescription());
        transactionRule.setMatchedCategory(category);
        return transactionRule;
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
