package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.workbench.budget.BudgetSetupEngine;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Transient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Slf4j
public class BudgetSetupRunner
{
    private final BudgetSetupEngine budgetSetupEngine;
    private final BudgetGoalsService budgetGoalsService;

    @PersistenceContext
    private final EntityManager entityManager;

    @Autowired
    public BudgetSetupRunner(BudgetSetupEngine budgetSetupEngine,
                             BudgetGoalsService budgetGoalsService,
                             EntityManager entityManager)
    {
        this.budgetSetupEngine = budgetSetupEngine;
        this.budgetGoalsService = budgetGoalsService;
        this.entityManager = entityManager;
    }

    @Transactional
    public boolean runBudgetSetup(final BudgetRegistration budgetRegistration)
    {
        if(budgetRegistration == null)
        {
            log.warn("Budget registration is null. Unable to run budget setup.");
            return false;
        }
        log.info("Budget Registration: {}", budgetRegistration.toString());
        log.info("Starting budget setup for user: {}", budgetRegistration.getUserId());
        int currentYear = budgetRegistration.getBudgetYear();
        try
        {
            Budget currentBudget = budgetSetupEngine.createNewBudget(budgetRegistration)
                    .orElseThrow(() -> new RuntimeException("Failed to create current year budget"));

            Long currentBudgetId = currentBudget.getId();
            if(currentBudgetId == null){
                log.error("Current budget ID is null after creation");
                return false;
            }
            int previousYear = currentBudget.getBudgetYear() - 1;
            log.info("Creating budget for previous year: {}", previousYear);
            BigDecimal previousYearIncome = budgetRegistration.getPreviousIncomeAmount();
            log.info("Previous Year Income: {}", previousYearIncome);
            String previousYearBudgetName = budgetRegistration.getPreviousBudgetName();
            log.info("Previous Year Budget Name: {}", previousYearBudgetName);
            Budget previousYearBudget = budgetSetupEngine.createPreviousYearBudget(previousYearIncome, previousYearBudgetName, currentBudget)
                    .orElseThrow(() -> new RuntimeException("Failed to create previous year budget"));
            log.info("Previous Year Budget: {}", previousYearBudget.toString());

            log.info("Creating sub-Budgets for current year up to current date");
            List<SubBudget> currentYearSubBudgets = budgetSetupEngine.createNewMonthlySubBudgetsForUser(currentBudget, budgetRegistration.getBudgetGoals());

            log.info("Creating sub-budget templates for previous year {}", previousYear);
            List<SubBudget> previousYearSubBudgets = budgetSetupEngine.createSubBudgetTemplatesForYear(previousYear, previousYearBudget, budgetRegistration.getBudgetGoals());

            // Fix: Fetch the saved BudgetGoalsEntity instead of using registration
            BudgetGoalsEntity savedGoalsEntity = budgetGoalsService.findByBudgetId(currentBudgetId)
                    .orElseThrow(() -> new RuntimeException("No BudgetGoalsEntity found for budget ID: " + currentBudget.getId()));
            BudgetGoals budgetGoals = budgetGoalsService.convertToBudgetGoals(savedGoalsEntity); // Assuming a conversion method exists

            log.info("Creating Monthly Sub Budget goals for current year {}", currentYear);
            log.info("User Budget Goals: {}", budgetGoals.toString());
            List<MonthlyBudgetGoals> currentYearMonthlyBudgetGoals = budgetSetupEngine.createMonthlyBudgetGoalsForSubBudgets(budgetGoals, currentYearSubBudgets);
            budgetSetupEngine.saveMonthlyBudgetGoals(currentYearMonthlyBudgetGoals);

            BudgetGoalsEntity previousYearBudgetGoals = budgetGoalsService.findByBudgetId(previousYearBudget.getId())
                            .orElseThrow(() -> new RuntimeException("No BudgetGoalsEntity found for budget ID: " + previousYearBudget.getId()));
            BudgetGoals previousYearBudgetGoal = budgetGoalsService.convertToBudgetGoals(previousYearBudgetGoals);
            log.info("Creating Monthly Sub Budget goals for previous year {}", previousYear);
            List<MonthlyBudgetGoals> previousYearMonthlyBudgetGoals = budgetSetupEngine.createMonthlyBudgetGoalsForSubBudgets(previousYearBudgetGoal, previousYearSubBudgets);
            budgetSetupEngine.saveMonthlyBudgetGoals(previousYearMonthlyBudgetGoals);
            return true;
        }catch(Exception e)
        {
            log.error("Error during budget setup process: {}", e.getMessage(), e);
            return false;
        }
    }

}
