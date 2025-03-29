package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.workbench.PlaidCategoryManager;
import com.app.budgetbuddy.workbench.TransactionPatternBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.regex.Pattern;

import static com.app.budgetbuddy.workbench.TransactionPatternBuilder.buildPattern;

@Service
@Slf4j
public class RecurringTransactionCategoryRuleMatcher extends AbstractTransactionMatcher<RecurringTransaction, RecurringTransactionRule>
{
    private Map<RecurringTransactionRule, String> matchedRecurringTransactionRules = new HashMap<>();
    private List<RecurringTransactionRule> unmatchedRecurringTransactionRules = new ArrayList<>();
    private Map<Integer, List<RecurringTransactionRule>> groupRulesByPriority = new HashMap<>();
    private Map<Integer, List<RecurringTransaction>> groupRecurringTransactionsByPriority = new HashMap<>();

    @Autowired
    public RecurringTransactionCategoryRuleMatcher(TransactionRuleService transactionRuleService, CategoryService categoryService, PlaidCategoryManager plaidCategoryManager)
    {
        super(transactionRuleService, categoryService,  plaidCategoryManager);
    }

    @Override
    protected CategoryType matchRulesByPriority(final RecurringTransaction transaction, final int priority)
    {
//        return switch (priority) {
//            case 1 -> matchCompleteDataRules(transaction);
//            case 2 -> matchWithoutTransactionDescriptionRules(transaction);
//            case 3 -> matchWithoutMerchantRules(transaction);
//            case 4 -> matchWithoutCategoryDescriptionRules(transaction);
//            case 5 -> matchCategoryIdOnlyRules(transaction);
//            default -> throw new RuntimeException("Priority not found: " + priority);
//        };
        return null;
    }

    @Override
    protected CategoryType determineCategoryMatchByTransaction(RecurringTransaction transaction, String categoryId, String categoryName, String merchantName, String transactionDescription)
    {
//        if(transaction == null)
//        {
//            return CategoryType.UNCATEGORIZED;
//        }
//        CategoryType financialResult = checkFinancialCategoryRules(categoryId, merchantName, transaction);
//        if(financialResult != CategoryType.UNCATEGORIZED)
//        {
//            return financialResult;
//        }
//        CategoryType merchantCategoryMatch = checkMerchantCategoryRules(merchantName, categoryId);
//        if(merchantCategoryMatch != CategoryType.UNCATEGORIZED)
//        {
//            return merchantCategoryMatch;
//        }
//        // Check Transaction description rules
//        CategoryType transactionDescriptionMatch = checkTransactionDescriptionRules(categoryId, transactionDescription);
//        if(transactionDescriptionMatch != CategoryType.UNCATEGORIZED)
//        {
//            return transactionDescriptionMatch;
//        }
//        // Check category name and id rules
//        CategoryType categoryRuleMatch = checkCategoryRules(categoryId, categoryName);
//        if(categoryRuleMatch != CategoryType.UNCATEGORIZED)
//        {
//            return categoryRuleMatch;
//        }
//        CategoryType specialCaseMatch = checkSpecialCaseRules(categoryId, categoryName);
//        if(specialCaseMatch != CategoryType.UNCATEGORIZED)
//        {
//            return specialCaseMatch;
//        }
//        CategoryType merchantMatch = checkMerchantCategoryIDRules(merchantName, categoryId);
//        if(merchantMatch != CategoryType.UNCATEGORIZED)
//        {
//            return merchantMatch;
//        }
//        CategoryType paymentRule = checkPaymentRule(categoryId, categoryName, transactionDescription, transaction);
//        if(paymentRule != CategoryType.UNCATEGORIZED)
//        {
//            return paymentRule;
//        }
//
//        // Check Merchant Only rules
//        CategoryType merchantOnlyRules = checkMerchantRules(merchantName);
//        if(merchantOnlyRules != CategoryType.UNCATEGORIZED)
//        {
//            return merchantOnlyRules;
//        }
//        CategoryType categoryNameOnlyRules = checkCategoryNameRules(categoryName);
//        if(categoryNameOnlyRules != CategoryType.UNCATEGORIZED)
//        {
//            return categoryNameOnlyRules;
//        }
//        return CategoryType.UNCATEGORIZED;
        return null;
    }

    public Map<Integer, List<RecurringTransaction>> groupRecurringTransactionsByPriority(List<RecurringTransaction> recurringTransactions)
    {
        if(recurringTransactions.isEmpty())
        {
            return groupRecurringTransactionsByPriority;
        }
        for(RecurringTransaction transaction : recurringTransactions)
        {
            String transactionDescription = transaction.getDescription();
            String merchantName = transaction.getMerchantName();
            String categoryId = transaction.getCategoryId();
            Optional<CategoryEntity> categoryOptional = getCategoryEntityById(categoryId);
            if(categoryOptional.isEmpty())
            {
                continue;
            }
            CategoryEntity category = categoryOptional.get();
            String categoryName = category.getName();
            String categoryDescription = category.getDescription();
            int priorityLevel;
            if (categoryId != null && categoryName != null && categoryDescription != null &&
                    transactionDescription != null && merchantName != null)
            {
                priorityLevel = 1; // Highest priority - all data present
            }
            else if (categoryId != null && categoryName != null && categoryDescription != null &&
                    merchantName != null)
            {
                priorityLevel = 2; // Missing transaction description
            } else if (categoryId != null && categoryName != null && categoryDescription != null) {
                priorityLevel = 3; // Missing merchant name
            } else if (categoryId != null && categoryName != null)
            {
                priorityLevel = 4; // Missing category description
            } else if (categoryId != null)
            {
                priorityLevel = 5; // Only have category ID
            } else
            {
                continue; // Skip transactions with insufficient data
            }
            // Add transaction to the appropriate priority group
            groupRecurringTransactionsByPriority.computeIfAbsent(priorityLevel, k -> new ArrayList<>())
                    .add(transaction);
        }
        return groupRecurringTransactionsByPriority;
    }

    public Map<String, Pair<RecurringTransactionRule, List<RecurringTransaction>>> categorizeRecurringTransactions(List<RecurringTransaction> uncategorizedTransactions)
    {
        Map<Integer, List<RecurringTransaction>> transactionsByPriority = groupRecurringTransactionsByPriority(uncategorizedTransactions);
        Map<String, Pair<RecurringTransactionRule, List<RecurringTransaction>>> categorizedTransactions = new HashMap<>();
        for(Map.Entry<Integer, List<RecurringTransaction>> entry : transactionsByPriority.entrySet())
        {
            int priority = entry.getKey();
            List<RecurringTransaction> transactions = entry.getValue();
            for(RecurringTransaction transaction : transactions)
            {
                Optional<RecurringTransactionRule> transactionRuleOptional = categorizeTransaction(transaction, priority);
                if(transactionRuleOptional.isPresent())
                {
                   RecurringTransactionRule transactionRule = transactionRuleOptional.get();
                    String categoryName = transactionRule.getMatchedCategory();
                    if(categorizedTransactions.containsKey(categoryName))
                    {
                        Pair<RecurringTransactionRule, List<RecurringTransaction>> existingPair = categorizedTransactions.get(categoryName);
                        existingPair.getSecond().add(transaction);
                    }
                    else
                    {
                        List<RecurringTransaction> transactionsList = new ArrayList<>();
                        transactionsList.add(transaction);
                        Pair<RecurringTransactionRule, List<RecurringTransaction>> newPair = Pair.of(transactionRule, transactionsList);
                        categorizedTransactions.put(categoryName, newPair);
                    }
                }
            }
        }
        return categorizedTransactions;
    }

    @Override
    public Optional<RecurringTransactionRule> categorizeTransaction(final RecurringTransaction transaction, final int priority)
    {
        if(transaction == null)
        {
            return Optional.empty();
        }
//
//        loadTransactionRules();
//        // Check for user-defined rules first
//        if (userCategoryRules != null && !userCategoryRules.isEmpty()) {
//            for (UserCategoryRule userRule : userCategoryRules) {
//                if (userRule.isActive() && matchesUserRule(transaction, userRule)) {
//                    RecurringTransactionRule matchedRule = createTransactionRule(
//                            transaction,
//                            userRule.getCategoryName(),
//                            "",
//                            PriorityLevel.USER_DEFINED.getValue()
//                    );
//                    addMatchedRecurringTransactions(matchedRule, userRule.getCategoryName());
//                    return Optional.of(matchedRule);
//                }
//            }
//        }
//
//        // Apply appropriate rules based on priority level
//        CategoryType matchedCategory = matchRulesByPriority(transaction, priority);
//
//        // Create rule based on matched category
//        if (matchedCategory != null && matchedCategory != CategoryType.UNCATEGORIZED) {
//            RecurringTransactionRule matchedRule = createTransactionRule(
//                    transaction,
//                    matchedCategory.name(),
//                    "",
//                    priority
//            );
//            addMatchedRecurringTransactions(matchedRule, matchedCategory.name());
//            return Optional.of(matchedRule);
//        }
//
//        // Fall back to Plaid category if available
//        String plaidCategory = getTransactionCategory(transaction);
//        if (!UNCATEGORIZED.equals(plaidCategory)) {
//            RecurringTransactionRule plaidRule = createTransactionRule(
//                    transaction,
//                    plaidCategory,
//                    "",
//                    priority
//            );
//            addMatchedRecurringTransactions(plaidRule, plaidCategory);
//            return Optional.of(plaidRule);
//        }
//
//        // If no match found, return uncategorized
//        RecurringTransactionRule uncategorizedRule = createTransactionRule(
//                transaction,
//                UNCATEGORIZED,
//                "",
//                priority
//        );
//        addUnmatchedRecurringTransaction(uncategorizedRule);
//        return Optional.of(uncategorizedRule);
        return null;

    }

    public void addMatchedRecurringTransactions(RecurringTransactionRule recurringTransaction, String category) {
        matchedRecurringTransactionRules.put(recurringTransaction, category);
    }

    public void addUnmatchedRecurringTransaction(RecurringTransactionRule recurringTransaction){
        unmatchedRecurringTransactionRules.add(recurringTransaction);
    }


    private RecurringTransactionRule createTransactionRule(RecurringTransaction transaction, String category, String matchByText, int priority) {
        RecurringTransactionRule rule = new RecurringTransactionRule();
        rule.setTransactionId(transaction.getTransactionId());
        rule.setRecurring(true);
        rule.setMatchedCategory(category);
        rule.setPriority(priority);
        rule.setFrequency(transaction.getFrequency());

        // Build patterns using TransactionPatternBuilder
        String merchantName = transaction.getMerchantName();
        if (transaction.getMerchantName() != null && !transaction.getMerchantName().isEmpty()) {
            String merchantPattern = buildPattern(
                    merchantName,              // text to match against
                    matchByText,              // keyword to find
                    TransactionMatchType.EXACT // exact match for merchant
            );
            rule.setMerchantPattern(merchantPattern);
        }

        final String description = transaction.getDescription();
        if (transaction.getDescription() != null && !transaction.getDescription().isEmpty()) {
            String descriptionPattern = buildPattern(
                    description,                // text to match against
                    matchByText,                // keyword to find
                    TransactionMatchType.EXACT  // exact match for description
            );
            rule.setDescriptionPattern(descriptionPattern);
        }

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
