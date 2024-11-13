package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Transaction;

public interface TransactionMatcher<T extends Transaction>
{
    String categorizeTransaction(T transaction);
}
