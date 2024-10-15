package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BudgetCategoriesRequest;
import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.entities.BudgetCategoriesEntity;

public interface BudgetCategoriesService extends ServiceModel<BudgetCategoriesEntity>
{
    BudgetCategoriesEntity createAndSaveBudgetCategory(BudgetCategory budgetCategory);
}
