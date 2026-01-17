package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.services.TransactionCategoryService;
import com.app.budgetbuddy.services.TransactionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
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

    public Map<String, Set<TransactionRule>> groupTransactionRulesByMatchedCategory(final Map<String, ? extends TransactionRule> categorizedTransactions)
    {
        Map<String, Set<TransactionRule>> transactionRulesByMatchedCategory = new HashMap<>();
        if(categorizedTransactions == null || categorizedTransactions.isEmpty())
        {
            return transactionRulesByMatchedCategory;
        }
        for(Map.Entry<String, ? extends TransactionRule> entry : categorizedTransactions.entrySet())
        {
            TransactionRule transactionRule = entry.getValue();
            String matchedCategory = transactionRule.getMatchedCategory();
            transactionRulesByMatchedCategory.computeIfAbsent(matchedCategory, k -> new HashSet<>()).add(transactionRule);
        }
        return transactionRulesByMatchedCategory;
    }

    public List<TransactionCategory> createTransactionCategories(final Map<String, ? extends TransactionRule> categorizedTransactions)
    {
        if(categorizedTransactions == null || categorizedTransactions.isEmpty())
        {
            return Collections.emptyList();
        }
        Map<String, Set<TransactionRule>> groupedTransactionRulesByMatchedCategory = groupTransactionRulesByMatchedCategory(categorizedTransactions);
        List<String> transactionIds = new ArrayList<>(categorizedTransactions.keySet());
        List<TransactionCategory> allTransactionCategories = new ArrayList<>();
        Map<String, Transaction> transactionMap = transactionService.getTransactionsMap(transactionIds);
        log.info("Creating Transaction Categories");
        for(Map.Entry<String, Set<TransactionRule>> entry : groupedTransactionRulesByMatchedCategory.entrySet())
        {
            String matchedCategory = entry.getKey();
            Set<TransactionRule> transactionRules = entry.getValue();
            for(TransactionRule transactionRule : transactionRules)
            {
                String transactionId = transactionRule.getTransactionId();
                Transaction transaction = transactionMap.get(transactionId);
                List<String> plaidCategories = transaction.getCategories();
                boolean isSystemRule = transactionRule.isSystemRule();
                String categorizedBy = isSystemRule ? "SYSTEM" : "USER_RULE";
                int priority = transactionRule.getPriority();
                TransactionCategory transactionCategory = TransactionCategory.builder()
                        .categorized_date(LocalDate.now())
                        .categorizedBy(categorizedBy)
                        .createdAt(LocalDateTime.now())
                        .category(matchedCategory)
                        .transactionId(transactionId)
                        .build();
                allTransactionCategories.add(transactionCategory);
            }
        }
        return allTransactionCategories;
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
                        .add(tc.getCategory());
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
