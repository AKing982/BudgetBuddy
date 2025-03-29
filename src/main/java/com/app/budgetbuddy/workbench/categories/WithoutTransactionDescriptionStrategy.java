package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryType;
import com.app.budgetbuddy.domain.Transaction;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

@Component
@Qualifier("WithoutTransactionDescriptionStrategy")
public class WithoutTransactionDescriptionStrategy implements CategorizationStrategy
{

    @Override
    public CategoryType categorize(Transaction transaction)
    {
        return null;
    }
}
