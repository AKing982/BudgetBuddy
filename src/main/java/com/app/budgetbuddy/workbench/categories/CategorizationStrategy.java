package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryType;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.domain.TransactionRule;

import java.util.List;

public interface CategorizationStrategy
{
    CategoryType categorize(Transaction transaction);

    default boolean supportsUserRules(){
        return false;
    }

    default CategoryType categorizeWithUserRules(Transaction transaction, List<TransactionRule> transactionRuleList){
        throw new UnsupportedOperationException("Not supported yet.");
    }
}
