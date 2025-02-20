package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.workbench.budget.BudgetSetupEngine;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BudgetSetupRunner
{
    private BudgetSetupEngine budgetSetupEngine;

    @Autowired
    public BudgetSetupRunner(BudgetSetupEngine budgetSetupEngine)
    {
        this.budgetSetupEngine = budgetSetupEngine;
    }

    public void runBudgetSetupInitialization(final BudgetRegistration budgetRegistration)
    {

    }


    /**
     * Need a method that builds the budget for the current year
     */
    public void createCurrentBudget(BudgetRegistration budgetRegistration)
    {

    }

    /**
     * Need a method that builds the budget for a particular year
     */
    public void createBudgetForYear(int year, Long userId)
    {

    }

    /**
     * Need a method that builds the subBudgets for a particular year
     */
    public void createSubBudgetsForYear(int year, Budget budget)
    {

    }

    /**
     * Need a method that builds the subBudgets for the current year
     */
    public void createSubBudgetsForCurrentYear(final Budget budget)
    {

    }

    /**
     * Need a method that builds the monthly budget goals for the past year subBudgets
     */
    public void createMonthlyBudgetGoalsForYear(final int year, final Budget budget)
    {

    }

    /**
     * Need a method that builds the monthly budget goals for the current year
     */
    public void createMonthlyBudgetGoalsForCurrentYear(final Budget budget)
    {

    }

    public void createBudgetStatsForYear(final int year, final List<SubBudget> subBudgets)
    {

    }

    public void createBudgetStatsForCurrentYear(final List<SubBudget> subBudgets)
    {

    }

}
