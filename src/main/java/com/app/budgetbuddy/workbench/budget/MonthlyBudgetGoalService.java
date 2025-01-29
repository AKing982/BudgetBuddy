package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.services.BudgetGoalsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MonthlyBudgetGoalService implements BudgetGoalsBuilderService
{
    private final BudgetGoalsService budgetGoalsService;

    @Autowired
    public MonthlyBudgetGoalService(BudgetGoalsService budgetGoalsService)
    {
        this.budgetGoalsService = budgetGoalsService;
    }
}
