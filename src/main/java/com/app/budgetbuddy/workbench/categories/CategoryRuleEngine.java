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
    private Map<String, CategoryRule> categorizedTransactionSystemRules = new HashMap<>();
    private Map<String, UserCategoryRule> categorizedTransactionsUserRules = new HashMap<>();
    private Map<String, CategoryRule> categorizedRecurringTransactionSystemRules = new HashMap<>();
    private Map<String, UserCategoryRule> categorizedRecurringTransactionsUserRules = new HashMap<>();

    @Autowired
    public CategoryRuleEngine(TransactionRuleCreator transactionRuleCreator,
                              TransactionRuleMatcher transactionRuleMatcher,
                              TransactionCategoryBuilder transactionCategoryBuilder,
                              RecurringTransactionCategoryRuleMatcher recurringTransactionCategoryRuleMatcher)
    {
        this.transactionRuleCreator = transactionRuleCreator;
        this.transactionRuleMatcher = transactionRuleMatcher;
        this.transactionCategoryBuilder = transactionCategoryBuilder;
        this.recurringTransactionCategoryRuleMatcher = recurringTransactionCategoryRuleMatcher;
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
            Map<String, RecurringTransactionRule> categorizedRecurringTransactions =
                    recurringTransactionCategoryRuleMatcher.categorizeRecurringTransactions(recurringTransactions);

            // 4. Extract user and system rules from categorized transactions
            Map<String, TransactionRule> userCategorized = combineCategorizedTransactionUserRules(
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
    private Map<String, TransactionRule> extractUserRulesFromCategorizedTransactions(
            Map<String, TransactionRule> categorizedTransactions, Long userId) {
        Map<String, TransactionRule> userRules = new HashMap<>();

        for (Map.Entry<String, TransactionRule> entry : categorizedTransactions.entrySet()) {
            String transactionId = entry.getKey();
            TransactionRule rule = entry.getValue();
            // Check if rule was from user rules (priority would be USER_DEFINED.getValue())
            if (rule.getPriority() == PriorityLevel.USER_DEFINED.getValue()) {
                // Convert to UserCategoryRule
                userRules.put(transactionId, rule);
            }
        }

        return userRules;
    }

    private Map<String, TransactionRule> extractSystemRulesFromCategorizedRecurringTransactions(
            Map<String, RecurringTransactionRule> categorizedTransactions) {
        Map<String, TransactionRule> systemRules = new HashMap<>();

        for (Map.Entry<String, RecurringTransactionRule> entry : categorizedTransactions.entrySet()) {
            String transactionId = entry.getKey();
            RecurringTransactionRule rule = entry.getValue();

            // Check if rule was from system rules (priority would NOT be USER_DEFINED.getValue())
            if (rule.getPriority() != PriorityLevel.USER_DEFINED.getValue()) {

                // Add frequency information for recurring transactions
                if (rule.getFrequency() != null) {
                    rule.setFrequency(rule.getFrequency());
                    rule.setRecurring(true);
                }
            }
        }

        return systemRules;
    }


    private Map<String, RecurringTransactionRule> extractUserRulesFromCategorizedRecurringTransactions(
            Map<String, RecurringTransactionRule> categorizedTransactions, Long userId) {
        Map<String, RecurringTransactionRule> userRules = new HashMap<>();

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
        return userRules;
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


    private Map<String, TransactionRule> combineCategorizedTransactions(final Map<String, TransactionRule> categorizedTransactionSystemRules, final Map<String, TransactionRule> categorizedRecurringTransactionSystemRules) {
        Map<String, TransactionRule> combinedCategoryRules = new HashMap<>(categorizedTransactionSystemRules);
        combinedCategoryRules.putAll(categorizedRecurringTransactionSystemRules);
        // Add the category rules
        return combinedCategoryRules;
    }

    private Map<String, TransactionRule> combineCategorizedTransactionUserRules(final Map<String, TransactionRule> categorizedRecurringTransactionsUserRules, final Map<String, RecurringTransactionRule> categorizedTransactionUserRules){
        Map<String, TransactionRule> combinedUserCategoryRules = new HashMap<>(categorizedRecurringTransactionsUserRules);
        combinedUserCategoryRules.putAll(categorizedTransactionUserRules);
        return combinedUserCategoryRules;
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


    private void saveNewRules(final Map<String, TransactionRule> userCategorized)
    {

        try
        {
            // Save the User Categorized Rules
            transactionRuleCreator.saveUserDefinedRules(userCategorized);

        }catch(DataException ex){
            log.error("Unable to save Category Rules: ", ex);
        }

    }

    private void generateSummary(Map<String, TransactionRule> userCategorized,
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
