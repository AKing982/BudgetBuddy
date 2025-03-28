package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.domain.TransactionRule;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.services.TransactionCategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class TransactionCategoryBuilder
{
    private final TransactionCategoryService transactionCategoryService;

    @Autowired
    public TransactionCategoryBuilder(TransactionCategoryService transactionCategoryService)
    {
        this.transactionCategoryService = transactionCategoryService;
    }

    public List<TransactionCategory> createTransactionCategories(final Map<String, Pair<TransactionRule, List<Transaction>>> categorizedTransactions)
    {
        List<TransactionCategory> allTransactionCategories = new ArrayList<>();

        log.info("Creating Transaction Categories");
        log.info("===============================");
        // Process each category group
        for (Map.Entry<String, Pair<TransactionRule, List<Transaction>>> entry : categorizedTransactions.entrySet()) {
            String categoryName = entry.getKey();
            log.info("Category Name: {}", categoryName);
            TransactionRule rule = entry.getValue().getFirst();
            log.info("Rule: {}", rule);
            List<Transaction> transactions = entry.getValue().getSecond();
            // Create a category entry for EACH transaction in the list
            for (Transaction transaction : transactions) {
                log.info("Transaction: {}", transaction);
                TransactionCategory transactionCategory = new TransactionCategory();
                transactionCategory.setTransactionId(transaction.getTransactionId());
                log.info("Priority: {}", rule.getPriority());
                transactionCategory.setPriority(rule.getPriority());
                transactionCategory.setMatchedCategory(categoryName);
                transactionCategory.setRecurring(false);

                // Use the transaction's plaid category if available
                String plaidCategory = "";
                if (transaction.getCategories() != null && !transaction.getCategories().isEmpty()) {
                    plaidCategory = transaction.getCategories().get(0);
                }
                transactionCategory.setPlaidCategory(plaidCategory);
                String categorizedBy = rule.isSystemRule() ? "SYSTEM" : "USER_RULE";
                transactionCategory.setCategorizedBy(categorizedBy);
                log.info("Transaction Category: {}", transactionCategory);
                allTransactionCategories.add(transactionCategory);
            }
        }
        log.info("============================================");

        // Save all transaction categories
        if (!allTransactionCategories.isEmpty()) {
            saveTransactionCategories(allTransactionCategories);
        }

        return allTransactionCategories;
    }
//
//    public List<TransactionRule> convertCategoryRuleMap(Map<String, Pair<TransactionRule, List<Transaction>>> transactionRuleMap)
//    {
//        List<TransactionRule> transactionRules = new ArrayList<>();
//        for (Map.Entry<String, Pair<TransactionRule, List<Transaction>>> entry : transactionRuleMap.entrySet()) {
//            TransactionRule transactionRule = entry.getValue().getFirst();
//            transactionRules.add(transactionRule);
//        }
//
//        return transactionRules;
//    }

//    public List<TransactionCategory> createTransactionCategoriesFromRules(final List<TransactionRule> transactionRules)
//    {
//        List<TransactionCategory> transactionCategories = new ArrayList<>();
//        for(TransactionRule transactionRule : transactionRules)
//        {
//            TransactionCategory transactionCategory = new TransactionCategory();
//            transactionCategory.setTransactionId(transactionRule.getTransactionId());
//            transactionCategory.setPriority(transactionRule.getPriority());
//            transactionCategory.setMatchedCategory(transactionRule.getMatchedCategory());
//            transactionCategory.setRecurring(false);
//            transactionCategory.setPlaidCategory(transactionRule.getPlaidCategory());
//            String categorizedBy = transactionRule.isSystemRule() ? "SYSTEM" : "USER_RULE";
//            transactionCategory.setCategorizedBy(categorizedBy);
//            transactionCategories.add(transactionCategory);
//        }
//        return transactionCategories;
//    }
//
    public void saveTransactionCategories(final List<TransactionCategory> transactionCategories)
    {
        try
        {
            transactionCategoryService.saveAll(transactionCategories);
        }catch(DataAccessException e){
            log.error("There was an error saving the transaction categories: ", e);
        }
    }
}
