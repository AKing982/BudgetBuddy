package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.TransactionRuleException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class TransactionCategorizer
{
    private TransactionCategoryRuleMatcher transactionCategoryRuleMatcher;
    private RecurringTransactionCategoryRuleMatcher recurringTransactionCategoryRuleMatcher;
    private List<RecurringTransactionRule> recurringTransactionRules = new ArrayList<>();
    private List<TransactionRule> transactionRules = new ArrayList<>();

    @Autowired
    public TransactionCategorizer(TransactionCategoryRuleMatcher transactionCategoryRuleMatcher,
                                  RecurringTransactionCategoryRuleMatcher recurringTransactionCategoryRuleMatcher)
    {
        this.transactionCategoryRuleMatcher = transactionCategoryRuleMatcher;
        this.recurringTransactionCategoryRuleMatcher = recurringTransactionCategoryRuleMatcher;
    }

    public void addUserCategoryRulesRecurring(List<UserCategoryRule> userCategoryRules){
        recurringTransactionCategoryRuleMatcher.setUserCategoryRules(userCategoryRules);
    }

    public void addUserCategoryRules(List<UserCategoryRule> userCategoryRules){
        transactionCategoryRuleMatcher.setUserCategoryRules(userCategoryRules);
    }


    public List<TransactionRule> categorizeTransactionsBySystemRules(final List<Transaction> transactions){
        if(transactions.isEmpty())
        {
            return transactionRules;
        }
        for(Transaction transaction : transactions)
        {
            log.info("Categorizing transaction {}", transaction);
            if(transaction == null)
            {
                log.warn("Found null transaction. Continuing to next transaction.");
                continue;
            }
            try
            {
                log.info("Processing transaction {}", transaction.toString());
                TransactionRule transactionRule = transactionCategoryRuleMatcher.categorizeTransaction(transaction);
                log.info("Created Rule for transaction {}:", transactionRule.toString());
                log.info("Transaction Rule: {}", transactionRule.toString());
                transactionRules.add(transactionRule);
            }catch(TransactionRuleException ex){
                log.error("There was an error categorizing the transaction: ", ex);
            }
        }
        log.info("Rules Size: {}", transactionRules.size());
        return transactionRules;
    }

    public List<TransactionRule> categorizeTransactionByUserRules(final List<Transaction> transactions, final Long userId) {
        if (transactions.isEmpty())
        {
            return transactionRules;
        }
        for(Transaction transaction : transactions)
        {
            if(transaction == null){
                log.warn("Found null transaction. Continuing to next transaction.");
                continue;
            }

            try
            {
                TransactionRule transactionRule = transactionCategoryRuleMatcher.categorizeTransactionByUserRules(transaction, userId);
                log.info("Created Rule for transaction {}:", transactionRule.toString());
                transactionRules.add(transactionRule);

            }catch(TransactionRuleException ex){
                log.error("There was an error categorizing the transaction: ", ex);
            }
        }
        log.info("Rules Size: {}", transactionRules.size());
        return transactionRules;
    }

    public List<RecurringTransactionRule> categorizeRecurringTransactionsBySystemRules(final List<RecurringTransaction> recurringTransactions){
        if(recurringTransactions.isEmpty())
        {
            return recurringTransactionRules;
        }
        for(RecurringTransaction recurringTransaction : recurringTransactions)
        {
            if(recurringTransaction == null){
                log.warn("Found null recurring transaction. Continuing to next transaction.");
                continue;
            }
            try
            {
                RecurringTransactionRule recurringTransactionRule = recurringTransactionCategoryRuleMatcher.categorizeTransaction(recurringTransaction);
                log.info("Created Rule for recurring transaction {}:", recurringTransactionRule.toString());
                recurringTransactionRules.add(recurringTransactionRule);

            }catch(TransactionRuleException ex){
                log.error("There was an error categorizing the transaction: ", ex);
            }
        }
        return recurringTransactionRules;
    }


    public List<RecurringTransactionRule> categorizeRecurringTransactionsByUserRules(final List<RecurringTransaction> recurringTransactions, final Long userId){
        if(recurringTransactions.isEmpty()){
            return recurringTransactionRules;
        }
        for(RecurringTransaction recurringTransaction : recurringTransactions)
        {
            if(recurringTransaction == null){
                log.warn("Found null recurring transaction. Continuing to next transaction.");
                continue;
            }
            try
            {
                RecurringTransactionRule recurringTransactionRule = recurringTransactionCategoryRuleMatcher.categorizeTransactionByUserRules(recurringTransaction, userId);
                log.info("Created Rule for recurring transaction {}:", recurringTransactionRule.toString());
                recurringTransactionRules.add(recurringTransactionRule);

            }catch(TransactionRuleException ex){
                log.error("There was an error categorizing the transaction: ", ex);
            }
        }
        return recurringTransactionRules;
    }

}
