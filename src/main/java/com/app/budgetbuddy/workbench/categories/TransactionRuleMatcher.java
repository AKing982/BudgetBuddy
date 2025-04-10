package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.repositories.AccountRepository;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.TransactionService;
import com.app.budgetbuddy.workbench.PlaidCategoryManager;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@Getter
@Setter
@Slf4j
public class TransactionRuleMatcher extends AbstractTransactionMatcher<Transaction, TransactionRule>
{
    private Map<TransactionRule, String> matchedTransactions = new HashMap<>();
    private List<TransactionRule> unmatchedRules = new ArrayList<>();
    private final Map<Integer, List<TransactionRule>> groupedRulesByPriority = new HashMap<>();
    private final TransactionCategorizer transactionCategorizer;
    private final List<String> defaultPriorityOrders = new ArrayList<>();
    private final TransactionService transactionService;
    private Map<Integer, List<Transaction>> groupTransactionsByRuleType = new HashMap<>();
    private final AtomicInteger transactionCounter = new AtomicInteger(0);
    private Logger LOGGER = LoggerFactory.getLogger(TransactionRuleMatcher.class);

    @Autowired
    public TransactionRuleMatcher(TransactionRuleService transactionRuleService, CategoryService categoryService, PlaidCategoryManager plaidCategoryManager,
                                  TransactionCategorizer transactionCategorizer, TransactionService transactionService, AccountRepository accountRepository)
    {
        super(transactionRuleService, categoryService, plaidCategoryManager, accountRepository);
        this.transactionCategorizer = transactionCategorizer;
        this.transactionService = transactionService;
    }

    public void addUnmatchedTransactions(TransactionRule transaction)
    {
        unmatchedRules.add(transaction);
    }

    public void addMatchedTransactionRule(String category, TransactionRule transaction)
    {
        this.matchedTransactions.putIfAbsent(transaction, category);
    }

    public Map<Integer, List<Transaction>> groupTransactionsByPriority(final List<Transaction> transactions)
    {
        Map<Integer, List<Transaction>> resultMap = new HashMap<>();
        if(transactions.isEmpty())
        {
            return resultMap;
        }
        for(Transaction transaction : transactions)
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

            // Check for most complete data first
            if (categoryId != null && categoryName != null && categoryDescription != null &&
                    transactionDescription != null && merchantName != null) {
                priorityLevel = 1; // Highest priority - all data present
            }
            // Missing single fields
            else if (categoryId != null && categoryName != null && categoryDescription != null && merchantName != null) {
                priorityLevel = 2; // Missing transaction description only
            }
            else if (categoryId != null && categoryName != null && categoryDescription != null && transactionDescription != null) {
                priorityLevel = 3; // Missing merchant name only
            }
            else if (categoryId != null && categoryName != null && transactionDescription != null && merchantName != null) {
                priorityLevel = 4; // Missing category description only
            }
            else if (categoryId != null && categoryDescription != null && transactionDescription != null && merchantName != null) {
                priorityLevel = 5; // Missing category name only
            }
            // Missing multiple fields
            else if (categoryId != null && categoryName != null && categoryDescription != null) {
                priorityLevel = 6; // Missing both transaction description and merchant name
            }
            else if (transactionDescription != null && merchantName != null &&
                    categoryId == null && categoryName == null && categoryDescription == null) {
                priorityLevel = 7; // Missing all category information
            }
            else if (categoryId != null && categoryDescription != null && merchantName != null) {
                priorityLevel = 8; // Missing transaction description and category name
            }
            else {
                continue; // Skip transactions with other data combinations
            }
            // Add transaction to the appropriate priority group
            resultMap.computeIfAbsent(priorityLevel, k -> new ArrayList<>())
                    .add(transaction);
        }
        return resultMap;
    }


    public Map<String, TransactionRule> categorizeTransactions(final List<Transaction> uncategorizedTransactions)
    {
        Map<Integer, List<Transaction>> transactionsByPriority = groupTransactionsByPriority(uncategorizedTransactions);
        Map<String, TransactionRule> categorizedTransactions = new HashMap<>();
        for(Map.Entry<Integer, List<Transaction>> entry : transactionsByPriority.entrySet())
        {
            int priority = entry.getKey();
            List<Transaction> transactions = entry.getValue();
            for(Transaction transaction : transactions)
            {
                String transactionId = transaction.getTransactionId();
                Optional<TransactionRule> transactionRuleOptional = categorizeTransaction(transaction, priority);
                if(transactionRuleOptional.isPresent())
                {
                    TransactionRule transactionRule = transactionRuleOptional.get();
                    categorizedTransactions.putIfAbsent(transactionId, transactionRule);
                }
            }
        }
        return categorizedTransactions;
    }

    public CategoryType matchWithoutMerchantRules(Transaction transaction)
    {
        String categoryId = transaction.getCategoryId();
        String transactionDescription = transaction.getDescription();
        Optional<CategoryEntity> categoryEntityOptional = getCategoryEntityById(categoryId);
        if(categoryEntityOptional.isEmpty())
        {
            return CategoryType.UNCATEGORIZED;
        }
        CategoryEntity categoryEntity = categoryEntityOptional.get();
        String categoryName = categoryEntity.getName();
        CategoryType matchByTransactionDescription = checkTransactionDescriptionRules(categoryId, transactionDescription);
        if(matchByTransactionDescription != CategoryType.UNCATEGORIZED)
        {
            return matchByTransactionDescription;
        }
        return checkCategoryNameRules(categoryName);
    }

    public CategoryType checkMerchantCategoryDescriptionRules(final String merchantName, final String categoryId)
    {
        Map<String, CategoryType> merchantCategoryDescriptionMatch = MERCHANT_CATEGORY_DESCRIPTION.get(merchantName);
        if(merchantCategoryDescriptionMatch != null)
        {
            Optional<CategoryEntity> categoryEntityOptional = getCategoryEntityById(categoryId);
            if(categoryEntityOptional.isEmpty())
            {
                return CategoryType.UNCATEGORIZED;
            }
            CategoryEntity categoryEntity = categoryEntityOptional.get();
            String categoryDescription = categoryEntity.getDescription();
            return merchantCategoryDescriptionMatch.get(categoryDescription);
        }
        return CategoryType.UNCATEGORIZED;
    }

    public CategoryType matchWithoutCategoryNameRules(final Transaction transaction)
    {
        String categoryId = transaction.getCategoryId();
        String merchantName = transaction.getMerchantName();
        Optional<CategoryEntity> categoryEntityOptional = getCategoryEntityById(categoryId);
        if(categoryEntityOptional.isEmpty())
        {
            return CategoryType.UNCATEGORIZED;
        }
        return checkMerchantCategoryDescriptionRules(merchantName, categoryId);
    }

    public CategoryType matchRulesByPriority(final Transaction transaction, final int priority)
    {
        return switch (priority) {
            case 1 -> matchCompleteDataRules(transaction);
            case 2 -> matchWithoutTransactionDescriptionRules(transaction);
            case 3 -> matchWithoutMerchantRules(transaction);
            case 4 -> matchWithoutCategoryDescriptionRules(transaction);
            case 5 -> matchWithoutCategoryNameRules(transaction);
            case 6 -> matchCategoryIdOnlyRules(transaction);
            default -> throw new RuntimeException("Priority not found: " + priority);
        };
    }

    public CategoryType checkCategoryNameRules(final String categoryName)
    {
        String mappedCategory = CATEGORY_NAME_MAPPING.get(categoryName);
        if(mappedCategory == null)
        {
            return CategoryType.UNCATEGORIZED;
        }
        try
        {
            String enumFormat = mappedCategory.toUpperCase().replace(" ", "_");
            return CategoryType.valueOf(enumFormat);
        }catch(IllegalArgumentException e)
        {
            log.error("No matching CategoryType for mapped category: {}", mappedCategory, e);
            return CategoryType.UNCATEGORIZED;
        }
    }

    public CategoryType checkMerchantCategoryRules(final String merchantName, final String categoryId)
    {
        Map<String, CategoryType> merchantCategories = MERCHANT_CATEGORY_RULES.get(merchantName);
        if(merchantCategories != null && merchantCategories.containsKey(categoryId))
        {
            return merchantCategories.get(categoryId);
        }
        return CategoryType.UNCATEGORIZED;
    }

    public CategoryType checkMerchantRules(final String merchantName)
    {
        String subscription = MERCHANT_SUBSCRIPTIONS.get(merchantName);
        if(subscription != null && !subscription.isEmpty())
        {
            return CategoryType.SUBSCRIPTION;
        }
        Map<String, CategoryType> merchantCategories = MERCHANT_CATEGORY_RULES.get(merchantName);
        if(merchantCategories != null && !merchantCategories.isEmpty())
        {
            return merchantCategories.values().iterator().next();
        }
        return CategoryType.UNCATEGORIZED;
    }

    public CategoryType checkRulesWithoutTransactionDescription(final String categoryId, final String categoryName, final String merchantName, BigDecimal amount)
    {
        // Early validation
        if (categoryId == null || categoryName == null || merchantName == null) {
            return CategoryType.UNCATEGORIZED;
        }

        // 1. Special Amount-Based Rules
        if (merchantName.equals("Flex Finance") && amount != null) {
            BigDecimal flexValue = SPECIAL_AMOUNTS_RULES.get("Flex Finance");
            if (flexValue != null && amount.compareTo(flexValue) == 0) {
                return CategoryType.SUBSCRIPTION;
            } else {
                return CategoryType.RENT;
            }
        }

        // 2. Merchant + Category ID Rules
        Map<String, CategoryType> merchantCategories = MERCHANT_CATEGORY_RULES.get(merchantName);
        if (merchantCategories != null && merchantCategories.containsKey(categoryId)) {
            return merchantCategories.get(categoryId);
        }

        // 3. Category ID + Category Name Rules
        Map<String, CategoryType> categoryRules = CATEGORY_ID_RULES.get(categoryName);
        if (categoryRules != null && categoryRules.containsKey(categoryId)) {
            return categoryRules.get(categoryId);
        }

        // 4. Special Case Category Mapping
        Map<String, String> specialCaseMap = SPECIAL_CASE_CATEGORY_MAPPING.get(categoryName);
        if (specialCaseMap != null && specialCaseMap.containsKey(categoryId)) {
            String mappedCategory = specialCaseMap.get(categoryId);
            try {
                return CategoryType.valueOf(mappedCategory.toUpperCase().replace(" ", "_"));
            } catch (IllegalArgumentException e) {
                // Log and continue
            }
        }

        // 5. Merchant Mapping
        Map<String, String> merchantMap = MERCHANT_MAPPING.get(merchantName);
        if (merchantMap != null && merchantMap.containsKey(categoryId)) {
            String mappedCategory = merchantMap.get(categoryId);
            try {
                return CategoryType.valueOf(mappedCategory.toUpperCase().replace(" ", "_"));
            } catch (IllegalArgumentException e) {
                // Log and continue
            }
        }

        // 6. Specific category ID rules
        if ("18020004".equals(categoryId)) {
            return CategoryType.PAYMENT;
        }

        // 7. Merchant-Only Rules

        // 7a. Merchant Subscriptions
        String subscription = MERCHANT_SUBSCRIPTIONS.get(merchantName);
        if (subscription != null && !subscription.isEmpty()) {
            return CategoryType.SUBSCRIPTION;
        }

        // 7b. Merchant Utilities
        String utilities = MERCHANT_UTILITIES.get(merchantName);
        if (utilities != null && !utilities.isEmpty()) {
            return CategoryType.UTILITIES;
        }

        // 8. Category Name Only
        CategoryType categoryNameMatch = checkCategoryNameRules(categoryName);
        if (categoryNameMatch != CategoryType.UNCATEGORIZED) {
            return categoryNameMatch;
        }
        // No rules matched
        return CategoryType.UNCATEGORIZED;
    }

    public CategoryType checkCategoryRules(final String categoryId, final String categoryName)
    {
        Map<String, CategoryType> categoryRules = CATEGORY_ID_RULES.get(categoryName);
        if (categoryRules != null && categoryRules.containsKey(categoryId))
        {
            return categoryRules.get(categoryId);
        }
        return CategoryType.UNCATEGORIZED;
    }

    public CategoryType checkSpecialCaseRules(final String categoryId, final String categoryName)
    {
        Map<String, String> specialCaseMap = SPECIAL_CASE_CATEGORY_MAPPING.get(categoryName);
        if(specialCaseMap != null && specialCaseMap.containsKey(categoryId))
        {
            String mappedCategory = specialCaseMap.get(categoryId);
            try
            {
                return CategoryType.valueOf(mappedCategory.toUpperCase().replace(" ", "_"));
            }catch(IllegalArgumentException e)
            {
                log.error("Unable to map category: {}", mappedCategory, e);
                return CategoryType.UNCATEGORIZED;
            }
        }
        return CategoryType.UNCATEGORIZED;
    }


    public CategoryType checkTransactionDescriptionRules(String categoryId, String transactionDescription)
    {
        for(Map.Entry<String, Map<String, String>> entry : TRANSACTION_DESCRIPTION_MAPPING.entrySet())
        {
            String descriptionPattern = entry.getKey();
            if(transactionDescription.contains(descriptionPattern))
            {
                Map<String, String> categoryMapping = entry.getValue();
                if(categoryId != null && categoryMapping.containsKey(categoryId))
                {
                    String mappedCategory = categoryMapping.get(categoryId);
                    try
                    {
                        String enumFormat = mappedCategory.toUpperCase().replace(" ", "_");
                        return CategoryType.valueOf(enumFormat);
                    }catch(IllegalArgumentException e)
                    {
                        log.error("Unable to map category {} to CategoryType {}", categoryId, mappedCategory, e);
                        return CategoryType.UNCATEGORIZED;
                    }
                }
            }
        }
        if(transactionDescription.contains("PAYPAL INST XFER") && categoryId != null && categoryId.equals("21010004"))
        {
            return CategoryType.PAYMENT;
        }
        return CategoryType.UNCATEGORIZED;
    }

    public CategoryType checkMerchantUtilitiesRule(final String merchantName)
    {
        String utilities = MERCHANT_UTILITIES.get(merchantName);
        if(utilities != null && !utilities.isEmpty())
        {
            return CategoryType.UTILITIES;
        }
        return CategoryType.UNCATEGORIZED;
    }

    public CategoryType checkMerchantCategoryIDRules(final String merchantName, String categoryId)
    {
        Map<String, String> merchantMap = MERCHANT_MAPPING.get(merchantName);
        if(merchantMap != null && merchantMap.containsKey(categoryId))
        {
            String mappedCategory = merchantMap.get(categoryId);
            try
            {
                return CategoryType.valueOf(mappedCategory.toUpperCase().replace(" ", "_"));
            }catch(IllegalArgumentException e)
            {
                log.error("Unable to map category {} to CategoryType {}", categoryId, mappedCategory, e);
                return CategoryType.UNCATEGORIZED;
            }
        }
        return CategoryType.UNCATEGORIZED;
    }

    public CategoryType checkFinancialCategoryRules(String categoryId, String merchantName, Transaction transaction)
    {
        if(merchantName.equals("Flex Finance"))
        {
            BigDecimal transactionAmount = transaction.getAmount();
            final BigDecimal flexValue = new BigDecimal("14.990");
            if(transactionAmount.compareTo(flexValue) == 0)
            {
                return CategoryType.SUBSCRIPTION;
            }
            else
            {
                return CategoryType.RENT;
            }
        }
        return CategoryType.UNCATEGORIZED;
    }

    public CategoryType checkPaymentRule(final String categoryId, final String categoryName, final String description, final Transaction transaction)
    {
        String transactionDescription = transaction.getDescription();
        if("21010004".equals(categoryId) && transactionDescription.equals("PAYPAL INST XFER PAYPAL INST XFER"))
        {
            return CategoryType.PAYMENT;
        }
        else if("18020004".equals(categoryId))
        {
            return CategoryType.PAYMENT;
        }
        else if(categoryId.equals("16001000") && categoryName.equals("Credit Card") && description.equals("Payment"))
        {
            return CategoryType.PAYMENT;
        }
        return CategoryType.UNCATEGORIZED;
    }

    public CategoryType determineCategoryMatchByTransaction(final Transaction transaction, final String categoryId, final String categoryName, final String merchantName, final String transactionDescription)
    {
        if(transaction == null)
        {
            return CategoryType.UNCATEGORIZED;
        }
        CategoryType financialResult = checkFinancialCategoryRules(categoryId, merchantName, transaction);
        if(financialResult != CategoryType.UNCATEGORIZED)
        {
            return financialResult;
        }
        CategoryType merchantCategoryMatch = checkMerchantCategoryRules(merchantName, categoryId);
        if(merchantCategoryMatch != CategoryType.UNCATEGORIZED)
        {
            return merchantCategoryMatch;
        }
        // Check Transaction description rules
        CategoryType transactionDescriptionMatch = checkTransactionDescriptionRules(categoryId, transactionDescription);
        if(transactionDescriptionMatch != CategoryType.UNCATEGORIZED)
        {
            return transactionDescriptionMatch;
        }
        // Check category name and id rules
        CategoryType categoryRuleMatch = checkCategoryRules(categoryId, categoryName);
        if(categoryRuleMatch != CategoryType.UNCATEGORIZED)
        {
            return categoryRuleMatch;
        }
        CategoryType specialCaseMatch = checkSpecialCaseRules(categoryId, categoryName);
        if(specialCaseMatch != CategoryType.UNCATEGORIZED)
        {
            return specialCaseMatch;
        }
        CategoryType merchantMatch = checkMerchantCategoryIDRules(merchantName, categoryId);
        if(merchantMatch != CategoryType.UNCATEGORIZED)
        {
            return merchantMatch;
        }
        CategoryType paymentRule = checkPaymentRule(categoryId, categoryName, transactionDescription, transaction);
        if(paymentRule != CategoryType.UNCATEGORIZED)
        {
            return paymentRule;
        }

        // Check Merchant Only rules
        CategoryType merchantOnlyRules = checkMerchantRules(merchantName);
        if(merchantOnlyRules != CategoryType.UNCATEGORIZED)
        {
            return merchantOnlyRules;
        }
        CategoryType categoryNameOnlyRules = checkCategoryNameRules(categoryName);
        if(categoryNameOnlyRules != CategoryType.UNCATEGORIZED)
        {
            return categoryNameOnlyRules;
        }
        return CategoryType.UNCATEGORIZED;
    }

    private TransactionCategory createTransactionCategory(final String transactionId, final String category, final String plaidCategory, final int priority, final boolean isRecurring, final String categorizedBy)
    {
        return TransactionCategory.builder()
                .transactionId(transactionId)
                .matchedCategory(category)
                .plaidCategory(plaidCategory)
                .priority(priority)
                .isRecurring(isRecurring)
                .categorizedBy(categorizedBy)
                .build();
    }

    private TransactionRule createTransactionRule(Transaction transaction, String category, int priority) {
        TransactionRule transactionRule = new TransactionRule();
        transactionRule.setCategories(transaction.getCategories());
        transactionRule.setDescriptionPattern(transaction.getDescription());
        transactionRule.setMatchedCategory(category);
        transactionRule.setTransactionType("Debit");
        List<String> transactionCategories = transaction.getCategories();
        if (transactionCategories.get(0) != null) {
            transactionRule.setPlaidCategory(transactionCategories.get(0));
        }
        else if (transactionCategories.get(0) == null && transactionCategories.get(1) != null)
        {
            transactionRule.setPlaidCategory(transactionCategories.get(1));
        }
        transactionRule.setTransactionId(transaction.getTransactionId());
        transactionRule.setPriority(priority);
        transactionRule.setMerchantPattern(transaction.getMerchantName());
        return transactionRule;
    }


    @Override
    public Optional<TransactionRule> categorizeTransaction(final Transaction transaction, final int priority)
    {
        if(transaction == null)
        {
            return Optional.empty();
        }
        int currentCount = transactionCounter.incrementAndGet();
        log.info("Loading Category Rules");
        List<TransactionRule> rules = loadTransactionRules();
        if(rules.isEmpty())
        {
            log.warn("No System category rules found. Using direct categorization");
        }
        Long userId = getUserIdByAccountId(transaction.getAccountId());
        List<TransactionRule> transactionRules = loadUserCategoryRules(userId);
        if(transactionRules != null && !transactionRules.isEmpty())
        {
            CategorizationStrategy userStrategy = transactionCategorizer.getUserRulesStrategy();
            CategoryType userRuleCategory = userStrategy.categorizeWithUserRules(transaction, transactionRules);
            if(userRuleCategory != null && userRuleCategory != CategoryType.UNCATEGORIZED)
            {
                log.info("Transaction #{}: Matched user rule for category: {}",
                        currentCount, userRuleCategory);
                TransactionRule transactionRule = createTransactionRule(transaction, userRuleCategory.name(), PriorityLevel.USER_DEFINED.getValue());
                transactionRuleService.create(transactionRule);
                addMatchedTransactionRule(transactionRule.getMatchedCategory(), transactionRule);
                return Optional.of(transactionRule);
            }
        }

        if(priority <= PriorityLevel.NONE.getValue())
        {
            TransactionRule uncategorizedTransactionRule = createTransactionRule(transaction, UNCATEGORIZED, priority);
            return Optional.of(uncategorizedTransactionRule);
        }
        log.info("==========================================");
        log.info("Transaction #: {}", currentCount);
        log.info("Categorizing Transaction: {}", transaction);
        log.info("Transaction Priority: {}", priority);
        log.info("Transaction Plaid Categories: {}", transaction.getCategories());
        CategoryType matchedCategory = matchRulesByPriority(transaction, priority);
        log.info("Matched Level 1 Category: {}", matchedCategory);
        if(matchedCategory != null && matchedCategory != CategoryType.UNCATEGORIZED)
        {
            TransactionRule matchedRule = createTransactionRule(transaction, matchedCategory.name(), priority);
            log.info("Creating Transaction Rule: {}", matchedRule);
            log.info("===============================================");
            String transactionId = transaction.getTransactionId();
            transactionService.updateTransactionCategorizationFlag(transactionId);
            addMatchedTransactionRule(matchedRule.getMatchedCategory(), matchedRule);
            return Optional.of(matchedRule);
        }

        String plaidCategoryMatched = getTransactionCategory(transaction);
        if(!UNCATEGORIZED.equals(plaidCategoryMatched))
        {
            TransactionRule plaidRule = createTransactionRule(transaction, "UNCATEGORIZED", priority);
            return Optional.of(plaidRule);
        }
        TransactionRule uncategorizedRule = createTransactionRule(transaction, UNCATEGORIZED, priority);
        return Optional.of(uncategorizedRule);
    }

}
