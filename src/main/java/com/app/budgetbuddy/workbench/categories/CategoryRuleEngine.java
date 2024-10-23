package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.Transaction;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class CategoryRuleEngine
{
    public void addCategoryRule(CategoryRule categoryRule){

    }

    public void removeCategoryRule(CategoryRule categoryRule){

    }

    public boolean validateRule(CategoryRule categoryRule){
        return false;
    }

    public List<CategoryRule> getCategoryRules() {
        return List.of();
    }

    public String categorizeTransaction(Transaction transaction) {
        return "";
    }

    public Map<Transaction, CategoryRule> categorizeTransactions(List<Transaction> transactions) {
        return null;
    }

    public void updateCategoryRule(CategoryRule categoryRule) {

    }
}
