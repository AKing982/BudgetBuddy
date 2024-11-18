package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.CategoryRuleEntity;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.workbench.TransactionPatternBuilder;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

@Service
@Getter
@Setter
@Slf4j
public class TransactionCategoryRuleMatcher extends AbstractTransactionMatcher<Transaction>
{
    private Map<TransactionRule, String> matchedTransactions = new HashMap<>();
    private List<TransactionRule> unmatchedRules = new ArrayList<>();
    private final Map<Integer, List<TransactionRule>> groupedRulesByPriority = new HashMap<>();
    private final String UNCATEGORIZED = "Uncategorized";
    private final List<String> defaultPriorityOrders = new ArrayList<>();
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
    public Boolean hasUserAssignedPriority(final TransactionRule transactionRule, final List<UserCategoryRule> userCategoryRules, final Long userId) {
        if(transactionRule == null || userId == null){
            return false;
        }

        for(UserCategoryRule userCategoryRule : userCategoryRules){
            if(userCategoryRule.getUserId().equals(userId)){
                boolean merchantMatches = transactionRule.getMerchantPattern().isEmpty() ||
                        matchesMerchantPattern(transactionRule, userCategoryRule);
                log.info("MerchantMatches: " + merchantMatches);
                boolean descriptionMatches = transactionRule.getDescriptionPattern().isEmpty() ||
                        matchesDescriptionPattern(transactionRule, userCategoryRule);
                log.info("DescriptionMatches: " + descriptionMatches);
                boolean categoryMatches = transactionRule.getMatchedCategory().isEmpty() ||
                        matchesCategoryPattern(transactionRule, userCategoryRule);
                log.info("CategoryMatches: " + categoryMatches);
                if(descriptionMatches &&
                    userCategoryRule.isActive() && userCategoryRule.getPriority() == transactionRule.getPriority() &&
                    merchantMatches && categoryMatches){
                    return true;
                }
            }
        }

        // 3. If there's a priority in the user assigned rules that matches the priority in the transactionRule
        log.info("No Match Found");
        return false;
    }

    public TransactionRule categorizeTransactionByUserRules(final Transaction transaction, final Long userId){
        if(transaction == null){
            throw new IllegalArgumentException("Transaction cannot be null");
        }

        if(userId < 1){
            throw new InvalidUserIDException("User ID is invalid: " + userId);
        }

        // 1. Load the user Category Rules
        loadUserCategoryRules(userId);

        // 2. Iterate through the user Category Rules
        int priority = determineTransactionPriority(transaction);
        TransactionRule transactionRule = createTransactionRuleWithPatterns(transaction, "Uncategorized", priority);
        for(UserCategoryRule userCategoryRule : userCategoryRules){
            if(!userCategoryRule.getUserId().equals(userId) || !userCategoryRule.isActive()){
                    continue;
            }
            if(matchesRule(transactionRule, userCategoryRule)){
                log.info("Rule Matches");
                TransactionRule matchedRule = createTransactionRuleWithPatterns(transaction, userCategoryRule.getCategoryName(), priority);
                addMatchedTransactionRule(matchedRule.getMatchedCategory(), transactionRule);
                return matchedRule;
            }
        }
        addUnmatchedTransactions(transactionRule);
        return transactionRule;
    }

    private TransactionRule createTransactionRuleWithPatterns(Transaction transaction, String category, int priority) {
        TransactionRule rule = new TransactionRule();
        rule.setTransactionId(transaction.getTransactionId());
        rule.setMatchedCategory(category);
        rule.setPriority(priority);
        rule.setCategories(transaction.getCategories());
        rule.setRecurring(false);

        // Build description pattern based on transaction type
        String description = transaction.getDescription();
        if (description != null && !description.isEmpty()) {
            String descPattern = TransactionPatternBuilder.buildDescriptionPattern(
                    description,
                    DescriptionMatchType.EXACT  // or TYPE_ONLY based on your needs
            );
            rule.setDescriptionPattern(descPattern);
        }

        // Build merchant pattern - could be exact match or multi-merchant
        String merchantName = transaction.getMerchantName();
        if (merchantName != null && !merchantName.isEmpty()) {
            String merchantPattern = TransactionPatternBuilder.buildMerchantPattern(
                    List.of(merchantName)  // For single merchant matching
            );
            rule.setMerchantPattern(merchantPattern);
        }

        return rule;
    }

    private TransactionRule createTransactionRule(Transaction transaction, String category, int priority){
        TransactionRule transactionRule = new TransactionRule();
        transactionRule.setFrequency("ONCE");
        transactionRule.setCategories(transaction.getCategories());
        transactionRule.setDescriptionPattern(transaction.getDescription());
        transactionRule.setMatchedCategory(category);
        transactionRule.setRecurring(false);
        transactionRule.setTransactionId(transaction.getTransactionId());
        transactionRule.setPriority(priority);
        transactionRule.setMerchantPattern(transaction.getMerchantName());
        return transactionRule;
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

    private int determineTransactionPriority(Transaction transaction){
        if (isHighPriority(transaction)) return 1;
        if (isMediumPriority(transaction)) return 2;
        if (isLowPriority(transaction)) return 3;
        return 0;
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
    public Boolean matchesRule(TransactionRule transaction, CategoryRule categoryRule)
    {
        if (transaction == null || categoryRule == null) {
            return false;
        }
        boolean matches = matchesMerchantPattern(transaction, categoryRule) ||
                matchesDescriptionPattern(transaction, categoryRule) ||
                matchesCategoryList(transaction, categoryRule);
        log.info("Matches: " + matches);
        return matches;
    }

    private boolean matchesMerchantPattern(TransactionRule transaction, CategoryRule rule) {
        return rule.getMerchantPattern() != null && transaction.getMerchantPattern() != null &&
                Pattern.compile(rule.getMerchantPattern(), Pattern.CASE_INSENSITIVE)
                        .matcher(transaction.getMerchantPattern())
                        .find();
    }

    private boolean matchesCategoryPattern(TransactionRule transactionRule, CategoryRule rule){
        String categoryRuleName = rule.getCategoryName();
        String transactionMatchedCategory = transactionRule.getMatchedCategory();
        log.info("Transaction Category: " + transactionMatchedCategory);
        return categoryRuleName != null && transactionMatchedCategory != null &&
                Pattern.compile(categoryRuleName, Pattern.CASE_INSENSITIVE)
                        .matcher(transactionMatchedCategory)
                        .find();
    }

    public void setCustomPriority(Long userId, List<String> customPriority){

    }

//    private TransactionRule createTransactionRule(Transaction transaction, String category, int priorityLevel){
//        TransactionRule transactionRule = new TransactionRule();
//        transactionRule.setCategories(transaction.getCategories());
//        transactionRule.setRecurring(false);
//        transactionRule.setPriority(priorityLevel);
//        transactionRule.setTransactionId(transaction.getTransactionId());
//        transactionRule.setMerchantPattern(transaction.getMerchantName());
//        transactionRule.setDescriptionPattern(transaction.getDescription());
//        transactionRule.setMatchedCategory(category);
//        return transactionRule;
//    }

    private boolean matchesDescriptionPattern(TransactionRule transaction, CategoryRule rule) {
        return rule.getDescriptionPattern() != null && transaction.getDescriptionPattern() != null &&
                Pattern.compile(rule.getDescriptionPattern(), Pattern.CASE_INSENSITIVE)
                        .matcher(transaction.getDescriptionPattern())
                        .find();
    }

    private boolean matchesCategoryList(TransactionRule transaction, CategoryRule rule) {
        return rule.getCategoryName() != null && transaction.getCategories() != null &&
                transaction.getCategories().contains(rule.getCategoryName());
    }

    private boolean matchesCategoryId(TransactionRule transactionRule, CategoryRule rule) {
//        String transactionCategoryId = transaction.get;
//        return rule.getCategoryName() != null && transactionCategoryId != null &&
//                rule.getCategoryName().equals(getCategoryNameById(transactionCategoryId));
        return false;
    }

    public List<CategoryRule> getMatchingCategoryRulesForTransaction(Transaction transaction)
    {
        List<CategoryRule> matchingRules = new ArrayList<>();
//        for (CategoryRule rule : systemCategoryRules) {
//            if (matchesRule(transaction, rule)) {
//                matchingRules.add(rule);
//            }
//        }
//        for (UserCategoryRule rule : userCategoryRules) {
//            if (matchesRule(transaction, rule)) {
//                matchingRules.add(rule);
//            }
//        }
//        return matchingRules;
        return null;
    }
}
