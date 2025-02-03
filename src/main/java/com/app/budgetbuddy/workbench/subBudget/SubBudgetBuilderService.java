package com.app.budgetbuddy.workbench.subBudget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.services.SubBudgetService;
import com.app.budgetbuddy.workbench.budget.BudgetCalculations;
import com.app.budgetbuddy.workbench.budget.BudgetScheduleEngine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import static com.app.budgetbuddy.domain.SubBudget.buildSubBudget;

@Component
@Slf4j
public class SubBudgetBuilderService
{
    private final SubBudgetService subBudgetService;
    private final BudgetCalculations budgetCalculations;
    private final BudgetScheduleEngine budgetScheduleEngine;

    @Autowired
    public SubBudgetBuilderService(SubBudgetService subBudgetService,
                                   BudgetCalculations budgetCalculations,
                                   BudgetScheduleEngine budgetScheduleEngine)
    {
        this.subBudgetService = subBudgetService;
        this.budgetCalculations = budgetCalculations;
        this.budgetScheduleEngine = budgetScheduleEngine;
    }

    public Optional<SubBudget> createNewMonthSubBudget(final Budget budget, final LocalDate startDate, final LocalDate endDate, final BigDecimal totalIncome, final BudgetGoals budgetGoals)
    {
        if(budget == null || totalIncome == null || startDate == null || endDate == null || budgetGoals == null)
        {
            return Optional.empty();
        }
        // Is the start and end dates within the budget start date and end date?
        LocalDate budgetStartDate = budget.getStartDate();
        LocalDate budgetEndDate = budget.getEndDate();
        if(!startDate.isBefore(budgetStartDate) && !endDate.isAfter(budgetEndDate))
        {
            // 1. Determine the Allocated (Budgeted) amount for the sub budget
            double monthlyAllocation = budgetGoals.getMonthlyAllocation();
            double currentSavings = budgetGoals.getCurrentSavings();
            int totalMonthsToSave = budget.getTotalMonthsToSave();
            double targetAmount = budgetGoals.getTargetAmount();
            String monthName = startDate.getMonth().name();
            String firstMonthChar = monthName.substring(0, 1).toUpperCase(Locale.ENGLISH).toUpperCase();
            String subBudgetName = firstMonthChar + monthName.substring(1).toLowerCase(Locale.ROOT) + " " + "Budget";
            BigDecimal totalSubBudgetAmount = budgetCalculations.calculateTotalBudgetForSubBudget(budget, monthlyAllocation, totalMonthsToSave);
            BigDecimal allocatedAmountNeeded = budgetCalculations.calculateActualMonthlyAllocation(monthlyAllocation, targetAmount, currentSavings, totalIncome, totalMonthsToSave);

            // 2. Determine the Subsavings target for the sub budget
            BigDecimal subBudgetSavingsTarget = getTotalSubBudgetSavingsTarget(targetAmount, totalMonthsToSave, currentSavings, monthlyAllocation);

            // 3. Determine the SubSavings amount that's been put into the sub budget
            BigDecimal totalSavingsInSubBudget = BigDecimal.ZERO;
            BigDecimal totalSubBudgetSpending = BigDecimal.ZERO;

            // 4. Determine what's been spent on the sub budget
            // 5. Build the Budget Schedules for the sub budget
            SubBudget subBudget = buildSubBudget(true, totalSubBudgetAmount, subBudgetSavingsTarget, allocatedAmountNeeded, budget, totalSubBudgetSpending, subBudgetName, startDate, endDate);
            Optional<BudgetSchedule> budgetSchedules = budgetScheduleEngine.createMonthSubBudgetSchedule(subBudget);
            subBudget.setBudgetSchedule(List.of(budgetSchedules.get()));
            saveSingleSubBudget(subBudget);
            return Optional.of(subBudget);
        }
        return Optional.empty();
    }

    private BigDecimal getTotalSubBudgetSavingsTarget(double targetAmount, int monthsToSave, double currentSavings, double monthlyAllocated)
    {
        return budgetCalculations.calculateMonthlySubBudgetSavingsTargetAmount(targetAmount, monthsToSave, currentSavings, monthlyAllocated);
    }

    public List<SubBudget> createSubBudgetsByPeriod(final Budget budget, final Period period, final LocalDate startDate, final LocalDate endDate)
    {
        return null;
    }

    public Optional<SubBudget> createSingleSubBudget(final Budget budget, LocalDate startDate, LocalDate endDate)
    {
        return null;
    }

    public List<SubBudget> createMonthlySubBudgets(final Budget budget, final MonthlyBudgetGoals monthlyBudgetGoals)
    {
        return null;
    }

    public void saveSubBudgets(final List<SubBudget> subBudgets)
    {
        for(SubBudget subBudget : subBudgets)
        {
            saveSingleSubBudget(subBudget);
        }
    }

    public void saveSingleSubBudget(final SubBudget subBudget)
    {
        if(subBudget == null)
        {
            return;
        }
        try
        {
            subBudgetService.saveSubBudget(subBudget);
        }catch(DataAccessException e)
        {
            log.error("There was an error saving single sub budget: ", e);
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



}
