package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionRule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
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

    public TransactionRule categorize(Transaction transaction){
        return transactionCategoryRuleMatcher.categorizeTransaction(transaction);
    }

    public TransactionRule categorize(RecurringTransaction recurringTransaction){
        return recurringTransactionCategoryRuleMatcher.categorizeTransaction(recurringTransaction);
    }
}
