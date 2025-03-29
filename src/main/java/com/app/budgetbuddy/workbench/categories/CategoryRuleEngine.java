package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.TransactionLoaderService;
import com.app.budgetbuddy.workbench.RecurringTransactionLoader;
import com.app.budgetbuddy.workbench.RecurringTransactionLoaderImpl;
import com.app.budgetbuddy.workbench.TransactionDataLoaderImpl;
import com.app.budgetbuddy.workbench.TransactionLoader;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@Slf4j
public class CategoryRuleEngine
{
    private final TransactionRuleCreator transactionRuleCreator;
    private final TransactionRuleMatcher transactionRuleMatcher;
    private final TransactionCategoryBuilder transactionCategoryBuilder;
    private final RecurringTransactionCategoryRuleMatcher recurringTransactionCategoryRuleMatcher;
    private final TransactionLoaderService transactionDataLoader;
    private static TransactionDataLoaderImpl transactionLoader;
    private static RecurringTransactionLoaderImpl recurringTransactionLoader;
    private Map<String, CategoryRule> categorizedTransactionSystemRules = new HashMap<>();
    private Map<String, UserCategoryRule> categorizedTransactionsUserRules = new HashMap<>();
    private Map<String, CategoryRule> categorizedRecurringTransactionSystemRules = new HashMap<>();
    private Map<String, UserCategoryRule> categorizedRecurringTransactionsUserRules = new HashMap<>();

    @Autowired
    public CategoryRuleEngine(TransactionRuleCreator transactionRuleCreator,
                              TransactionRuleMatcher transactionRuleMatcher,
                              TransactionCategoryBuilder transactionCategoryBuilder,
                              RecurringTransactionCategoryRuleMatcher recurringTransactionCategoryRuleMatcher,
                              TransactionLoaderService transactionDataLoader,
                              TransactionDataLoaderImpl transactionDataLoaderImpl,
                              RecurringTransactionLoaderImpl recurringTransactionLoaderImpl)
    {
        this.transactionRuleCreator = transactionRuleCreator;
        this.transactionRuleMatcher = transactionRuleMatcher;
        this.transactionCategoryBuilder = transactionCategoryBuilder;
        this.recurringTransactionCategoryRuleMatcher = recurringTransactionCategoryRuleMatcher;
        this.transactionDataLoader = transactionDataLoader;
        this.transactionLoader = transactionDataLoaderImpl;
        this.recurringTransactionLoader = recurringTransactionLoaderImpl;
    }

    public Boolean processTransactionsForUser(final List<Transaction> transactions, final List<RecurringTransaction> recurringTransactions, final Long userId)
    {
        log.info("Transaction Count before processing: {}", transactions.size());
        try
        {
            log.info("Starting transaction categorization for user {}", userId);

            // 1. Group transactions by priority level for efficient processing
            Map<Integer, List<Transaction>> regularTransactionsByPriority = transactionRuleMatcher.groupTransactionsByPriority(transactions);

            Map<Integer, List<RecurringTransaction>> recurringTransactionsByPriority =
                    recurringTransactionCategoryRuleMatcher.groupRecurringTransactionsByPriority(recurringTransactions);

            // 2. Process regular transactions using priority-based categorization
            Map<String, TransactionRule> categorizedRegularTransactions =
                    processCategorizedTransactionsByPriority(regularTransactionsByPriority);

            categorizedRegularTransactions.forEach((category, pair) -> {
                log.info("Categorized Regular Transaction: {} with {} transactions",
                        category, pair);
            });

            List<TransactionCategory> transactionCategories = createTransactionCategories(categorizedRegularTransactions);
            transactionCategories.forEach((transactionCategory -> {
                log.info("Converted Transaction Category: {}", transactionCategory);
            }));

            // 3. Process recurring transactions using priority-based categorization
            Map<String, Pair<RecurringTransactionRule, List<RecurringTransaction>>> categorizedRecurringTransactions =
                    recurringTransactionCategoryRuleMatcher.categorizeRecurringTransactions(recurringTransactions);

            // 4. Extract user and system rules from categorized transactions
            Map<String, UserCategoryRule> userCategorized = combineCategorizedTransactionUserRules(
                    extractUserRulesFromCategorizedTransactions(categorizedRegularTransactions, userId),
                    extractUserRulesFromCategorizedRecurringTransactions(categorizedRecurringTransactions, userId));

            Map<String, TransactionRule> systemCategorized = combineCategorizedTransactions(
                    extractSystemRulesFromCategorizedTransactions(categorizedRegularTransactions),
                    extractSystemRulesFromCategorizedRecurringTransactions(categorizedRecurringTransactions));


            // 5. Generate and save rules
            saveNewRules(userCategorized);

            // 6. Log summary
            generateSummary(userCategorized, systemCategorized);

            return true;
        } catch (Exception e) {
            log.error("There was an error processing transactions for user {}: ", userId, e);
            return false;
        }
    }

    /**
     * Process transactions by priority level and categorize them
     * @param transactionsByPriority Map of priority levels to transaction lists
     * @return Map of categories to their rules and matched transactions
     */
    private Map<String, TransactionRule> processCategorizedTransactionsByPriority(
            Map<Integer, List<Transaction>> transactionsByPriority) {

        Map<String, TransactionRule> categorizedTransactions = new HashMap<>();

        // Process transactions by priority group (highest to lowest)
        log.info("Priorities: {}", transactionsByPriority.keySet());
        List<Integer> priorityLevels = new ArrayList<>(transactionsByPriority.keySet());

        for (Integer priority : priorityLevels) {
            List<Transaction> transactionsInGroup = transactionsByPriority.get(priority);
            log.info("Processing {} transactions with priority {}", transactionsInGroup.size(), priority);

            // Categorize this group of transactions
            Map<String, TransactionRule> groupResult =
                    transactionRuleMatcher.categorizeTransactions(transactionsInGroup);

            // Merge results
            categorizedTransactions.putAll(groupResult);
        }

        return categorizedTransactions;
    }

    // Extract system rules from regular transactions
    private Map<String, TransactionRule> extractSystemRulesFromCategorizedTransactions(
            Map<String, TransactionRule> categorizedTransactions) {
        Map<String, TransactionRule> systemRules = new HashMap<>();

        for (Map.Entry<String, TransactionRule> entry : categorizedTransactions.entrySet()) {
            String transactionId = entry.getKey();
            TransactionRule rule = entry.getValue();

            // Check if rule was from system rules (priority would NOT be USER_DEFINED.getValue())
            if (rule.getPriority() != PriorityLevel.USER_DEFINED.getValue()) {
                // Convert to CategoryRule
                // Add to map with first transaction ID as key
                systemRules.put(transactionId, rule);
            }
        }

        return systemRules;
    }

    // Extract user rules from regular transactions
    private Map<String, UserCategoryRule> extractUserRulesFromCategorizedTransactions(
            Map<String, TransactionRule> categorizedTransactions, Long userId) {
        Map<String, UserCategoryRule> userRules = new HashMap<>();

        for (Map.Entry<String, TransactionRule> entry : categorizedTransactions.entrySet()) {
            String transactionId = entry.getKey();
            TransactionRule rule = entry.getValue();

            // Check if rule was from user rules (priority would be USER_DEFINED.getValue())
            if (rule.getPriority() == PriorityLevel.USER_DEFINED.getValue()) {
                // Convert to UserCategoryRule
                String category = rule.getMatchedCategory();
                UserCategoryRule userRule = convertToUserCategoryRule(rule, category, userId);
                userRules.put(transactionId, userRule);
            }
        }

        return userRules;
    }

    private Map<String, TransactionRule> extractSystemRulesFromCategorizedRecurringTransactions(
            Map<String, Pair<RecurringTransactionRule, List<RecurringTransaction>>> categorizedTransactions) {
        Map<String, TransactionRule> systemRules = new HashMap<>();

        for (Map.Entry<String, Pair<RecurringTransactionRule, List<RecurringTransaction>>> entry : categorizedTransactions.entrySet()) {
            String category = entry.getKey();
            RecurringTransactionRule rule = entry.getValue().getFirst();
            List<RecurringTransaction> transactions = entry.getValue().getSecond();

            // Check if rule was from system rules (priority would NOT be USER_DEFINED.getValue())
            if (rule.getPriority() != PriorityLevel.USER_DEFINED.getValue()) {
                // Convert to CategoryRule
                CategoryRule categoryRule = convertToCategoryRule(rule, category);

                // Add frequency information for recurring transactions
                if (rule.getFrequency() != null) {
                    categoryRule.setFrequency(rule.getFrequency());
                    categoryRule.setRecurring(true);
                }

                // Add to map with first transaction ID as key
                if (!transactions.isEmpty()) {
                    systemRules.put(transactions.get(0).getTransactionId(), rule);
                }
            }
        }

        return systemRules;
    }


    private Map<String, UserCategoryRule> extractUserRulesFromCategorizedRecurringTransactions(
            Map<String, RecurringTransactionRule> categorizedTransactions, Long userId) {
        Map<String, UserCategoryRule> userRules = new HashMap<>();

//        for (Map.Entry<String, RecurringTransactionRule> entry : categorizedTransactions.entrySet())
//        {
//            String category = entry.getKey();
//            RecurringTransactionRule rule = entry.getValue().getFirst();
//            List<RecurringTransaction> transactions = entry.getValue().getSecond();
//
//            // Check if rule was from user rules (priority would be USER_DEFINED.getValue())
//            if (rule.getPriority() == PriorityLevel.USER_DEFINED.getValue()) {
//                // Convert to UserCategoryRule
//                UserCategoryRule userRule = convertToUserCategoryRule(rule, category, userId);
//
//                // Add to map with first transaction ID as key
//                if (!transactions.isEmpty()) {
//                    userRules.put(transactions.get(0).getTransactionId(), userRule);
//                }
//            }
//        }
//        return userRules;
        return null;
    }

    public List<TransactionCategory> createTransactionCategories(final Map<String, TransactionRule> categorizedTransactions)
    {
        try
        {
            return transactionCategoryBuilder.createTransactionCategories(categorizedTransactions);
        }catch(Exception e)
        {
            log.error("There was an error creating the transaction categories: ", e);
            return Collections.emptyList();
        }
    }

    private UserCategoryRule convertToUserCategoryRule(TransactionRule rule, String category, Long userId)
    {
        return new UserCategoryRule(
                null, // New rule, no ID yet
                category,
                rule.getMerchantPattern(),
                rule.getDescriptionPattern(),
                "ONCE", // Default frequency
                TransactionType.DEBIT, // Default type
                false, // Not recurring by default
                rule.getPriority(),
                userId,
                LocalDateTime.now(),
                LocalDateTime.now(),
                TransactionMatchType.EXACT, // Default match type
                null, // No match by text
                true  // Active by default
        );
    }

    private CategoryRule convertToCategoryRule(TransactionRule rule, String category)
    {
        return CategoryRule.builder()
                .categoryName(category)
                .merchantPattern(rule.getMerchantPattern())
                .descriptionPattern(rule.getDescriptionPattern())
                .frequency("ONCE") // Default frequency
                .transactionType(TransactionType.DEBIT) // Default type
                .isRecurring(false) // Not recurring by default
                .priority(rule.getPriority())
                .build();
    }

    // Convert RecurringTransactionRule to CategoryRule
    private CategoryRule convertFromRecurringRule(RecurringTransactionRule rule, String category)
    {
        return CategoryRule.builder()
                .categoryName(category)
                .merchantPattern(rule.getMerchantPattern())
                .descriptionPattern(rule.getDescriptionPattern())
                .frequency(rule.getFrequency() != null ? rule.getFrequency() : "ONCE")
                .transactionType(TransactionType.DEBIT) // Default type
                .isRecurring(true) // Recurring by default for RecurringTransactionRule
                .priority(rule.getPriority())
                .build();
    }

//    public Boolean processTransactionsForUser(Long userId) {
//        try {
//            // 1. Load recent transactions
//            List<Transaction> transactions = loadTransactionsForUser(userId);
//            List<RecurringTransaction> recurringTransactions = loadRecurringTransactionsForUser(userId);
//
//            // 2. Apply user rules first
//            Map<String, UserCategoryRule> userCategorized = combineCategorizedTransactionUserRules(
//                    getCategorizedTransactionsWithUserRules(transactions, userId),
//                    getCategorizedRecurringTransactionsWithUserRules(recurringTransactions, userId));
//
//            Map<String, CategoryRule> systemCategorized = combineCategorizedTransactions(
//                    getCategorizedTransactionsWithSystemRules(transactions),
//                    getCategorizedRecurringTransactionsWithSystemRules(recurringTransactions));
//
//            // 4. Generate and save rules
//            saveNewRules(userCategorized, systemCategorized);
//
//            // 5. Log summary
//            generateSummary(userCategorized, systemCategorized);
//
//            return true;
//        } catch (Exception e) {
//            log.error("Error processing transactions for user {}", userId, e);
//            return false;
//        }
//    }

    private Map<String, TransactionRule> combineCategorizedTransactions(final Map<String, TransactionRule> categorizedTransactionSystemRules, final Map<String, TransactionRule> categorizedRecurringTransactionSystemRules) {
        Map<String, TransactionRule> combinedCategoryRules = new HashMap<>(categorizedTransactionSystemRules);
        combinedCategoryRules.putAll(categorizedRecurringTransactionSystemRules);
        // Add the category rules
        return combinedCategoryRules;
    }

    private Map<String, UserCategoryRule> combineCategorizedTransactionUserRules(final Map<String, UserCategoryRule> categorizedRecurringTransactionsUserRules, final Map<String, UserCategoryRule> categorizedTransactionUserRules){
        Map<String, UserCategoryRule> combinedUserCategoryRules = new HashMap<>(categorizedRecurringTransactionsUserRules);
        combinedUserCategoryRules.putAll(categorizedTransactionUserRules);
        return combinedUserCategoryRules;
    }

    private List<Transaction> loadTransactionsForUser(Long userId)
    {
        LocalDate startDate = LocalDate.now().minusMonths(1);
        LocalDate endDate = LocalDate.now();
        try
        {
            return transactionDataLoader.loadTransactionsByUserDateRange(
                    userId, startDate, endDate);

        }catch(DataAccessException e)
        {
            log.error("Error loading transactions for user {}", userId, e);
            return Collections.emptyList();
        }
    }

    private List<RecurringTransaction> loadRecurringTransactionsForUser(Long userId)
    {
        LocalDate startDate = LocalDate.now().minusMonths(1);
        LocalDate endDate = LocalDate.now();
        try
        {
            return transactionDataLoader.loadRecurringTransactionsByUserDateRange(
                    userId, startDate, endDate
            );
        }catch(DataAccessException ex){
            log.error("Error loading recurring transactions for user {}", userId, ex);
            return Collections.emptyList();
        }

    }

//    public Map<String, CategoryRule> getCategorizedTransactionsWithSystemRules(List<Transaction> transactions){
//        if(transactions == null || transactions.isEmpty()){
//            return Collections.emptyMap();
//        }
//        List<TransactionRule> transactionRulesWithSystemRules = transactionCategorizer.categorizeTransactionsBySystemRules(transactions);
//
//        Map<String, Map<String, List<TransactionRule>>> groupedRules = categoryRuleCreator.groupTransactionRulesWithLogging(transactionRulesWithSystemRules);
//        Set<CategoryRule> consolidatedRule = categoryRuleCreator.convertGroupedRulesToCategoryRules(groupedRules, CategoryRule.class, null);
//
//        for(TransactionRule transactionRule : transactionRulesWithSystemRules){
//            CategoryRule matchingRule = findMatchingCategoryRule(transactionRule, consolidatedRule);
//            if(matchingRule != null){
//                categorizedTransactionSystemRules.put(transactionRule.getTransactionId(), matchingRule);
//            }
//        }
//        return categorizedTransactionSystemRules;
//    }

    private CategoryRule findMatchingCategoryRule(TransactionRule transactionRule,
                                                  Set<CategoryRule> categoryRules) {
        return categoryRules.stream()
                .filter(cr -> cr.getCategoryName().equals(transactionRule.getMatchedCategory())
                        && cr.getMerchantPattern().equals(transactionRule.getMerchantPattern()))
                .findFirst()
                .orElse(null);
    }

    private UserCategoryRule findMatchingUserCategoryRule(
            TransactionRule transactionRule,
            Set<UserCategoryRule> userCategoryRules) {
        return userCategoryRules.stream()
                .filter(ucr -> ucr.getCategoryName().equals(transactionRule.getMatchedCategory())
                        && ucr.getMerchantPattern().equals(transactionRule.getMerchantPattern()))
                .findFirst()
                .orElse(null);
    }

    private List<Transaction> filterTransactionsByDateRange(List<? extends Transaction> transactions, DateRange dateRange) {
        return transactions.stream()
                .filter(transaction -> dateRange.containsDate(transaction.getDate()))
                .collect(Collectors.toList());
    }

    private List<RecurringTransaction> filterRecurringTransactionsByDateRange(List<RecurringTransaction> recurringTransactions, DateRange dateRange) {
        return recurringTransactions.stream()
                .filter(transaction -> dateRange.containsDate(transaction.getDate()))
                .collect(Collectors.toList());
    }

    private void processCategorizedTransactions(
            Map<String, List<String>> categorizedTransactions,
            Map<String, ? extends CategoryRule> userCategorizedRules,
            Map<String, ? extends CategoryRule> systemCategorizedRules
    ) {
        // Add user-defined categorized transactions
        userCategorizedRules.forEach((transactionId, rule) ->
                categorizedTransactions.computeIfAbsent(rule.getCategoryName(), key -> new ArrayList<>()).add(transactionId));

        // Add system-defined categorized transactions, only if not already categorized
        systemCategorizedRules.forEach((transactionId, rule) ->
                categorizedTransactions.computeIfAbsent(rule.getCategoryName(), key -> new ArrayList<>()).add(transactionId));
    }


    private void saveNewRules(final Map<String, UserCategoryRule> userCategorized)
    {

        try
        {
            // Save the User Categorized Rules
            transactionRuleCreator.saveUserDefinedRules(userCategorized);

        }catch(DataException ex){
            log.error("Unable to save Category Rules: ", ex);
        }

    }

    private void generateSummary(Map<String, UserCategoryRule> userCategorized,
                                 Map<String, TransactionRule> systemCategorized) {
        log.info("Categorization Summary:");
        log.info("Original User Rules: {}", userCategorized.size());
        log.info("Original System Rules: {}", systemCategorized.size());
        log.info("Total Original Rules: {}", userCategorized.size() + systemCategorized.size());

        // Count unique consolidated rules
        long uniqueUserRules = userCategorized.values().stream()
                .distinct()
                .count();
        long uniqueSystemRules = systemCategorized.values().stream()
                .distinct()
                .count();

        log.info("Consolidated User Rules: {}", uniqueUserRules);
        log.info("Consolidated System Rules: {}", uniqueSystemRules);
        log.info("Total Consolidated Rules: {}", uniqueUserRules + uniqueSystemRules);
    }

    public static void main(String[] args) {
        // Initialize Spring Application Context
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
        context.scan("com.app.budgetbuddy"); // Adjust to your package structure
        context.refresh();

        // Retrieve the CategoryRuleEngine bean
        CategoryRuleEngine categoryRuleEngine = context.getBean(CategoryRuleEngine.class);
        TransactionDataLoaderImpl transactionDataLoader = context.getBean(TransactionDataLoaderImpl.class);
        RecurringTransactionLoaderImpl recurringTransactionLoader = context.getBean(RecurringTransactionLoaderImpl.class);

        // Set up date range for test data (last 3 months)
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusMonths(3);
        Long userId = 1L;

        System.out.println("Loading transactions for user " + userId + " from " + startDate + " to " + endDate);

        try {
            // Load transactions directly from the database
            List<Transaction> transactions = transactionDataLoader.loadTransactionsByDateRange(userId, startDate, endDate);
            List<RecurringTransaction> recurringTransactions = recurringTransactionLoader.loadTransactionsByDateRange(userId, startDate, endDate);

            System.out.println("Loaded " + transactions.size() + " regular transactions");
            System.out.println("Loaded " + recurringTransactions.size() + " recurring transactions");

            // Create sample user category rules
            List<UserCategoryRule> userCategoryRules = createSampleUserRules(userId);

            // Process transactions
            System.out.println("Beginning categorization process...");
            long startTime = System.currentTimeMillis();

//            // Add user rules to categorizer
//            categoryRuleEngine.categoryRuleCreator.addUserCategoryRules(userCategoryRules);
//            categoryRuleEngine.categoryRuleCreator.addUserCategoryRulesRecurring(userCategoryRules);

            // Process transactions using priority-based categorization
            boolean success = categoryRuleEngine.processTransactionsForUser(transactions, recurringTransactions, userId);

            long endTime = System.currentTimeMillis();
            long duration = endTime - startTime;

            // Print results
            System.out.println("Processing completed in " + duration + "ms: " + (success ? "Success" : "Failed"));

            // Print categorization summary
            printCategorizationSummary(categoryRuleEngine);

        } catch (Exception e) {
            System.err.println("Error during processing: " + e.getMessage());
            e.printStackTrace();
        }

        // Close the context
        context.close();
    }

    private static List<UserCategoryRule> createSampleUserRules(Long userId) {
        // Create more comprehensive set of user rules for common transaction types
        return List.of(
                // Grocery rules
                new UserCategoryRule(
                        "grocery_rule",
                        "GROCERIES",
                        "WINCO|SMITHS|WALMART|KROGER|TRADER JOE|WHOLE FOODS|ALBERTSONS",
                        ".*FOODS.*|.*GROCERY.*|.*MARKET.*",
                        "WEEKLY",
                        TransactionType.DEBIT,
                        false,
                        PriorityLevel.USER_DEFINED.getValue(),
                        userId,
                        LocalDateTime.now(),
                        LocalDateTime.now(),
                        TransactionMatchType.PARTIAL,
                        "GROCERY",
                        true
                ),

                // Utilities rules
                new UserCategoryRule(
                        "utility_rule",
                        "UTILITIES",
                        "ROCKY MOUNTAIN POWER|PACIFIC POWER|CONSERVICE|WATER|GAS|ELECTRIC|XCEL|DOMINION",
                        ".*POWER.*|.*UTILITY.*|.*ELECTRIC.*|.*GAS.*|.*WATER.*",
                        "MONTHLY",
                        TransactionType.DEBIT,
                        true,
                        PriorityLevel.USER_DEFINED.getValue(),
                        userId,
                        LocalDateTime.now(),
                        LocalDateTime.now(),
                        TransactionMatchType.PARTIAL,
                        "UTILITY",
                        true
                ),

                // Subscription rules
                new UserCategoryRule(
                        "subscription_rule",
                        "SUBSCRIPTION",
                        "NETFLIX|HULU|DISNEY|SPOTIFY|AMAZON PRIME|YOUTUBE|CLAUDE.AI",
                        ".*SUBSCRIPTION.*|.*MONTHLY.*|.*MEMBERSHIP.*",
                        "MONTHLY",
                        TransactionType.DEBIT,
                        true,
                        PriorityLevel.USER_DEFINED.getValue(),
                        userId,
                        LocalDateTime.now(),
                        LocalDateTime.now(),
                        TransactionMatchType.PARTIAL,
                        "SUBSCRIPTION",
                        true
                ),

                // Rent/Mortgage rules
                new UserCategoryRule(
                        "housing_rule",
                        "RENT",
                        "FLEX FINANCE|APARTMENT|PROPERTY|MORTGAGE|PMT",
                        ".*RENT.*|.*LEASE.*|.*MORTGAGE.*",
                        "MONTHLY",
                        TransactionType.DEBIT,
                        true,
                        PriorityLevel.USER_DEFINED.getValue(),
                        userId,
                        LocalDateTime.now(),
                        LocalDateTime.now(),
                        TransactionMatchType.PARTIAL,
                        "HOUSING",
                        true
                )
        );
    }

    private static void printCategorizationSummary(CategoryRuleEngine engine) {
        // Access and print categorization results
        System.out.println("\nCATEGORIZATION SUMMARY");
        System.out.println("======================");

        // Print regular transaction categorization stats
        Map<String, Integer> regularStats = engine.getRegularTransactionCategoryStats();
        System.out.println("\nRegular Transaction Categories:");
        regularStats.forEach((category, count) ->
                System.out.println(String.format("%-20s: %d", category, count)));

        // Print recurring transaction categorization stats
        Map<String, Integer> recurringStats = engine.getRecurringTransactionCategoryStats();
        System.out.println("\nRecurring Transaction Categories:");
        recurringStats.forEach((category, count) ->
                System.out.println(String.format("%-20s: %d", category, count)));

        // Print rule generation stats
        System.out.println("\nGenerated Rules:");
        System.out.println("User Rules: " + engine.getUserRuleCount());
        System.out.println("System Rules: " + engine.getSystemRuleCount());
    }

    public Map<String, Integer> getRegularTransactionCategoryStats() {
        return summarizeCategoriesByCount(categorizedTransactionSystemRules, categorizedTransactionsUserRules);
    }

    public Map<String, Integer> getRecurringTransactionCategoryStats() {
        return summarizeCategoriesByCount(categorizedRecurringTransactionSystemRules, categorizedRecurringTransactionsUserRules);
    }

    public int getUserRuleCount() {
        return categorizedTransactionsUserRules.size() + categorizedRecurringTransactionsUserRules.size();
    }

    public int getSystemRuleCount() {
        return categorizedTransactionSystemRules.size() + categorizedRecurringTransactionSystemRules.size();
    }

    private Map<String, Integer> summarizeCategoriesByCount(
            Map<String, ? extends CategoryRule> systemRules,
            Map<String, ? extends CategoryRule> userRules) {

        Map<String, Integer> categoryCounts = new HashMap<>();

        // Count system rules by category
        systemRules.values().forEach(rule ->
                categoryCounts.compute(rule.getCategoryName(), (k, v) -> (v == null) ? 1 : v + 1));

        // Count user rules by category
        userRules.values().forEach(rule ->
                categoryCounts.compute(rule.getCategoryName(), (k, v) -> (v == null) ? 1 : v + 1));

        return categoryCounts;
    }


}
