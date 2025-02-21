package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetGoals;
import com.app.budgetbuddy.domain.Period;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.entities.SubBudgetGoalsEntity;
import com.app.budgetbuddy.services.BudgetGoalsService;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Optional;

@Slf4j
public abstract class BudgetGoalsBuilder<T>
{
    private final BudgetGoalsService budgetGoalsService;

    public BudgetGoalsBuilder(BudgetGoalsService budgetGoalsService)
    {
        this.budgetGoalsService = budgetGoalsService;
    }

    public Optional<BudgetGoalsEntity> getBudgetGoalsById(Long id)
    {
        try
        {
            return budgetGoalsService.findById(id);
        }catch(Exception e)
        {
            log.error("There was an error retrieving the Budget Goals with id {}", id, e);
            return Optional.empty();
        }
    }

    abstract Optional<T> createBudgetGoal(final BudgetGoals budgetGoals, final Long subBudgetId);

    public abstract List<SubBudgetGoalsEntity> saveBudgetGoals(List<T> budgetGoals);
}
