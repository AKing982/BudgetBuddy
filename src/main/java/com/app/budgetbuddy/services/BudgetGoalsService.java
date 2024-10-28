package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BudgetGoalsRequest;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;

import java.util.Optional;

public interface BudgetGoalsService extends ServiceModel<BudgetGoalsEntity>
{
    BudgetGoalsEntity createAndSaveBudgetGoal(BudgetGoalsRequest budgetGoalsRequest);

    Optional<BudgetGoalsEntity> findByBudgetId(Long budgetId);
}
