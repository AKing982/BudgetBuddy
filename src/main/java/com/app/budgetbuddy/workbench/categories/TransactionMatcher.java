package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.domain.TransactionRule;

import java.util.Optional;

public interface TransactionMatcher<T extends Transaction, S extends TransactionRule>
{
    Optional<S> categorizeTransaction(T transaction, int priority);
}
