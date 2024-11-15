package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.services.TransactionLoaderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CategoryRuleEngine
{
    private final CategoryRuleCreator categoryRuleCreator;
    private final TransactionCategorizer transactionCategorizer;
    private final TransactionLoaderService transactionDataLoader;
    private List<Transaction> transactions = new ArrayList<>();
    private List<Transaction> uncategorizedTransactions = new ArrayList<>();
    private List<RecurringTransaction> recurringTransactions = new ArrayList<>();

    @Autowired
    public CategoryRuleEngine(CategoryRuleCreator categoryRuleCreator,
                              TransactionCategorizer transactionCategorizer,
                              TransactionLoaderService transactionDataLoader)
    {
        this.categoryRuleCreator = categoryRuleCreator;
        this.transactionCategorizer = transactionCategorizer;
        this.transactionDataLoader = transactionDataLoader;
    }

    public void processTransactionsForUser(Long userId){

    }

    public void saveNewCategoryRules(Map<? extends Transaction, CategoryRule> newRules){

    }

    public void generateCategorizationSummary(List<Transaction> transactions, List<RecurringTransaction> recurringTransactions){

    }

    public void processMatchedTransactions(Map<Transaction, String> categorizedTransactions){

    }

    public void processMatchedRecurringTransactions(Map<RecurringTransaction, String> categorizedRecurringTransactions){

    }

    public void processUncategorizedTransactions(){

    }

    public List<Transaction> getUncategorizedTransactions() {
        return null;
    }

    public List<RecurringTransaction> getUncategorizedRecurringTransactions() {
        return null;
    }

    public void loadExistingTransactionsForUser(Long userId){

    }

    public void loadExistingRecurringTransactionsForUser(Long userId){

    }

    public Map<Transaction, CategoryRule> categorizeTransactions(List<Transaction> transactions)
    {
        return null;
    }

    public Map<RecurringTransaction, CategoryRule> categorizeRecurringTransactions(List<RecurringTransaction> recurringTransactions)
    {
        return null;
    }

    public CategoryRule categorizeSingleTransaction(Transaction transaction)
    {
        return null;
    }
}
