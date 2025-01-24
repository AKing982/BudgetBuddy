package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetScheduleEntity;
import com.app.budgetbuddy.exceptions.BudgetBuildException;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.services.BudgetScheduleService;
import com.app.budgetbuddy.services.BudgetService;
import com.app.budgetbuddy.services.ControlledSpendingCategoriesService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@Slf4j
public class BudgetBuilderService
{
    private final BudgetService budgetService;
    private final BudgetScheduleEngine budgetScheduleEngine;
    private final BudgetCalculations budgetCalculations;

    @Autowired
    public BudgetBuilderService(BudgetService budgetService,
                                BudgetScheduleEngine budgetScheduleEngine,
                                BudgetCalculations budgetCalculations)
    {
        this.budgetService = budgetService;
        this.budgetScheduleEngine = budgetScheduleEngine;
        this.budgetCalculations = budgetCalculations;
    }

    private void validateBudgetRegistration(final BudgetRegistration budgetRegistration)
    {
        try
        {
            Long userId = budgetRegistration.getUserId();
            String budgetName = budgetRegistration.getBudgetName();
            BudgetMode budgetType = budgetRegistration.getBudgetMode();
            Period budgetPeriod = budgetRegistration.getBudgetPeriod();
            BudgetGoals budgetGoals = budgetRegistration.getBudgetGoals();
            Set<DateRange> budgetDateRanges = budgetRegistration.getBudgetDateRanges();
            BigDecimal totalIncomeAmount = budgetRegistration.getTotalIncomeAmount();
            int totalMonths = budgetRegistration.getNumberOfMonths();
            int totalBudgetsNeeded = budgetRegistration.getTotalBudgetsNeeded();
            if(userId == null || budgetName == null || budgetType == null || budgetPeriod == null ||
                    budgetGoals == null || budgetDateRanges == null || totalIncomeAmount == null || totalMonths <= 0 || totalBudgetsNeeded <= 0)
            {
                throw new BudgetBuildException("Found Missing Budget Registration parameters");
            }

        }catch(BudgetBuildException e)
        {
            log.error("There was an error building the budget from the registration: ", e);
            log.warn("There was an error with the BudgetRegistration: {}", budgetRegistration.toString());
            throw e;
        }
    }

    public Optional<Budget> buildBudgetFromRegistration(final BudgetRegistration budgetRegistration)
    {
        if(budgetRegistration == null)
        {
            return Optional.empty();
        }
        validateBudgetRegistration(budgetRegistration);
        BigDecimal totalIncomeAmount = budgetRegistration.getTotalIncomeAmount();
        int totalMonths = budgetRegistration.getNumberOfMonths();
        int totalBudgetsNeeded = budgetRegistration.getTotalBudgetsNeeded();
        BudgetMode budgetMode = budgetRegistration.getBudgetMode();
        Period budgetPeriod = budgetRegistration.getBudgetPeriod();
        Set<DateRange> budgetDateRanges = budgetRegistration.getBudgetDateRanges();
        String budgetName = budgetRegistration.getBudgetName();
        Long userId = budgetRegistration.getUserId();
        BudgetGoals budgetGoals = budgetRegistration.getBudgetGoals();
        if(budgetPeriod == Period.MONTHLY && budgetMode == BudgetMode.SAVINGS_PLAN)
        {
            // Calculate the Budget Amount
            double monthlyAllocation = budgetGoals.getMonthlyAllocation();
            double targetAmount = budgetGoals.getTargetAmount();
            double currentSavings = budgetGoals.getCurrentSavings();
            // Based on target amount for savings, and given what the user wants to allocate every month and what their current savings are
            // determine how much needs to be allocated and deduct this from the totalIncomeAmount
            BigDecimal actualMonthlyAllocation = budgetCalculations.calculateActualMonthlyAllocation(monthlyAllocation, targetAmount, currentSavings, totalIncomeAmount, totalMonths);
            // Use the remaining amount after the savings has been deducted as the budget amount
            BigDecimal remainingOnBudgetAfterAllocation = totalIncomeAmount.subtract(actualMonthlyAllocation);

            // Next create the Budget Schedules

            // Create a Savings Goal data object

            //
        }
        // Depending on the period and budget mode and the budget goals, we need to calculate the budget amount

        return null;
    }

    public Optional<Budget> updateExistingBudget(final Budget budget, final Long existingBudgetId)
    {
        return null;
    }

    public void assignBudgetSchedulesToBudget(final List<BudgetSchedule> budgetSchedules, final Budget budget)
    {
        if(budgetSchedules == null || budget == null)
        {
            return;
        }
        budget.setBudgetSchedules(budgetSchedules);
    }

    public List<BudgetSchedule> createBudgetSchedules(final LocalDate monthStart, final LocalDate monthEnd, final Long userId, final Period period)
    {
        if(monthStart == null || monthEnd == null)
        {
            return Collections.emptyList();
        }
        List<BudgetSchedule> newBudgetSchedules = new ArrayList<>();
        try
        {
            if(userId < 1)
            {
                throw new InvalidUserIDException("Invalid UserId has been encountered: " + userId);
            }
            if(period == Period.MONTHLY)
            {
                Optional<BudgetSchedule> budgetScheduleOptional = budgetScheduleEngine.createMonthBudgetSchedule(userId, monthStart, monthEnd);
                if(budgetScheduleOptional.isPresent())
                {
                    BudgetSchedule monthBudgetSchedule = budgetScheduleOptional.get();
                    newBudgetSchedules.add(monthBudgetSchedule);
                }
            }
           return newBudgetSchedules;
        }catch(InvalidUserIDException e){
            log.error("There was an error creating the budget schedules with the invalid userId: ", e);
            return Collections.emptyList();
        }
    }

    public List<BudgetSchedule> createBudgetSchedulesFromExistingBudget(final Budget budget, LocalDate startDate, LocalDate endDate, Period period)
    {
        return null;
    }

    public List<Budget> createBudgetsForPeriod(Long userId, LocalDate startDate, LocalDate endDate, Period period)
    {
        return null;
    }

    public void assignBudgetsListToBudgetSchedules(final List<Budget> budgets, final List<BudgetSchedule> budgetSchedules)
    {
        if(budgets == null || budgetSchedules == null)
        {
            return;
        }
        List<BudgetSchedule> matchingBudgetSchedules = new ArrayList<>();
        for(Budget budget : budgets)
        {
            Long budgetId = budget.getId();
            for(BudgetSchedule budgetSchedule : budgetSchedules)
            {
                Long budgetIdFromSchedule = budgetSchedule.getBudgetId();
                if(budgetId.equals(budgetIdFromSchedule))
                {
                    matchingBudgetSchedules.add(budgetSchedule);
                }
            }
            assignBudgetSchedulesToBudget(matchingBudgetSchedules, budget);
        }
    }

    public void saveBudgetSchedules(final List<BudgetSchedule> budgetSchedules)
    {
        if(budgetSchedules == null)
        {
            return;
        }
        try
        {
            budgetScheduleEngine.saveOrUpdateBudgetSchedules(budgetSchedules, false);

        }catch(DataAccessException e)
        {
            log.error("There was an error saving the budget schedules to the database: ", e);
        }
    }

    public void saveBudget(Budget budget)
    {
        if(budget == null)
        {
            return;
        }

        try
        {
            budgetService.saveBudget(budget);
        }catch(DataAccessException e){
            log.error("There was an error saving the budget to the database: ", e);
        }
    }

}
