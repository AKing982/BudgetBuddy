package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BudgetCategoriesRequest;
import com.app.budgetbuddy.domain.ControlledBudgetCategory;
import com.app.budgetbuddy.entities.BudgetCategoriesEntity;

import java.util.List;
import java.util.Optional;

public interface BudgetCategoriesService extends ServiceModel<BudgetCategoriesEntity>
{
    BudgetCategoriesEntity createAndSaveBudgetCategory(ControlledBudgetCategory budgetCategory);

    List<BudgetCategoriesEntity> findByBudgetId(Long budgetId);
}
