package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryType;
import com.app.budgetbuddy.domain.TransactionRule;

public interface CategorizerService<T>
{
    String categorize(T transaction);
    boolean matches(T transaction, TransactionRule transactionRule);
}
