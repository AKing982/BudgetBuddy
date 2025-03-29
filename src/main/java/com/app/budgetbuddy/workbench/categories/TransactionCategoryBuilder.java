package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.domain.TransactionRule;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.services.TransactionCategoryService;
import com.app.budgetbuddy.services.TransactionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

    public List<TransactionCategory> createTransactionCategories(final Map<String, TransactionRule> categorizedTransactions)
    {
        List<TransactionCategory> allTransactionCategories = new ArrayList<>();
        log.info("Creating Transaction Categories");

        // Process each category group
        for (Map.Entry<String, TransactionRule> entry : categorizedTransactions.entrySet()) {
            String transactionId = entry.getKey();
            TransactionRule transactionRule = entry.getValue();
            log.info("Processing transactionId: {}", transactionId);
            log.info("Transaction Rule: {}", transactionRule);

            Optional<Transaction> transactionOptional = transactionService.findTransactionById(transactionId);
            if(transactionOptional.isEmpty())
            {
                log.info("Transaction not found for Id: {}", transactionId);
                continue;
            }
            Transaction transaction = transactionOptional.get();
            log.info("Transaction: {}", transaction);
            TransactionCategory transactionCategory = new TransactionCategory();
            transactionCategory.setTransactionId(transactionId);
            log.info("Priority: {}", transactionRule.getPriority());
            transactionCategory.setPriority(transactionRule.getPriority());
            transactionCategory.setMatchedCategory(transactionRule.getMatchedCategory());
            transactionCategory.setRecurring(false);
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
            transactionCategory.setPlaidCategory(plaidCategory);
            String categorizedBy = transactionRule.isSystemRule() ? "SYSTEM" : "USER_RULE";
            transactionCategory.setCategorizedBy(categorizedBy);
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
