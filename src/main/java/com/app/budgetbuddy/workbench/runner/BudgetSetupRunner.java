package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.workbench.budget.BudgetSetupEngine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    public void runBudgetSetup(final BudgetRegistration budgetRegistration)
    {
        if(budgetRegistration == null)
        {
            log.warn("Budget registration is null. Unable to run budget setup.");
            return;
        }

        log.info("Starting budget setup for user: {}", budgetRegistration.getUserId());
        int currentYear = budgetRegistration.getBudgetYear();
        Budget currentBudget = budgetSetupEngine.createNewBudget(budgetRegistration)
                .orElseThrow(() -> new RuntimeException("Failed to create current year budget"));

        int previousYear = currentBudget.getBudgetYear() - 1;
        log.info("Creating budget for previous year: {}", previousYear);
        Budget previousYearBudget = budgetSetupEngine.createPreviousYearBudget(previousYear, budget)

//        log.info("Starting budget setup for user: {}", budgetRegistration.getUserId());
//        try
//        {
//            // 1. Create the Budget for the current year
//            int currentYear = java.time.LocalDate.now().getYear();
//            log.info("Creating budget for current year: {}", currentYear);
//            Budget currentBudget = budgetSetupEngine.createNewBudget(budgetRegistration)
//                    .orElseThrow(() -> new RuntimeException("Failed to create current year budget"));
//
//            // 2. Next, create the Budget for the previous year
//            int previousYear = currentYear - 1;
//            log.info("Creating budget for previous year: {}", previousYear);
//            Budget previousBudget = budgetSetupEngine.createBudgetByYear(
//                            previousYear,
//                            budgetRegistration.getTotalIncomeAmount(),
//                            budgetRegistration.getBudgetName() + " - " + previousYear,
//                            budgetRegistration.getUserId())
//                    .orElseThrow(() -> new RuntimeException("Failed to create previous year budget"));
//
//            // 3. Create the Sub Budgets for the current year up to the current date
//            log.info("Creating sub-budgets for current year up to current date");
//            List<SubBudget> currentYearSubBudgets = budgetSetupEngine.createNewMonthlySubBudgetsForUser(
//                    currentBudget,
//                    budgetRegistration.getBudgetGoals());
//
//            if (currentYearSubBudgets.isEmpty()) {
//                log.warn("No sub-budgets created for current year");
//            } else {
//                log.info("Created {} sub-budgets for current year", currentYearSubBudgets.size());
//            }
//
//            // 4. Create the SubBudget templates for the previous year
//            log.info("Creating sub-budget templates for previous year");
//            List<SubBudget> previousYearSubBudgets = budgetSetupEngine.createSubBudgetTemplatesForYear(
//                    previousYear,
//                    previousBudget,
//                    budgetRegistration.getBudgetGoals());
//
//            if (previousYearSubBudgets.isEmpty()) {
//                log.warn("No sub-budget templates created for previous year");
//            } else {
//                log.info("Created {} sub-budget templates for previous year", previousYearSubBudgets.size());
//            }
//
//            // 5. Create the MonthlyBudgetGoals for the current year
//            log.info("Creating monthly budget goals for current year");
//            List<MonthlyBudgetGoals> currentYearMonthlyGoals = budgetSetupEngine.createMonthlyBudgetGoalsForSubBudgets(
//                    budgetRegistration.getBudgetGoals(),
//                    currentYearSubBudgets);
//
//            if (currentYearMonthlyGoals.isEmpty()) {
//                log.warn("No monthly budget goals created for current year");
//            } else {
//                log.info("Created {} monthly budget goals for current year", currentYearMonthlyGoals.size());
//            }
//
//            // 6. Create the MonthlyBudgetGoals for the past year
//            log.info("Creating monthly budget goals for previous year");
//            List<MonthlyBudgetGoals> previousYearMonthlyGoals = budgetSetupEngine.createMonthlyBudgetGoalsForSubBudgets(
//                    budgetRegistration.getBudgetGoals(),
//                    previousYearSubBudgets);
//
//            if (previousYearMonthlyGoals.isEmpty())
//            {
//                log.warn("No monthly budget goals created for previous year");
//            } else
//            {
//                log.info("Created {} monthly budget goals for previous year", previousYearMonthlyGoals.size());
//            }
//
//            log.info("Budget setup completed successfully for user: {}", budgetRegistration.getUserId());
//        } catch (Exception e)
//        {
//            log.error("Error during budget setup process: {}", e.getMessage(), e);
//        }
    }

}
