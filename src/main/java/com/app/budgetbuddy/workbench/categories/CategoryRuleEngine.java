package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.TransactionLoaderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
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
    private Map<String, CategoryRule> categorizedTransactionSystemRules = new HashMap<>();
    private Map<String, UserCategoryRule> categorizedTransactionsUserRules = new HashMap<>();
    private Map<String, CategoryRule> categorizedRecurringTransactionSystemRules = new HashMap<>();
    private Map<String, UserCategoryRule> categorizedRecurringTransactionsUserRules = new HashMap<>();

    @Autowired
    public CategoryRuleEngine(CategoryRuleCreator categoryRuleCreator,
                              TransactionCategorizer transactionCategorizer,
                              TransactionLoaderService transactionDataLoader)
    {
        this.categoryRuleCreator = categoryRuleCreator;
        this.transactionCategorizer = transactionCategorizer;
        this.transactionDataLoader = transactionDataLoader;
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
        Set<CategoryRule> systemCategoryRules = categoryRuleCreator.createSystemRules(transactionRulesWithSystemRules);
        for(TransactionRule transactionRule : transactionRulesWithSystemRules){
            for(CategoryRule categoryRule : systemCategoryRules){
                categorizedTransactionSystemRules.putIfAbsent(transactionRule.getTransactionId(), categoryRule);
                break;
            }
        }
        return categorizedTransactionSystemRules;
    }

    public Map<String, UserCategoryRule> getCategorizedTransactionsWithUserRules(List<Transaction> transactions, Long userId){
        if(transactions == null || transactions.isEmpty()){
            return Collections.emptyMap();
        }
        List<TransactionRule> transactionRulesWithUserRules = transactionCategorizer.categorizeTransactionByUserRules(transactions, userId);
        Set<UserCategoryRule> userCategoryRules = categoryRuleCreator.createUserDefinedRules(transactionRulesWithUserRules, userId);
        for(TransactionRule transactionRule : transactionRulesWithUserRules){
            for(UserCategoryRule categoryRule : userCategoryRules){
                categorizedTransactionsUserRules.putIfAbsent(transactionRule.getTransactionId(), categoryRule);
                break;
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

    public Map<String, UserCategoryRule> getCategorizedRecurringTransactionsWithUserRules(List<RecurringTransaction> transactions, Long userId){
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
        log.info("User Rules: {}", userCategorized.size());
        log.info("System Rules: {}", systemCategorized.size());
        log.info("Total Rules: {}", userCategorized.size() + systemCategorized.size());
    }

    public static void main(String[] args) {
        // Initialize Spring Application Context
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
        context.scan("com.app.budgetbuddy"); // Adjust to your package structure
        context.refresh();

        // Retrieve the CategoryRuleEngine bean
        CategoryRuleEngine categoryRuleEngine = context.getBean(CategoryRuleEngine.class);

        // Create sample transactions
        List<Transaction> sampleTransactions = List.of(
                new Transaction(
                        "account123",
                        BigDecimal.valueOf(50.75),
                        "USD",
                        List.of("Groceries", "Shopping"),
                        "cat1",
                        LocalDate.now(),
                        "WINCO FOODS Purchase",
                        "WINCO",
                        "Winco Foods",
                        false,
                        "txn123",
                        LocalDate.now(),
                        "http://example.com/logo.png",
                        LocalDate.now()
                ),
                new Transaction(
                        "account124",
                        BigDecimal.valueOf(120.00),
                        "USD",
                        List.of("Utilities"),
                        "cat2",
                        LocalDate.now().minusDays(5),
                        "POWER BILL Payment",
                        "ROCKY MOUNTAIN POWER",
                        "RMP",
                        false,
                        "txn124",
                        LocalDate.now().minusDays(5),
                        null,
                        LocalDate.now().minusDays(5)
                )
        );

        // Create sample recurring transactions
        List<RecurringTransaction> sampleRecurringTransactions = List.of(
                new RecurringTransaction(
                        "account125",
                        BigDecimal.valueOf(500.00),
                        "USD",
                        List.of("Rent"),
                        "cat3",
                        LocalDate.now().minusMonths(1),
                        "Monthly Rent Payment",
                        "LANDLORD INC",
                        "Landlord",
                        false,
                        "recTxn1",
                        LocalDate.now().minusMonths(1),
                        null,
                        LocalDate.now().minusMonths(1),
                        "stream1",
                        LocalDate.now().minusMonths(1),
                        LocalDate.now(),
                        "MONTHLY",
                        BigDecimal.valueOf(500.00),
                        BigDecimal.valueOf(500.00),
                        true,
                        "RENT"
                )
        );

        // Simulate processing transactions for a user
        Long userId = 1L;
        System.out.println("Processing transactions for user " + userId);

        try {
            boolean success = categoryRuleEngine.processTransactionsForUser(userId);
            System.out.println("Processing completed: " + (success ? "Success" : "Failed"));
        } catch (Exception e) {
            System.err.println("Error during processing: " + e.getMessage());
            e.printStackTrace();
        }

        // Close the context
        context.close();
    }


}
