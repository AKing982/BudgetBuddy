package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BudgetGoals;
import com.app.budgetbuddy.domain.BudgetGoalsRequest;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;

import java.util.Optional;

public interface BudgetGoalsService extends ServiceModel<BudgetGoalsEntity>
{
    BudgetGoalsEntity createAndSaveBudgetGoal(BudgetGoalsRequest budgetGoalsRequest);

    Optional<BudgetGoalsEntity> findByBudgetId(Long budgetId);

    BudgetGoals convertToBudgetGoals(BudgetGoalsEntity budgetGoalsRequest);

    Optional<BudgetGoalsEntity> findByUserId(Long userId);

    Optional<BudgetGoalsEntity> convertToBudgetGoalsEntity(BudgetGoals budgetGoals);

    Optional<BudgetGoalsEntity> saveBudgetGoals(BudgetGoalsEntity budgetGoals);
}
