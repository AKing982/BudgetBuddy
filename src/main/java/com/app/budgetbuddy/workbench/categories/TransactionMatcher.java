package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionRule;

public interface TransactionMatcher<T extends Transaction, S extends TransactionRule>
{
    S categorizeTransaction(T transaction);
}
