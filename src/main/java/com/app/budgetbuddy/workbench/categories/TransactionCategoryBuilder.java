package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.services.TransactionCategoryService;
import com.app.budgetbuddy.services.TransactionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@Slf4j
public class TransactionCategoryBuilder
{
    private final TransactionCategoryService transactionCategoryService;
    private final TransactionService transactionService;

    @Autowired
    public TransactionCategoryBuilder(TransactionCategoryService transactionCategoryService,
                                      TransactionService transactionService)
    {
        this.transactionCategoryService = transactionCategoryService;
        this.transactionService = transactionService;
    }

    public List<TransactionCategory> createTransactionCategories(final Map<String, ? extends TransactionRule> categorizedTransactions)
    {
        if(categorizedTransactions == null || categorizedTransactions.isEmpty())
        {
            return Collections.emptyList();
        }
        List<TransactionCategory> allTransactionCategories = new ArrayList<>();
        log.info("Creating Transaction Categories");
        List<String> transactionIds = new ArrayList<>(categorizedTransactions.keySet());
        Map<String, Set<String>> existingCategories = fetchExistingCategories(transactionIds);
        Map<String, Transaction> transactionsMap = transactionService.getTransactionsMap(transactionIds);
        if(transactionsMap == null)
        {
            return Collections.emptyList();
        }
        // Process each category group
        for (Map.Entry<String, ? extends TransactionRule> entry : categorizedTransactions.entrySet())
        {
            String transactionId = entry.getKey();
            TransactionRule transactionRule = entry.getValue();
            log.info("Transaction Rule: {}", transactionRule);
            log.info("Fetching Transaction with Id: {}", transactionId);
            Transaction transaction = transactionsMap.get(transactionId);
            log.info("Transaction: {}", transaction);
            if(transaction == null)
            {
                log.debug("Transaction not found for Id: {}", transactionId);
                continue;
            }
            String matchedCategory = transactionRule.getMatchedCategory();
            if(matchedCategory.equals("UNCATEGORIZED"))
            {
                continue;
            }
            if (isDuplicateCategory(existingCategories, transactionId, matchedCategory)) {
                log.info("Skipping duplicate category {} for transaction {}", matchedCategory, transactionId);
                continue;
            }
            log.info("Priority: {}", transactionRule.getPriority());
            String plaidCategory = "";
            List<String> plaidCategories = transaction.getCategories();
            if(plaidCategories.get(0) != null)
            {
                plaidCategory = plaidCategories.get(0);
            }
            else
            {
                plaidCategory = plaidCategories.get(1);
            }
            String categorizedBy = transactionRule.isSystemRule() ? "SYSTEM" : "USER_RULE";
            TransactionCategory transactionCategory = TransactionCategory.build(transactionId, transactionRule.getMatchedCategory(), plaidCategory, categorizedBy, transactionRule.getPriority(), false);
            log.info("TransactionCategory: {}", transactionCategory);
            log.info("========================================================");
            allTransactionCategories.add(transactionCategory);
        }
        log.info("Created {} Transaction Categories", allTransactionCategories.size());
        if(!allTransactionCategories.isEmpty())
        {
            saveTransactionCategories(allTransactionCategories);
        }
        return allTransactionCategories;
    }

    /**
     * Check if this transaction+category combination already exists
     */
    private boolean isDuplicateCategory(Map<String, Set<String>> existingCategories,
                                        String transactionId, String category) {
        Set<String> categories = existingCategories.get(transactionId);
        return categories != null && categories.contains(category);
    }

    /**
     * Add to our local cache of existing categories
     */
    private void addToExistingCategories(Map<String, Set<String>> existingCategories,
                                         String transactionId, String category) {
        existingCategories
                .computeIfAbsent(transactionId, k -> new HashSet<>())
                .add(category);
    }

    /**
     * Fetch existing transaction categories to avoid duplicates
     */
    private Map<String, Set<String>> fetchExistingCategories(List<String> transactionIds) {
        Map<String, Set<String>> existingCategories = new HashMap<>();
        try {
            List<TransactionCategory> existingTransactionCategories =
                    transactionCategoryService.getTransactionCategoryListByTransactionIds(transactionIds);

            for (TransactionCategory tc : existingTransactionCategories) {
                existingCategories
                        .computeIfAbsent(tc.getTransactionId(), k -> new HashSet<>())
                        .add(tc.getMatchedCategory());
            }
        } catch (Exception e) {
            log.error("Error fetching existing transaction categories: ", e);
        }
        return existingCategories;
    }

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
