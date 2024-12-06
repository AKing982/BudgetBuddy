package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.ControlledBudgetCategory;
import com.app.budgetbuddy.entities.ControlledSpendingCategoryEntity;

import java.util.List;

public interface ControlledSpendingCategoriesService extends ServiceModel<ControlledSpendingCategoryEntity>
{
    ControlledSpendingCategoryEntity createAndSaveBudgetCategory(ControlledBudgetCategory budgetCategory);

    List<ControlledSpendingCategoryEntity> findByBudgetId(Long budgetId);
}
