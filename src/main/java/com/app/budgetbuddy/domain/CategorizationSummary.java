package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategorizationSummary
{
    private int totalTransactions;
    private int totalRecurringTransactions;
    private int totalCategories;
    private int totalUncategorized;

    public CategorizationSummary(int totalTransactions, int totalRecurringTransactions, int totalCategories, int totalUncategorized) {
        this.totalTransactions = totalTransactions;
        this.totalRecurringTransactions = totalRecurringTransactions;
        this.totalCategories = totalCategories;
        this.totalUncategorized = totalUncategorized;
    }
}
