package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;

public interface CSVCategorizationStrategy
{
    boolean supports(String institution);
    Category categorize(String merchantNameUpper, String transactionCategory, double absAmount);
}
