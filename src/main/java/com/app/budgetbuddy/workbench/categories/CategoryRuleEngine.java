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
    private final CategoryRuleCreator categoryRuleCreator;
    private final TransactionCategorizer transactionCategorizer;
    private final TransactionLoaderService transactionDataLoader;

    private static TransactionDataLoaderImpl transactionLoader;
    private static RecurringTransactionLoaderImpl recurringTransactionLoader;
    private Map<String, CategoryRule> categorizedTransactionSystemRules = new HashMap<>();
    private Map<String, UserCategoryRule> categorizedTransactionsUserRules = new HashMap<>();
    private Map<String, CategoryRule> categorizedRecurringTransactionSystemRules = new HashMap<>();
    private Map<String, UserCategoryRule> categorizedRecurringTransactionsUserRules = new HashMap<>();

    @Autowired
    public CategoryRuleEngine(CategoryRuleCreator categoryRuleCreator,
                              TransactionCategorizer transactionCategorizer,
                              TransactionLoaderService transactionDataLoader,
                              TransactionDataLoaderImpl transactionDataLoaderImpl,
                              RecurringTransactionLoaderImpl recurringTransactionLoaderImpl)
    {
        this.categoryRuleCreator = categoryRuleCreator;
        this.transactionCategorizer = transactionCategorizer;
        this.transactionDataLoader = transactionDataLoader;
        this.transactionLoader = transactionDataLoaderImpl;
        this.recurringTransactionLoader = recurringTransactionLoaderImpl;
    }

    public static List<Transaction> loadTransactions(){
        return transactionLoader.loadTransactionsByDateRange(1L, LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 30));
    }

    public static List<RecurringTransaction> loadRecurringTransactions(){
        return recurringTransactionLoader.loadTransactionsByDateRange(1L, LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 30));
    }

    public Boolean processTransactionsForUser(List<Transaction> transactions, List<RecurringTransaction> recurringTransactions, Long userId){
        try{
            // 2. Apply user rules first
            Map<String, UserCategoryRule> userCategorized = combineCategorizedTransactionUserRules(
                    getCategorizedTransactionsWithUserRules(transactions, userId),
                    getCategorizedRecurringTransactionsWithUserRules(recurringTransactions, userId));

            Map<String, CategoryRule> systemCategorized = combineCategorizedTransactions(
                    getCategorizedTransactionsWithSystemRules(transactions),
                    getCategorizedRecurringTransactionsWithSystemRules(recurringTransactions));

            // 4. Generate and save rules
            saveNewRules(userCategorized, systemCategorized);

            // 5. Log summary
            generateSummary(userCategorized, systemCategorized);

            return true;
        }catch(Exception e){
            log.error("There was an error processing transactions for user: ", e);
            return false;
        }
    }

    public Boolean processTransactionsForUser(Long userId) {
        try {
            // 1. Load recent transactions
            List<Transaction> transactions = loadTransactionsForUser(userId);
            List<RecurringTransaction> recurringTransactions = loadRecurringTransactionsForUser(userId);

            // 2. Apply user rules first
            Map<String, UserCategoryRule> userCategorized = combineCategorizedTransactionUserRules(
                    getCategorizedTransactionsWithUserRules(transactions, userId),
                    getCategorizedRecurringTransactionsWithUserRules(recurringTransactions, userId));

            Map<String, CategoryRule> systemCategorized = combineCategorizedTransactions(
                    getCategorizedTransactionsWithSystemRules(transactions),
                    getCategorizedRecurringTransactionsWithSystemRules(recurringTransactions));

            // 4. Generate and save rules
            saveNewRules(userCategorized, systemCategorized);

            // 5. Log summary
            generateSummary(userCategorized, systemCategorized);

            return true;
        } catch (Exception e) {
            log.error("Error processing transactions for user {}", userId, e);
            return false;
        }
    }

    private Map<String, CategoryRule> combineCategorizedTransactions(final Map<String, CategoryRule> categorizedTransactionSystemRules, final Map<String, CategoryRule> categorizedRecurringTransactionSystemRules) {
        Map<String, CategoryRule> combinedCategoryRules = new HashMap<>(categorizedTransactionSystemRules);
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

    public Map<String, CategoryRule> getCategorizedTransactionsWithSystemRules(List<Transaction> transactions){
        if(transactions == null || transactions.isEmpty()){
            return Collections.emptyMap();
        }
        List<TransactionRule> transactionRulesWithSystemRules = transactionCategorizer.categorizeTransactionsBySystemRules(transactions);

        Map<String, Map<String, List<TransactionRule>>> groupedRules = categoryRuleCreator.groupTransactionRulesWithLogging(transactionRulesWithSystemRules);
        Set<CategoryRule> consolidatedRule = categoryRuleCreator.convertGroupedRulesToCategoryRules(groupedRules, CategoryRule.class, null);

        for(TransactionRule transactionRule : transactionRulesWithSystemRules){
            CategoryRule matchingRule = findMatchingCategoryRule(transactionRule, consolidatedRule);
            if(matchingRule != null){
                categorizedTransactionSystemRules.put(transactionRule.getTransactionId(), matchingRule);
            }
        }
        return categorizedTransactionSystemRules;
    }

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

    public Map<String, UserCategoryRule> getCategorizedTransactionsWithUserRules(List<Transaction> transactions, Long userId){
        if(transactions == null || transactions.isEmpty()){
            return Collections.emptyMap();
        }
        List<TransactionRule> transactionRulesWithUserRules = transactionCategorizer.categorizeTransactionByUserRules(transactions, userId);

        Map<String, Map<String, List<TransactionRule>>> groupedRules = categoryRuleCreator.groupTransactionRulesWithLogging(transactionRulesWithUserRules);

        Set<UserCategoryRule> consolidatedRules = categoryRuleCreator.convertGroupedRulesToCategoryRules(groupedRules, UserCategoryRule.class, userId);

        for(TransactionRule transactionRule : transactionRulesWithUserRules){
            UserCategoryRule matchingRule = findMatchingUserCategoryRule(
                    transactionRule,
                    consolidatedRules
            );
            if (matchingRule != null) {
                categorizedTransactionsUserRules.put(
                        transactionRule.getTransactionId(),
                        matchingRule
                );
            }
        }
        return categorizedTransactionsUserRules;
    }

    public Map<String, CategoryRule> getCategorizedRecurringTransactionsWithSystemRules(List<RecurringTransaction> transactions){
        if(transactions == null || transactions.isEmpty()){
            return Collections.emptyMap();
        }
        List<RecurringTransactionRule> recurringTransactionRules = transactionCategorizer.categorizeRecurringTransactionsBySystemRules(transactions);
        Set<CategoryRule> categoryRules = categoryRuleCreator.createSystemRules(recurringTransactionRules);
        for(RecurringTransactionRule transactionRule : recurringTransactionRules){
            for(CategoryRule categoryRule : categoryRules){
                categorizedRecurringTransactionSystemRules.putIfAbsent(transactionRule.getTransactionId(), categoryRule);
                break;
            }
        }
        return categorizedRecurringTransactionSystemRules;
    }

    public Map<String, UserCategoryRule> getCategorizedRecurringTransactionsWithUserRules(final List<RecurringTransaction> transactions, final Long userId){
        if(transactions == null || transactions.isEmpty()){
            return Collections.emptyMap();
        }
        List<RecurringTransactionRule> recurringTransactionRules = transactionCategorizer.categorizeRecurringTransactionsByUserRules(transactions, userId);
        Set<UserCategoryRule> userCategoryRules = categoryRuleCreator.createUserDefinedRules(recurringTransactionRules, userId);
        for(RecurringTransactionRule transactionRule : recurringTransactionRules){
            for(UserCategoryRule categoryRule : userCategoryRules){
                categorizedRecurringTransactionsUserRules.putIfAbsent(transactionRule.getTransactionId(), categoryRule);
                break;
            }
        }
        return categorizedRecurringTransactionsUserRules;
    }

    private void saveNewRules(final Map<String, UserCategoryRule> userCategorized,
                              final Map<String, CategoryRule> systemCategorized)
    {

        try
        {
            // Save the User Categorized Rules
            categoryRuleCreator.saveUserDefinedRules(userCategorized);

            // Save the system categorized rules
            categoryRuleCreator.saveSystemDefinedRules(systemCategorized);

        }catch(DataException ex){
            log.error("Unable to save Category Rules: ", ex);
        }

    }

    private void generateSummary(Map<String, UserCategoryRule> userCategorized,
                                 Map<String, CategoryRule> systemCategorized) {
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

        List<Transaction> transactions = loadTransactions();
        List<RecurringTransaction> recurringTransactions = loadRecurringTransactions();

        // Create user category rules
        List<UserCategoryRule> userCategoryRules = List.of(
                new UserCategoryRule(
                        "cat1",
                        "Supermarkets And Groceries",
                        "WINCO",
                        "WINCO FOODS.*",
                        "ONCE",
                        TransactionType.DEBIT,
                        false,
                        1,
                        1L,
                        LocalDateTime.now(),
                        LocalDateTime.now(),
                        TransactionMatchType.EXACT,
                        "WINCO",
                        true
                ),
                new UserCategoryRule(
                        "cat2",
                        "Utilities",
                        "ROCKY MOUNTAIN POWER",
                        "POWER BILL.*",
                        "MONTHLY",
                        TransactionType.DEBIT,
                        false,
                        2,
                        1L,
                        LocalDateTime.now(),
                        LocalDateTime.now(),
                        TransactionMatchType.EXACT,
                        "POWER",
                        true
                )
        );


        // Simulate processing transactions for a user
        Long userId = 1L;
        System.out.println("Processing transactions for user " + userId);

        try {
            long startTime = System.currentTimeMillis();
            categoryRuleEngine.transactionCategorizer.addUserCategoryRules(userCategoryRules);
            categoryRuleEngine.transactionCategorizer.addUserCategoryRulesRecurring(userCategoryRules);
            boolean success = categoryRuleEngine.processTransactionsForUser(transactions, recurringTransactions, userId);
            long endTime = System.currentTimeMillis();
            System.out.println(endTime - startTime);
            System.out.println("Processing completed: " + (success ? "Success" : "Failed"));

        } catch (Exception e) {
            System.err.println("Error during processing: " + e.getMessage());
            e.printStackTrace();
        }

        // Close the context
        context.close();
    }


}
