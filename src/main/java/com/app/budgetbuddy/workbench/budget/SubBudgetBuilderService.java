package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.services.SubBudgetService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

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
        if(startDate.isAfter(budgetStartDate) && endDate.isBefore(budgetEndDate))
        {
            // 1. Determine the Allocated (Budgeted) amount for the sub budget
            double monthlyAllocation = budgetGoals.getMonthlyAllocation();
            double currentSavings = budgetGoals.getCurrentSavings();
            int totalMonthsToSave = budget.getTotalMonthsToSave();
            double targetAmount = budgetGoals.getTargetAmount();
            BigDecimal totalSubBudgetAmount = budgetCalculations.calculateTotalBudgetForSubBudget(budget, monthlyAllocation, totalMonthsToSave);
            BigDecimal allocatedAmountNeeded = budgetCalculations.calculateActualMonthlyAllocation(monthlyAllocation, targetAmount, currentSavings, totalIncome, totalMonthsToSave);

            // 2. Determine the Subsavings target for the sub budget
            BigDecimal subBudgetSavingsTarget = getTotalSubBudgetSavingsTarget(targetAmount, totalMonthsToSave, currentSavings, monthlyAllocation);

            // 3. Determine the SubSavings amount that's been put into the sub budget

            // 4. Determine what's been spent on the sub budget

            // 5. Build the Budget Schedules for the sub budget

            // 6. Build the Sub Budget

            // 7. Return the Sub Budget
        }
        return null;
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

    public List<SubBudgetEntity> saveSubBudgets(final List<SubBudget> subBudgets)
    {
        return null;
    }

    public List<BudgetSchedule> createMonthlyBudgetSchedule(final LocalDate monthStart, final LocalDate monthEnd, final Long userId)
    {
        return null;
    }

//    private List<BudgetSchedule> getBudgetSchedulesByBudgetStartAndEndDates(final List<DateRange> budgetDateRanges, final Long userId, final Period period)
//    {
//        List<BudgetSchedule> budgetSchedules = new ArrayList<>();
//        for(DateRange dateRange : budgetDateRanges)
//        {
//            LocalDate budgetStartDate = dateRange.getStartDate();
//            LocalDate budgetEndDate = dateRange.getEndDate();
//            List<BudgetSchedule> newSchedules = createBudgetSchedules(budgetStartDate, budgetEndDate, userId, period);
//            budgetSchedules.addAll(newSchedules);
//        }
//        return budgetSchedules;
//    }

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
