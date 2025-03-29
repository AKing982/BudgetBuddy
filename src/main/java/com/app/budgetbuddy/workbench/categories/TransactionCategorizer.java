package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@Slf4j
public class TransactionCategorizer
{
    private Map<Integer, CategorizationStrategy> strategies = new HashMap<>();

    @Autowired
    public TransactionCategorizer(@Qualifier("CompleteDataStrategy") CategorizationStrategy completeDataStrategy,
                                  @Qualifier("WithoutTransactionDescriptionStrategy") CategorizationStrategy withoutTransactionDescriptionStrategy,
                                  @Qualifier("WithoutMerchantRulesStrategy") CategorizationStrategy withoutMerchantRulesStrategy,
                                  @Qualifier("WithoutCategoryDescriptionStrategy") CategorizationStrategy withoutCategoryDescriptionStrategy,
                                  @Qualifier("WithoutCategoryNamesStrategy") CategorizationStrategy withoutCategoryNamesStrategy,
                                  @Qualifier("CategoryIdStrategy") CategorizationStrategy categoryIdStrategy,
                                  @Qualifier("UserRuleStrategy") UserRuleStrategy userRuleStrategy)
    {
        strategies.put(1, completeDataStrategy);
        strategies.put(2, withoutTransactionDescriptionStrategy);
        strategies.put(3, withoutMerchantRulesStrategy);
        strategies.put(4, withoutCategoryDescriptionStrategy);
        strategies.put(5, withoutCategoryNamesStrategy);
        strategies.put(6, categoryIdStrategy);
        strategies.put(7, userRuleStrategy);
    }

    public CategorizationStrategy getUserRulesStrategy()
    {
        return strategies.get(7);
    }

    public CategoryType categorizeByPriority(final Transaction transaction, final int priority)
    {
        CategorizationStrategy strategy = strategies.get(priority);
        if (strategy != null) {
            return strategy.categorize(transaction);
        }
        return CategoryType.UNCATEGORIZED;
    }
}
