package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.SubBudgetGoals;
import com.app.budgetbuddy.entities.SubBudgetGoalsEntity;

import java.util.List;
import java.util.Optional;

public interface SubBudgetGoalsService extends ServiceModel<SubBudgetGoalsEntity>
{
    SubBudgetGoals getSubBudgetGoalsEntitiesBySubBudgetId(Long subBudgetId);
}
