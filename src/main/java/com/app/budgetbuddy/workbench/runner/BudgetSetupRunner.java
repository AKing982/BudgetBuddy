package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.workbench.budget.BudgetSetupEngine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Slf4j
public class BudgetSetupRunner
{
    private final BudgetSetupEngine budgetSetupEngine;

    @Autowired
    public BudgetSetupRunner(BudgetSetupEngine budgetSetupEngine)
    {
        this.budgetSetupEngine = budgetSetupEngine;
    }

    public boolean runBudgetSetup(final BudgetRegistration budgetRegistration)
    {
        if(budgetRegistration == null)
        {
            log.warn("Budget registration is null. Unable to run budget setup.");
            return false;
        }

        log.info("Starting budget setup for user: {}", budgetRegistration.getUserId());
        int currentYear = budgetRegistration.getBudgetYear();
        try
        {
            Budget currentBudget = budgetSetupEngine.createNewBudget(budgetRegistration)
                    .orElseThrow(() -> new RuntimeException("Failed to create current year budget"));

            int previousYear = currentBudget.getBudgetYear() - 1;
            log.info("Creating budget for previous year: {}", previousYear);
            BigDecimal previousYearIncome = budgetRegistration.getPreviousIncomeAmount();
            String previousYearBudgetName = budgetRegistration.getPreviousBudgetName();
            Budget previousYearBudget = budgetSetupEngine.createPreviousYearBudget(previousYearIncome, previousYearBudgetName, currentBudget)
                    .orElseThrow(() -> new RuntimeException("Failed to create previous year budget"));

            log.info("Creating sub-Budgets for current year up to current date");
            List<SubBudget> currentYearSubBudgets = budgetSetupEngine.createNewMonthlySubBudgetsForUser(currentBudget, budgetRegistration.getBudgetGoals());

            log.info("Creating sub-budget templates for previous year {}", previousYear);
            List<SubBudget> previousYearSubBudgets = budgetSetupEngine.createSubBudgetTemplatesForYear(previousYear, previousYearBudget, budgetRegistration.getBudgetGoals());

            log.info("Creating Monthly Sub Budget goals for current year {}", currentYear);
            BudgetGoals budgetGoals = budgetRegistration.getBudgetGoals();
            List<MonthlyBudgetGoals> currentYearMonthlyBudgetGoals = budgetSetupEngine.createMonthlyBudgetGoalsForSubBudgets(budgetGoals, currentYearSubBudgets);
            budgetSetupEngine.saveMonthlyBudgetGoals(currentYearMonthlyBudgetGoals);
            log.info("Creating Monthly Sub Budget goals for previous year {}", previousYear);
            List<MonthlyBudgetGoals> previousYearMonthlyBudgetGoals = budgetSetupEngine.createMonthlyBudgetGoalsForSubBudgets(budgetGoals, previousYearSubBudgets);
            budgetSetupEngine.saveMonthlyBudgetGoals(previousYearMonthlyBudgetGoals);
            return true;
        }catch(Exception e)
        {
            log.error("Error during budget setup process: {}", e.getMessage(), e);
            return false;
        }
    }

}
