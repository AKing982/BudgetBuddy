package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.BudgetBuildException;
import com.app.budgetbuddy.workbench.subBudget.SubBudgetBuilderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Component
@Slf4j
public class BudgetSetupEngine
{
    private final BudgetBuilderService budgetBuilderService;
    private final SubBudgetBuilderService subBudgetBuilderService;
    private final MonthlyBudgetGoalsBuilder monthlyBudgetGoalsBuilder;

    @Autowired
    public BudgetSetupEngine(BudgetBuilderService budgetBuilderService,
                             SubBudgetBuilderService subBudgetBuilderService,
                             MonthlyBudgetGoalsBuilder monthlyBudgetGoalsBuilder)
    {
        this.budgetBuilderService = budgetBuilderService;
        this.subBudgetBuilderService = subBudgetBuilderService;
        this.monthlyBudgetGoalsBuilder = monthlyBudgetGoalsBuilder;
    }


    public Optional<Budget> createBudgetByYear(final int year, final BigDecimal incomeAmount, final String budgetName, final Long userId)
    {
        return null;
    }

    public Optional<Budget> createNewBudget(final BudgetRegistration budgetRegistration)
    {
        if(budgetRegistration == null)
        {
            log.warn("Missing Budget Registration... Returning empty budget");
            return Optional.empty();
        }
        try
        {
            return budgetBuilderService.buildBudgetFromRegistration(budgetRegistration);

        }catch(BudgetBuildException e)
        {
            log.error("There was an error building the budget from the registration: ", e);
            return Optional.empty();
        }
    }

    /**
     * This will create Monthly Budget Goals for previous subBudgets (e.g. months) up to the current date
     * @param budgetGoals
     * @param subBudgets
     * @return
     */
    public List<MonthlyBudgetGoals> createMonthlyBudgetGoalsForSubBudgets(final BudgetGoals budgetGoals, final List<SubBudget> subBudgets)
    {
        if(budgetGoals == null || subBudgets == null || subBudgets.isEmpty())
        {
            return Collections.emptyList();
        }
        List<MonthlyBudgetGoals> monthlyBudgetGoals = new ArrayList<>();
        for(SubBudget subBudget : subBudgets)
        {
            Long subBudgetId = subBudget.getId();
            Optional<MonthlyBudgetGoals> monthlyBudgetGoalsOptional = monthlyBudgetGoalsBuilder.createBudgetGoal(budgetGoals, subBudgetId);
            if(monthlyBudgetGoalsOptional.isEmpty())
            {
                return Collections.emptyList();
            }
            MonthlyBudgetGoals monthlyBudgetGoal = monthlyBudgetGoalsOptional.get();
            monthlyBudgetGoals.add(monthlyBudgetGoal);
        }
        return monthlyBudgetGoals;
    }

    public List<SubBudget> createSubBudgetTemplatesForYear(int year, Budget budget, BudgetGoals budgetGoals)
    {
        if(year < 1 || budgetGoals == null || budget == null)
        {
            return Collections.emptyList();
        }
        try
        {
            return subBudgetBuilderService.createSubBudgetTemplates(year, budget, budgetGoals);
        }catch(BudgetBuildException e)
        {
            log.error("There was an error building the subBudget templates: ", e);
            return Collections.emptyList();
        }
    }

    /**
     * This will create the SubBudgets for a particular budget up to the current date
     * @param budget
     * @param budgetGoals
     * @return
     */
    public List<SubBudget> createNewMonthlySubBudgetsForUser(final Budget budget, final BudgetGoals budgetGoals)
    {
        if(budget == null)
        {
            log.warn("Missing Budget... return empty subBudgets");
            return Collections.emptyList();
        }
        try
        {
            return subBudgetBuilderService.createMonthlySubBudgets(budget, budgetGoals);
        }catch(BudgetBuildException e)
        {
            log.error("There was an error build the monthly subbudgets from the budget: ", e);
            return Collections.emptyList();
        }
    }

}
