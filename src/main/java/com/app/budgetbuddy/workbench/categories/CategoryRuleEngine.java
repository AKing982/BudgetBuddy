package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.workbench.TransactionDataLoader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CategoryRuleEngine
{
    private final CategoryRuleCreator categoryRuleCreator;
    private final TransactionCategoryRuleMatcher categoryRuleMatcher;
    private final TransactionDataLoader transactionDataLoader;

    @Autowired
    public CategoryRuleEngine(CategoryRuleCreator categoryRuleCreator,
                              TransactionCategoryRuleMatcher categoryRuleMatcher,
                              TransactionDataLoader transactionDataLoader)
    {
        this.categoryRuleCreator = categoryRuleCreator;
        this.categoryRuleMatcher = categoryRuleMatcher;
        this.transactionDataLoader = transactionDataLoader;
    }

    public Map<Transaction, CategoryRule> categorizeTransactions(List<Transaction> transactions)
    {
        return null;
    }

    public Map<RecurringTransaction, CategoryRule> categorizeRecurringTransactions(List<RecurringTransaction> recurringTransactions)
    {
        return null;
    }

    public List<Transaction> getUncategorizedTransactions()
    {
        return null;
    }

    public Category categorizeSingleTransaction(Transaction transaction)
    {
        return null;
    }



}
