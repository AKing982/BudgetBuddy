package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetGoals;
import com.app.budgetbuddy.domain.MonthlyBudgetGoals;
import com.app.budgetbuddy.domain.Period;
import com.app.budgetbuddy.services.SubBudgetGoalsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@Slf4j
public class MonthlyBudgetGoalsBuilder implements BudgetGoalsBuilder<MonthlyBudgetGoals>
{
    private final SubBudgetGoalsService monthlyBudgetGoalsService;

    @Autowired
    public MonthlyBudgetGoalsBuilder(SubBudgetGoalsService subBudgetGoalsService)
    {
        this.monthlyBudgetGoalsService = subBudgetGoalsService;
    }

    @Override
    public Optional<MonthlyBudgetGoals> createBudgetGoal(final BudgetGoals budgetGoals)
    {
        return Optional.empty();
    }
}
