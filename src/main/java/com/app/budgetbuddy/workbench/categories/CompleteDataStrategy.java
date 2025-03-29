package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryType;
import com.app.budgetbuddy.domain.Transaction;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
@Qualifier("CompleteDataStrategy")
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class CompleteDataStrategy implements CategorizationStrategy
{

    @Override
    public CategoryType categorize(Transaction transaction) {
        return null;
    }
}
