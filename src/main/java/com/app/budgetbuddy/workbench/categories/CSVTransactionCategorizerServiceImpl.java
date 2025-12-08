package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryType;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.domain.TransactionRule;
import org.springframework.stereotype.Service;

@Service
public class CSVTransactionCategorizerServiceImpl implements CategorizerService<TransactionCSV>
{

    @Override
    public CategoryType categorize(TransactionCSV transaction)
    {
        return null;
    }

    @Override
    public boolean matches(TransactionCSV transaction, TransactionRule transactionRule) {
        return false;
    }
}
