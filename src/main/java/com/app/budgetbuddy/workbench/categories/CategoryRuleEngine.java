package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
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
    private List<Transaction> transactions = new ArrayList<>();
    private List<Transaction> uncategorizedTransactions = new ArrayList<>();
    private List<RecurringTransaction> recurringTransactions = new ArrayList<>();

    @Autowired
    public CategoryRuleEngine(CategoryRuleCreator categoryRuleCreator,
                              TransactionCategorizer transactionCategorizer,
                              TransactionLoaderService transactionDataLoader)
    {
        this.categoryRuleCreator = categoryRuleCreator;
        this.transactionCategorizer = transactionCategorizer;
        this.transactionDataLoader = transactionDataLoader;
    }

    public List<TransactionRule> getMatchedTransactionRules(List<Transaction> transactions){
        return null;
    }

    public List<RecurringTransactionRule> getMatchedRecurringTransactionRules(List<RecurringTransaction> recurringTransactions){
        return null;
    }

    public Set<CategoryRule> createCategorySystemRules(List<? extends TransactionRule> transactionRules){
        return null;
    }

    public Set<UserCategoryRule> createUserCategoryRules(List<? extends TransactionRule> transactionRules){
        return null;
    }


    public Boolean processTransactionsForUser(Long userId){

//
//
//            loadExistingTransactionsForUser(userId);
//            loadExistingRecurringTransactionsForUser(userId);
//
//            Map<Transaction, CategoryRule> categorizedTransactions = categorizeTransactions(transactions);
//            Map<RecurringTransaction, CategoryRule> categorizedRecurring = categorizeRecurringTransactions(recurringTransactions);
//
//            Set<CategoryRule> systemRules = categoryRuleCreator.createSystemRules(
//                    convertToTransactionRuleMap(categorizedTransactions));
//            Set<UserCategoryRule> userRules = categoryRuleCreator.createUserDefinedRules(
//                    convertToTransactionRuleMap(categorizedTransactions), userId);
//
//            saveNewCategoryRules(systemRules);
//            saveNewCategoryRules(userRules);
//
//            generateCategorizationSummary(transactions, recurringTransactions);
//            return true;
//        } catch (Exception e) {
//            log.error("Error processing transactions for user {}", userId, e);
//            return false;
//        }
            return null;
    }

    private Map<TransactionRule, String> convertToTransactionRuleMap(Map<? extends Transaction, CategoryRule> categorizedTransactions) {
        Map<TransactionRule, String> result = new HashMap<>();
        categorizedTransactions.forEach((transaction, categoryRule) -> {
            TransactionRule transRule = new TransactionRule();
            transRule.setTransactionId(transaction.getTransactionId());
            transRule.setMerchantPattern(transaction.getMerchantName());
            transRule.setDescriptionPattern(transaction.getDescription());
            transRule.setCategories(transaction.getCategories());
            transRule.setMatchedCategory(categoryRule.getCategoryName());
            result.put(transRule, categoryRule.getCategoryName());
        });
        return result;
    }

    public List<? extends CategoryRule> saveNewCategoryRules(Set<? extends CategoryRule> newRules)
    {
//        try {
//            newRules.forEach(rule -> {
//                if (rule instanceof UserCategoryRule) {
//                    categoryRuleCreator.loadExistingUserCategoryRules(((UserCategoryRule) rule).getUserId())
//                            .stream()
//                            .filter(existingRule -> !existingRule.equals(rule))
//                            .forEach(uniqueRule -> categoryRuleService.save(uniqueRule));
//                } else {
//                    categoryRuleCreator.loadExistingCategoryRules()
//                            .stream()
//                            .filter(existingRule -> !existingRule.equals(rule))
//                            .forEach(uniqueRule -> categoryRuleService.save(uniqueRule));
//                }
//            });
//        } catch (Exception e) {
//            log.error("Error saving category rules", e);
//            throw new CategoryRuleSaveException("Failed to save category rules", e);
//        }
        return null;
    }

    public CategorizationSummary generateCategorizationSummary(List<Transaction> transactions, List<RecurringTransaction> recurringTransactions){
//        Map<String, Integer> categoryCounts = new HashMap<>();
//
//        transactions.forEach(transaction ->
//                categoryCounts.merge(transaction.getCategory(), 1, Integer::sum));
//
//        recurringTransactions.forEach(transaction ->
//                categoryCounts.merge(transaction.getCategory(), 1, Integer::sum));
//
//        log.info("Categorization Summary:");
//        log.info("Total Transactions: {}", transactions.size() + recurringTransactions.size());
//        log.info("Categories Distribution: {}", categoryCounts);
//        log.info("Uncategorized: {}", uncategorizedTransactions.size());
        return null;
    }

    public List<Transaction> processMatchedTransactions(final Map<Transaction, String> categorizedTransactions) {
//        categorizedTransactions.forEach((transaction, category) -> {
//            if ("Uncategorized".equals(category)) {
//                uncategorizedTransactions.add(transaction);
//            }
//        });
        return null;
    }

    public List<RecurringTransaction> processMatchedRecurringTransactions(final Map<RecurringTransaction, String> categorizedRecurringTransactions) {
//       categorizedRecurringTransactions.forEach((transaction, category) -> {
//            if (!"Uncategorized".equals(category)) {
//                transaction.setCategory(category);
//            }
//        });
        return null;
    }

    public Map<Transaction, UserCategoryRule> categorizeTransactionsByUserRules(List<Transaction> recurringTransactions, Long userId){
        return null;
    }

    public Map<RecurringTransaction, UserCategoryRule> categorizeRecurringTransactionsByUserRules(List<RecurringTransaction> recurringTransactions, Long userId){
        return null;
    }

    public Map<Transaction, CategoryRule> categorizeTransactions(List<Transaction> transactions) {
//        return transactions.stream()
//                .collect(Collectors.toMap(
//                        transaction -> transaction,
//                        transactionCategorizer::categorize,
//                        (existing, replacement) -> existing
//                ));
        return null;
    }

    public Map<RecurringTransaction, CategoryRule> categorizeRecurringTransactions(List<RecurringTransaction> recurringTransactions) {
//        return recurringTransactions.stream()
//                .collect(Collectors.toMap(
//                        transaction -> transaction,
//                        transactionCategorizer::categorize,
//                        (existing, replacement) -> existing
//                ));
//        return null;
        return null;
    }

    public void processUncategorizedTransactions(){

    }

    public List<Transaction> getUncategorizedTransactions() {
        return null;
    }

    public List<RecurringTransaction> getUncategorizedRecurringTransactions() {
        return null;
    }

    public void loadExistingTransactionsForUser(Long userId){
        LocalDate startDate = LocalDate.now().minusMonths(1);
        LocalDate endDate = LocalDate.now();
        this.transactions = transactionDataLoader.loadTransactionsByUserDateRange(userId, startDate, endDate);
    }

    public void loadExistingRecurringTransactionsForUser(Long userId){
        LocalDate startDate = LocalDate.now().minusMonths(1);
        LocalDate endDate = LocalDate.now();
        this.recurringTransactions = transactionDataLoader.loadRecurringTransactionsByUserDateRange(userId, startDate, endDate);
    }

}
