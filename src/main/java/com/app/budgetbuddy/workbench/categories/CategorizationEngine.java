package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.TransactionRule;

public interface CategorizationEngine<T>
{
    Category categorize(T transaction);
    boolean matches(T transaction, TransactionRule transactionRule);
}
