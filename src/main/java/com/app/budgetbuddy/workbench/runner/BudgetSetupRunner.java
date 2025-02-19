package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.workbench.budget.BudgetSetupEngine;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class BudgetSetupRunner
{
    private BudgetSetupEngine budgetSetupEngine;

    @Autowired
    public BudgetSetupRunner(BudgetSetupEngine budgetSetupEngine)
    {
        this.budgetSetupEngine = budgetSetupEngine;
    }

    public void createBudget(BudgetRegistration budgetRegistration)
    {

    }

    public void createPreviousYearBudget()

    public void createSubBudgetsForPreviousYear()

    public List<SubBudget> createPreviousYearSubBudgets(BudgetRegistration budgetRegistration, LocalDate currentDate) {
        return null;
    }

    public Optional<SubBudget> createSubBudgetForCurrentPeriod(BudgetRegistration budgetRegistration, LocalDate currentDate) {
        return null;
    }

    public List<MonthlyBudgetGoals> createMonthlyBudgetGoalsForPreviousBudgetYear(BudgetRegistration budgetRegistration, LocalDate currentDate)
    {
        return null;
    }

    public Optional<MonthlyBudgetGoals> createMonthlyBudgetGoalForSubBudget(SubBudget subBudget, BudgetGoals budgetGoals)
    {
        return null;
    }

    public Optional<BudgetStats> createBudgetStatsForSubBudget(SubBudget subBudget)
    {
        return null;
    }

    public List<BudgetStats> createBudgetStatsForSubBudgets



}
