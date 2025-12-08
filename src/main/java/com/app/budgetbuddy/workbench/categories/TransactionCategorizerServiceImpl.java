package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryType;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionRule;
import org.springframework.stereotype.Service;

@Service
public class TransactionCategorizerServiceImpl implements CategorizerService<Transaction>
{

    @Override
    public CategoryType categorize(Transaction transaction)
    {
        return null;
    }

    @Override
    public boolean matches(Transaction transaction, TransactionRule transactionRule)
    {
        return false;
    }
}
