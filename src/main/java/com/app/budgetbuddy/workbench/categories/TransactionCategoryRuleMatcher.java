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
import java.util.regex.PatternSyntaxException;

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
        int priority = determinePriority(transaction, userCategoryRules);
        log.info("Priority: " + priority);
        TransactionRule transactionRule = createTransactionRuleWithPatterns(transaction, "Uncategorized", priority);
        for(UserCategoryRule userCategoryRule : userCategoryRules){
            if(!userCategoryRule.getUserId().equals(userId) || !userCategoryRule.isActive()){
                    continue;
            }
            if(matchesRule(transactionRule, userCategoryRule) && userCategoryRule.getPriority() == priority){
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

    private int determineSystemPriority(final Transaction transaction){
        boolean hasMerchant = (transaction.getMerchantName() != null || !transaction.getMerchantName().isEmpty());
        boolean hasDescription = (transaction.getDescription() != null || !transaction.getDescription().isEmpty());
        boolean hasCategories = (transaction.getCategories() != null || !transaction.getCategories().isEmpty());
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

    private boolean matchesMerchantPattern(Transaction transaction, UserCategoryRule userCategoryRule){
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

    private boolean matchesDescriptionPattern(Transaction transaction, UserCategoryRule userCategoryRule){
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

    private boolean matchesCategoryPattern(Transaction transaction, UserCategoryRule userCategoryRule){
        if(transaction.getCategories() == null || userCategoryRule.getCategoryName() == null){
            return false;
        }
        try
        {
            Pattern categoryPattern = Pattern.compile(userCategoryRule.getCategoryName(), Pattern.CASE_INSENSITIVE);
            return transaction.getCategories().stream()
                    .anyMatch(category -> categoryPattern.matcher(category).find());
        }catch(PatternSyntaxException e){
            log.error("Invalid category pattern in rule: {}", userCategoryRule.getCategoryName(), e);
            return false;
        }
    }

    private boolean hasMatchingUserRule(Transaction transaction, List<UserCategoryRule> userCategoryRules){
        if(userCategoryRules == null || userCategoryRules.isEmpty()){
            return false;
        }

        return userCategoryRules.stream()
                .filter(UserCategoryRule::isActive)
                .anyMatch(rule -> matchesUserRule(transaction, rule));
    }

    private boolean matchesUserRule(Transaction transaction, UserCategoryRule userCategoryRule){
        return (matchesMerchantPattern(transaction, userCategoryRule) ||
                matchesDescriptionPattern(transaction, userCategoryRule) ||
                matchesCategoryPattern(transaction, userCategoryRule));
    }

    public int determinePriority(final Transaction transaction, final List<UserCategoryRule> userCategoryRules)
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

    public TransactionRule categorizeTransaction(Transaction transaction)
    {
        if(transaction == null){
            throw new IllegalArgumentException("Transaction Cannot be null");
        }

        loadCategoryRules();
        int priority = determineSystemPriority(transaction);
        TransactionRule transactionRule = createTransactionRule(transaction, UNCATEGORIZED, priority);
        for(CategoryRule categoryRule : systemCategoryRules){
            if(matchesRule(transactionRule, categoryRule)){
                transactionRule = createTransactionRule(transaction, categoryRule.getCategoryName(), priority);

                addMatchedTransactionRule(transactionRule.getMatchedCategory(), transactionRule);
                return transactionRule;
            }
        }

        addUnmatchedTransactions(transactionRule);
        return transactionRule;
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

}
