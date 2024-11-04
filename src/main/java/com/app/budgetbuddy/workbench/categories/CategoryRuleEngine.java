package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.Transaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CategoryRuleEngine
{
    private final CategoryRuleCreator categoryRuleCreator;
    private final CategoryRuleMatcher categoryRuleMatcher;
    private final CategoryRulePrioritizer categoryRulePrioritizer;
    private final UserCategoryRuleManager userCategoryRuleManager;
    private final CategoryConflictResolver categoryConflictResolver;
    private final Map<Transaction, CategoryRule> transactionCategoryRules = new ConcurrentHashMap<>();
    private final Map<RecurringTransaction, CategoryRule> recurringTransactionCategoryRules = new ConcurrentHashMap<>();

    @Autowired
    public CategoryRuleEngine(CategoryRuleCreator categoryRuleCreator,
                              CategoryRuleMatcher categoryRuleMatcher,
                              CategoryRulePrioritizer categoryRulePrioritizer,
                              UserCategoryRuleManager userCategoryRuleManager,
                              CategoryConflictResolver categoryConflictResolver)
    {
        this.categoryRuleCreator = categoryRuleCreator;
        this.categoryRuleMatcher = categoryRuleMatcher;
        this.categoryRulePrioritizer = categoryRulePrioritizer;
        this.userCategoryRuleManager = userCategoryRuleManager;
        this.categoryConflictResolver = categoryConflictResolver;

    }

    public Map<Transaction, CategoryRule> categorizeTransactions(List<Transaction> transactions)
    {
        return null;
    }

    public Map<RecurringTransaction, CategoryRule> categorizeRecurringTransactions(List<RecurringTransaction> recurringTransactions)
    {
        return null;
    }

    public Map<Transaction, CategoryRule> getCategorizedTransactions()
    {
        return transactionCategoryRules;
    }

    public Map<RecurringTransaction, CategoryRule> getCategorizedRecurringTransactions()
    {
        return recurringTransactionCategoryRules;
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
