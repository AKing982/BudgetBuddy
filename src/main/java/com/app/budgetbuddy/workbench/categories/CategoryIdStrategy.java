package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryType;
import com.app.budgetbuddy.domain.Transaction;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
@Qualifier("CategoryIdStrategy")
public class CategoryIdStrategy implements CategorizationStrategy
{

    @Override
    public CategoryType categorize(Transaction transaction)
    {
        return null;
    }
}
