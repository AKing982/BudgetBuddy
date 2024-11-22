package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.services.TransactionLoaderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
//            Map<Transaction, CategoryRule> userCategorized =
//                    transactionCategorizer.categorizeByUserRules(transactions, userId);

            // 3. Apply system rules to remaining uncategorized
//            List<Transaction> uncategorized = transactions.stream()
//                    .filter(t -> !userCategorized.containsKey(t))
//                    .collect(Collectors.toList());
//
//            Map<Transaction, CategoryRule> systemCategorized =
//                    transactionCategorizer.categorizeBySystemRules(uncategorized);


//            List<RecurringTransactionRule> userCategorizedRecurringTransactions
//                    = transactionCategorizer.categorizeRecurringTransactionsByUserRules(recurringTransactions, userId);
//
//            // 4. Generate and save rules
//            saveNewRules(userCategorized, systemCategorized, userId);
//
//            // 5. Log summary
//            generateSummary(userCategorized, systemCategorized);

            return true;
        } catch (Exception e) {
            log.error("Error processing transactions for user {}", userId, e);
            return false;
        }
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

    private void saveNewRules(Map<Transaction, CategoryRule> userCategorized,
                              Map<Transaction, CategoryRule> systemCategorized,
                              Long userId) {
        // Save only unique rules
        Set<CategoryRule> newRules = new HashSet<>();
        newRules.addAll(userCategorized.values());
        newRules.addAll(systemCategorized.values());
//        categoryRuleCreator.saveRules(newRules, userId);
    }

    private void generateSummary(Map<Transaction, CategoryRule> userCategorized,
                                 Map<Transaction, CategoryRule> systemCategorized) {
        log.info("Categorization Summary:");
        log.info("User Rules: {}", userCategorized.size());
        log.info("System Rules: {}", systemCategorized.size());
        log.info("Total Rules: {}", userCategorized.size() + systemCategorized.size());
    }


}
