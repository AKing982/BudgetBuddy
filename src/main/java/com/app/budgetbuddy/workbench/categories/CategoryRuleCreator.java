package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CategoryRuleCreator
{

    private Map<Transaction, CategoryRule> transactionCategoryRules = new ConcurrentHashMap<>();
    private Map<RecurringTransaction, CategoryRule> recurringCategoryRules = new ConcurrentHashMap<>();
    private final CategoryRuleService categoryRuleService;

    @Autowired
    public CategoryRuleCreator(CategoryRuleService categoryRuleService)
    {
        this.categoryRuleService = categoryRuleService;
    }

    public List<CategoryRule> createCategoryRuleListFromTransactions(List<Transaction> transactions) {
        return null;
    }

    public List<CategoryRule> createCategoryRuleFromRecurringTransactions(List<RecurringTransaction> recurringTransactions) {
        return null;
    }

    public List<CategoryRule> createCategoryRulesFromRecurringTransaction(RecurringTransaction recurringTransaction) {
        return null;
    }

    public CategoryRule createCategoryRuleFromTransaction(Transaction transaction)
    {
        return null;
    }

    private TransactionType determineTransactionType(Transaction transaction)
    {
        return null;
    }

    private TransactionType determineTransactionType(RecurringTransaction recurringTransaction)
    {
        return null;
    }


}
