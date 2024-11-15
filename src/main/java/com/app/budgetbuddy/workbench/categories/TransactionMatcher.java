package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionRule;

public interface TransactionMatcher<T extends Transaction>
{
    TransactionRule categorizeTransaction(T transaction);
}
