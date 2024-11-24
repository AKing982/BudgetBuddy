package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.exceptions.CategoryNotFoundException;
import com.app.budgetbuddy.services.CategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class CategoryRuleCreator {
    private final CategoryRuleService categoryRuleService;
    private final CategoryService categoryService;
    private final List<UserCategoryRule> userDefinedRulesTransactions = new ArrayList<>();
    private final List<CategoryRule> systemDefinedRules = new ArrayList<>();

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


    public Map<String, Map<String, List<TransactionRule>>> groupTransactionRulesWithLogging(
            final List<TransactionRule> rules) {
        log.debug("Starting to group {} transaction rules", rules.size());

        // First, filter out invalid rules and log them
        List<TransactionRule> validRules = rules.stream()
                .filter(r -> {
                    if (r.getMatchedCategory() == null || r.getMatchedCategory().isEmpty()) {
                        log.warn("Found rule with null/empty category: {}", r);
                        return false;
                    }
                    if (r.getMerchantPattern() == null || r.getMerchantPattern().isEmpty()) {
                        log.warn("Found rule with null/empty merchant pattern: {}", r);
                        return false;
                    }
                    return true;
                })
                .collect(Collectors.toList());

        log.debug("Found {} valid rules after filtering", validRules.size());

        // Then group the valid rules
        Map<String, Map<String, List<TransactionRule>>> grouped = validRules.stream()
                .collect(Collectors.groupingBy(
                        TransactionRule::getMatchedCategory,
                        Collectors.groupingBy(
                                TransactionRule::getMerchantPattern,
                                Collectors.toList()
                        )
                ));

        log.debug("Grouped into {} categories", grouped.size());
        return grouped;
    }

//    public Map<String, Map<String, List<TransactionRule>>> groupTransactionsByCategory(final List<TransactionRule> transactions){
//        return transactions.stream()
//                .filter(r -> r.getMatchedCategory() != null
//                        && !r.getMatchedCategory().isEmpty()
//                        && r.getMerchantPattern() != null
//                        && !r.getMerchantPattern().isEmpty())
//                .collect(Collectors.groupingBy(
//                        rule -> rule.getMatchedCategory(),
//                        Collectors.groupingBy(
//                                rule -> rule.getMerchantPattern(),
//                                Collectors.toList()
//                        )
//                ));
//    }

    public Set<CategoryRule> createSystemRules(final List<? extends TransactionRule> matchedTransactions){
        if(matchedTransactions.isEmpty() || matchedTransactions == null){
            return new HashSet<>();
        }

        // 1. Initialize the New rules list
        Set<CategoryRule> newRules = new HashSet<>();

        // 2. Iterate through the matched transactions
        for(TransactionRule transactionRule : matchedTransactions){
            String categoryName = transactionRule.getMatchedCategory();
            CategoryRule newRule = createCategoryRule(
                    "",
                   categoryName,
                    transactionRule.getMerchantPattern(),
                    transactionRule.getDescriptionPattern(),
                    "ONCE",
                    TransactionType.CREDIT,
                    true,
                    transactionRule.getPriority()
            );

            // Does the newRules already contain the newly created rule?
            newRules.add(newRule);
        }

        return newRules;
    }

    @SuppressWarnings("unchecked")
    public <T extends CategoryRule> Set<T> convertGroupedRulesToCategoryRules(Map<String, Map<String, List<TransactionRule>>> groupedRules, Class<T> ruleType, Long userId){
        Set<T> newRules = new HashSet<>();
        groupedRules.forEach((category, merchantGroups) -> {
            merchantGroups.forEach((merchant, rules) -> {
                if (!rules.isEmpty()) {
                    // Take highest priority from the group
                    int maxPriority = rules.stream()
                            .mapToInt(TransactionRule::getPriority)
                            .max()
                            .orElse(0);

                    T consolidatedRule;
                    if (ruleType.equals(UserCategoryRule.class)) {
                        consolidatedRule = (T) createUserCategoryRule(
                                "",  // categoryId
                                category,
                                merchant,
                                findBestDescriptionPattern(rules),
                                "ONCE",
                                TransactionType.CREDIT,
                                shouldBeRecurring(rules),
                                maxPriority,
                                userId
                        );
                    } else {
                        consolidatedRule = (T) createCategoryRule(
                                "",  // categoryId
                                category,
                                merchant,
                                findBestDescriptionPattern(rules),
                                "ONCE",
                                TransactionType.CREDIT,
                                shouldBeRecurring(rules),
                                maxPriority
                        );
                    }

                    newRules.add(consolidatedRule);
                }
            });
        });

        return newRules;
    }

    private CategoryRule createCategoryRule(
            String categoryId,
            String category,
            String merchantPattern,
            String descriptionPattern,
            String frequency,
            TransactionType transactionType,
            boolean isRecurring,
            int priority) {
        return new CategoryRule(
                categoryId,
                category,
                merchantPattern,
                descriptionPattern,
                frequency,
                transactionType,
                isRecurring,
                priority
        );
    }

    private UserCategoryRule createUserCategoryRule(
            String categoryId,
            String category,
            String merchantPattern,
            String descriptionPattern,
            String frequency,
            TransactionType transactionType,
            boolean isRecurring,
            int priority,
            Long userId) {
        return new UserCategoryRule(
                categoryId,
                category,
                merchantPattern,
                descriptionPattern,
                frequency,
                transactionType,
                isRecurring,
                priority,
                userId,
                LocalDateTime.now(),
                LocalDateTime.now(),
                TransactionMatchType.EXACT,  // default match type
                merchantPattern,  // using merchant pattern as matchByText
                true  // isActive
        );
    }

    private boolean shouldBeRecurring(List<TransactionRule> rules) {
        // Logic to determine if this should be a recurring rule
        // Could be based on priority, number of similar transactions, etc.
        return rules.stream().anyMatch(r -> r.getPriority() > 1);
    }

    private String findBestDescriptionPattern(List<TransactionRule> rules) {
        // If all description patterns are the same, use that
        if (rules.stream().map(TransactionRule::getDescriptionPattern).distinct().count() == 1) {
            return rules.get(0).getDescriptionPattern();
        }

        // Otherwise, use the merchant pattern as the description pattern
        return rules.get(0).getMerchantPattern();
    }

    public Set<CategoryRule> combineTransactionRules(List<? extends TransactionRule> matchedTransactions){
        return null;
    }

    public Set<UserCategoryRule> combineTransactionUserRules(List<? extends TransactionRule> matchedTransactions){
        return null;
    }

    public Set<UserCategoryRule> createUserDefinedRules(final List<? extends TransactionRule> matchedTransactions, final Long userId){
        if (matchedTransactions == null || matchedTransactions.isEmpty()) {
            return new HashSet<>();
        }

        Set<UserCategoryRule> newRules = new HashSet<>();
        for(TransactionRule transactionRule : matchedTransactions){
            String categoryName = transactionRule.getMatchedCategory();
            UserCategoryRule newRule = new UserCategoryRule(
                    null, // `ruleId` is null for a new rule
                    userId, // User ID from the method context
                    LocalDateTime.now(), // Current date-time for `createdDate`
                    LocalDateTime.now(), // Current date-time for `modifiedDate`
                    TransactionMatchType.EXACT, // Default to `EXACT` match type
                    "", // `matchByText` is an empty string as placeholder
                    true // `isActive` set to true for an active rule
            );

            // Set inherited fields from the `transactionRule`
            newRule.setCategoryName(transactionRule.getMatchedCategory());
            newRule.setMerchantPattern(transactionRule.getMerchantPattern());
            newRule.setDescriptionPattern(transactionRule.getDescriptionPattern());
            newRule.setFrequency("ONCE");
            newRule.setTransactionType(TransactionType.CREDIT); // Assuming `CREDIT` as the type
            newRule.setRecurring(false); // Assuming the rule is not recurring
            newRule.setPriority(transactionRule.getPriority());
            newRules.add(newRule);
        }
        return newRules;
    }

    public void saveUserDefinedRules(final Map<String, UserCategoryRule> userDefinedRules){

    }

    public void saveSystemDefinedRules(final Map<String, CategoryRule> systemDefinedRules){

    }

    public List<CategoryRule> loadExistingCategoryRules(){
        return categoryRuleService.getSystemCategoryRules();
    }

    public List<UserCategoryRule> loadExistingUserCategoryRules(Long userId){
        return categoryRuleService.getUserCategoryRules(userId);
    }

}
