package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.RecurringTransactionRule;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionRule;
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
    private final TransactionCategoryRuleMatcher transactionCategoryRuleMatcher;
    private final RecurringTransactionCategoryRuleMatcher recurringTransactionCategoryRuleMatcher;

    @Autowired
    public TransactionCategorizer(TransactionCategoryRuleMatcher transactionCategoryRuleMatcher,
                                  RecurringTransactionCategoryRuleMatcher recurringTransactionCategoryRuleMatcher)
    {
        this.transactionCategoryRuleMatcher = transactionCategoryRuleMatcher;
        this.recurringTransactionCategoryRuleMatcher = recurringTransactionCategoryRuleMatcher;
    }


    public List<TransactionRule> categorizeTransactionsBySystemRules(final List<Transaction> transactions){
        List<TransactionRule> rules = new ArrayList<>();
        if(transactions.isEmpty())
        {
            return rules;
        }
        for(Transaction transaction : transactions)
        {
            log.info("Processing transaction {}", transaction.toString());
            try
            {
                TransactionRule transactionRule = transactionCategoryRuleMatcher.categorizeTransaction(transaction);
                log.info("Created Rule for transaction {}: {}", transaction.getTransactionId(), transactionRule.getMatchedCategory());
                log.info("Transaction Rule: {}", transactionRule.toString());
                rules.add(transactionRule);
            }catch(TransactionRuleException e)
            {
                log.error("Error categorizing transaction {}", transaction, e);
            }
        }
        log.info("Rules Size: {}", rules.size());
        return rules;
    }

    public List<TransactionRule> categorizeTransactionByUserRules(final List<Transaction> transactions, final Long userId){
        return null;
    }

    public List<RecurringTransactionRule> categorizeRecurringTransactionsBySystemRules(final List<RecurringTransaction> recurringTransactions){
        return null;
    }


    public List<RecurringTransactionRule> categorizeRecurringTransactionsByUserRules(final List<RecurringTransaction> recurringTransactions, final Long userId){
        return null;
    }

}
