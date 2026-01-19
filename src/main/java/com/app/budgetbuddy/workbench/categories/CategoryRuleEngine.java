//package com.app.budgetbuddy.workbench.categories;
//
//import com.app.budgetbuddy.domain.*;
//import com.app.budgetbuddy.workbench.RecurringTransactionLoaderImpl;
//import com.app.budgetbuddy.workbench.TransactionDataLoaderImpl;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.context.annotation.AnnotationConfigApplicationContext;
//import org.springframework.stereotype.Service;
//
//import java.time.LocalDate;
//import java.time.LocalDateTime;
//import java.util.*;
//
//@Service
//@Slf4j
//public class CategoryRuleEngine
//{
////    private final TransactionRuleMatcher transactionRuleMatcher;
//    private final TransactionCategoryBuilder transactionCategoryBuilder;
//    private final RecurringTransactionCategoryRuleMatcher recurringTransactionCategoryRuleMatcher;
//    private Map<String, CategoryRule> categorizedTransactionSystemRules = new HashMap<>();
//    private Map<String, UserCategoryRule> categorizedTransactionsUserRules = new HashMap<>();
//    private Map<String, CategoryRule> categorizedRecurringTransactionSystemRules = new HashMap<>();
//    private Map<String, UserCategoryRule> categorizedRecurringTransactionsUserRules = new HashMap<>();
//
//    @Autowired
//    public CategoryRuleEngine(TransactionRuleMatcher transactionRuleMatcher,
//                              TransactionCategoryBuilder transactionCategoryBuilder,
//                              RecurringTransactionCategoryRuleMatcher recurringTransactionCategoryRuleMatcher)
//    {
//        this.transactionRuleMatcher = transactionRuleMatcher;
//        this.transactionCategoryBuilder = transactionCategoryBuilder;
//        this.recurringTransactionCategoryRuleMatcher = recurringTransactionCategoryRuleMatcher;
//    }
//
//    public List<TransactionCategory> categorizeTransactions(final List<Transaction> transactions)
//    {
//        if(transactions == null || transactions.isEmpty())
//        {
//            return Collections.emptyList();
//        }
//        try
//        {
//            Map<String, TransactionRule> categorizedTransactions = transactionRuleMatcher.categorizeTransactions(transactions);
//            return createTransactionCategories(categorizedTransactions);
//        }catch(Exception e){
//            log.error("There was an error categorizing transactions", e);
//            return Collections.emptyList();
//        }
//    }
//
//    public List<TransactionCategory> categorizeRecurringTransactions(final List<RecurringTransaction> recurringTransactions)
//    {
//        if(recurringTransactions == null || recurringTransactions.isEmpty())
//        {
//            return Collections.emptyList();
//        }
//        try
//        {
//            Map<String, RecurringTransactionRule> categorizedRecurringTransactions = recurringTransactionCategoryRuleMatcher.categorizeRecurringTransactions(recurringTransactions);
//            return createTransactionCategories(categorizedRecurringTransactions);
//        }catch(Exception e){
//            log.error("There was an error categorizing recurring transactions", e);
//            return Collections.emptyList();
//        }
//    }
//
//    public List<TransactionCategory> createTransactionCategories(final Map<String, ? extends TransactionRule> categorizedTransactions)
//    {
//        if(categorizedTransactions == null || categorizedTransactions.isEmpty())
//        {
//            return Collections.emptyList();
//        }
//        try
//        {
//            return transactionCategoryBuilder.createTransactionCategories(categorizedTransactions);
//        }catch(Exception e)
//        {
//            log.error("There was an error creating the transaction categories: ", e);
//            return Collections.emptyList();
//        }
//    }
//
//    public static void main(String[] args) {
//        // Initialize Spring Application Context
//        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
//        context.scan("com.app.budgetbuddy"); // Adjust to your package structure
//        context.refresh();
//
//        // Retrieve the CategoryRuleEngine bean
//        CategoryRuleEngine categoryRuleEngine = context.getBean(CategoryRuleEngine.class);
//        TransactionDataLoaderImpl transactionDataLoader = context.getBean(TransactionDataLoaderImpl.class);
//        RecurringTransactionLoaderImpl recurringTransactionLoader = context.getBean(RecurringTransactionLoaderImpl.class);
//
//        // Set up date range for test data (last 3 months)
//        LocalDate endDate = LocalDate.of(2025, 1, 31);
//        LocalDate startDate = LocalDate.of(2025, 1, 1);
//        Long userId = 1L;
//
//        System.out.println("Loading transactions for user " + userId + " from " + startDate + " to " + endDate);
//
//        try {
//            // Load transactions directly from the database
//            List<Transaction> transactions = transactionDataLoader.loadTransactionsByDateRange(userId, startDate, endDate);
//            List<RecurringTransaction> recurringTransactions = recurringTransactionLoader.loadTransactionsByDateRange(userId, startDate, endDate);
//
//            System.out.println("Loaded " + transactions.size() + " regular transactions");
//            System.out.println("Loaded " + recurringTransactions.size() + " recurring transactions");
//
//            // Create sample user category rules
//            List<UserCategoryRule> userCategoryRules = createSampleUserRules(userId);
//
//            // Process transactions
//            System.out.println("Beginning categorization process...");
//            long startTime = System.currentTimeMillis();
//
//            // Process regular transactions
//            List<TransactionCategory> categorizedTransactions = categoryRuleEngine.categorizeTransactions(transactions);
//
//            // Process recurring transactions
//            List<TransactionCategory> categorizedRecurringTransactions = categoryRuleEngine.categorizeRecurringTransactions(recurringTransactions);
//
//            long endTime = System.currentTimeMillis();
//            long duration = endTime - startTime;
//
//            boolean success = !categorizedTransactions.isEmpty() || !categorizedRecurringTransactions.isEmpty();
//
//            // Print results
//            System.out.println("Processing completed in " + duration + "ms: " + (success ? "Success" : "Failed"));
//            System.out.println("Categorized " + categorizedTransactions.size() + " regular transactions");
//            System.out.println("Categorized " + categorizedRecurringTransactions.size() + " recurring transactions");
//
//            // Print categorization summary
//            printCategorizationSummary(categoryRuleEngine);
//
//        } catch (Exception e) {
//            System.err.println("Error during processing: " + e.getMessage());
//            e.printStackTrace();
//        }
//
//        // Close the context
//        context.close();
//    }
//
//    private static List<UserCategoryRule> createSampleUserRules(Long userId) {
//        // Create more comprehensive set of user rules for common transaction types
//        return List.of(
//                // Grocery rules
//                new UserCategoryRule(
//                        "grocery_rule",
//                        "GROCERIES",
//                        "WINCO|SMITHS|WALMART|KROGER|TRADER JOE|WHOLE FOODS|ALBERTSONS",
//                        ".*FOODS.*|.*GROCERY.*|.*MARKET.*",
//                        "WEEKLY",
//                        TransactionType.DEBIT,
//                        false,
//                        PriorityLevel.USER_DEFINED.getValue(),
//                        userId,
//                        LocalDateTime.now(),
//                        LocalDateTime.now(),
//                        TransactionMatchType.PARTIAL,
//                        "GROCERY",
//                        true
//                ),
//
//                // Utilities rules
//                new UserCategoryRule(
//                        "utility_rule",
//                        "UTILITIES",
//                        "ROCKY MOUNTAIN POWER|PACIFIC POWER|CONSERVICE|WATER|GAS|ELECTRIC|XCEL|DOMINION",
//                        ".*POWER.*|.*UTILITY.*|.*ELECTRIC.*|.*GAS.*|.*WATER.*",
//                        "MONTHLY",
//                        TransactionType.DEBIT,
//                        true,
//                        PriorityLevel.USER_DEFINED.getValue(),
//                        userId,
//                        LocalDateTime.now(),
//                        LocalDateTime.now(),
//                        TransactionMatchType.PARTIAL,
//                        "UTILITY",
//                        true
//                ),
//
//                // Subscription rules
//                new UserCategoryRule(
//                        "subscription_rule",
//                        "SUBSCRIPTION",
//                        "NETFLIX|HULU|DISNEY|SPOTIFY|AMAZON PRIME|YOUTUBE|CLAUDE.AI",
//                        ".*SUBSCRIPTION.*|.*MONTHLY.*|.*MEMBERSHIP.*",
//                        "MONTHLY",
//                        TransactionType.DEBIT,
//                        true,
//                        PriorityLevel.USER_DEFINED.getValue(),
//                        userId,
//                        LocalDateTime.now(),
//                        LocalDateTime.now(),
//                        TransactionMatchType.PARTIAL,
//                        "SUBSCRIPTION",
//                        true
//                ),
//
//                // Rent/Mortgage rules
//                new UserCategoryRule(
//                        "housing_rule",
//                        "RENT",
//                        "FLEX FINANCE|APARTMENT|PROPERTY|MORTGAGE|PMT",
//                        ".*RENT.*|.*LEASE.*|.*MORTGAGE.*",
//                        "MONTHLY",
//                        TransactionType.DEBIT,
//                        true,
//                        PriorityLevel.USER_DEFINED.getValue(),
//                        userId,
//                        LocalDateTime.now(),
//                        LocalDateTime.now(),
//                        TransactionMatchType.PARTIAL,
//                        "HOUSING",
//                        true
//                )
//        );
//    }
//
//    private static void printCategorizationSummary(CategoryRuleEngine engine) {
//        // Access and print categorization results
//        System.out.println("\nCATEGORIZATION SUMMARY");
//        System.out.println("======================");
//
//        // Print regular transaction categorization stats
//        Map<String, Integer> regularStats = engine.getRegularTransactionCategoryStats();
//        System.out.println("\nRegular Transaction Categories:");
//        regularStats.forEach((category, count) ->
//                System.out.println(String.format("%-20s: %d", category, count)));
//
//        // Print recurring transaction categorization stats
//        Map<String, Integer> recurringStats = engine.getRecurringTransactionCategoryStats();
//        System.out.println("\nRecurring Transaction Categories:");
//        recurringStats.forEach((category, count) ->
//                System.out.println(String.format("%-20s: %d", category, count)));
//
//        // Print rule generation stats
//        System.out.println("\nGenerated Rules:");
//        System.out.println("User Rules: " + engine.getUserRuleCount());
//        System.out.println("System Rules: " + engine.getSystemRuleCount());
//    }
//
//    public Map<String, Integer> getRegularTransactionCategoryStats() {
//        return summarizeCategoriesByCount(categorizedTransactionSystemRules, categorizedTransactionsUserRules);
//    }
//
//    public Map<String, Integer> getRecurringTransactionCategoryStats() {
//        return summarizeCategoriesByCount(categorizedRecurringTransactionSystemRules, categorizedRecurringTransactionsUserRules);
//    }
//
//    public int getUserRuleCount() {
//        return categorizedTransactionsUserRules.size() + categorizedRecurringTransactionsUserRules.size();
//    }
//
//    public int getSystemRuleCount() {
//        return categorizedTransactionSystemRules.size() + categorizedRecurringTransactionSystemRules.size();
//    }
//
//    private Map<String, Integer> summarizeCategoriesByCount(
//            Map<String, ? extends CategoryRule> systemRules,
//            Map<String, ? extends CategoryRule> userRules) {
//
//        Map<String, Integer> categoryCounts = new HashMap<>();
//
//        // Count system rules by category
//        systemRules.values().forEach(rule ->
//                categoryCounts.compute(rule.getCategoryName(), (k, v) -> (v == null) ? 1 : v + 1));
//
//        // Count user rules by category
//        userRules.values().forEach(rule ->
//                categoryCounts.compute(rule.getCategoryName(), (k, v) -> (v == null) ? 1 : v + 1));
//
//        return categoryCounts;
//    }
//
//
//}
