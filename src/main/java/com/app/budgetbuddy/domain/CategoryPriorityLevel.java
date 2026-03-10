package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.Setter;

@Getter
public enum CategoryPriorityLevel
{
    LEVEL_0(0),
    LEVEL_1(1),   // Essential Housing - Rent, Mortgage
    LEVEL_2(2),   // Essential Utilities - Gas, Electric, Water
    LEVEL_3(3),   // Essential Living - Groceries, Insurance, Transportation
    LEVEL_4(4),   // Variable - Subscriptions, Dining, Entertainment
    LEVEL_5(5);   // Discretionary - Everything else

    private final int order;

    CategoryPriorityLevel(int order) {
        this.order = order;
    }

    public static CategoryPriorityLevel findByOrder(int order)
    {
        for(CategoryPriorityLevel level : CategoryPriorityLevel.values())
        {
            if(level.getOrder() == order)
            {
                return level;
            }
        }
        throw new IllegalArgumentException("No matching CategoryPriorityLevel for input: " + order);
    }
}
