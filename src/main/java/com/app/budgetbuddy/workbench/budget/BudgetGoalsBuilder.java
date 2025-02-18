package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetGoals;
import com.app.budgetbuddy.domain.Period;

import java.util.Optional;

public interface BudgetGoalsBuilder<T>
{
    Optional<T> createBudgetGoal(final BudgetGoals budgetGoals);
}
