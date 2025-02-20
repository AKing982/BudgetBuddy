package com.app.budgetbuddy.workbench.subBudget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BudgetRepository;
import com.app.budgetbuddy.services.BudgetService;
import com.app.budgetbuddy.services.SubBudgetService;
import com.app.budgetbuddy.workbench.budget.BudgetCalculations;
import com.app.budgetbuddy.workbench.budget.BudgetScheduleEngine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

import static com.app.budgetbuddy.domain.SubBudget.buildSubBudget;

@Component
@Slf4j
public class SubBudgetBuilderService
{
    private final SubBudgetService subBudgetService;
    private final BudgetCalculations budgetCalculations;
    private final BudgetScheduleEngine budgetScheduleEngine;
    private final BudgetService budgetService;

    @Autowired
    public SubBudgetBuilderService(SubBudgetService subBudgetService,
                                   BudgetCalculations budgetCalculations,
                                   BudgetScheduleEngine budgetScheduleEngine,
                                   BudgetService budgetService)
    {
        this.subBudgetService = subBudgetService;
        this.budgetCalculations = budgetCalculations;
        this.budgetScheduleEngine = budgetScheduleEngine;
        this.budgetService = budgetService;
    }

    public List<SubBudget> createSubBudgetTemplates(int year, final Budget budget, final BudgetGoals budgetGoals)
    {
        if(year < 0 || budgetGoals == null)
        {
            return Collections.emptyList();
        }

        int budgetYear = budget.getBudgetYear();
        if(year != budgetYear)
        {
            return Collections.emptyList();
        }
        BigDecimal budgetGoalsTargetAmount = BigDecimal.valueOf(budgetGoals.getTargetAmount());
        BigDecimal monthlyAllocation = budget.getBudgetAmount().divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
        BigDecimal monthlySavingsTarget = budgetGoalsTargetAmount.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
        List<SubBudget> subBudgets = new ArrayList<>();
        for(int month = 1; month <= 12; month++)
        {
            LocalDate startDate = LocalDate.of(year, month, 1);
            LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

            SubBudget subBudget = SubBudget.buildSubBudget(
                    true,  // isActive
                    monthlyAllocation,  // allocatedAmount
                    monthlySavingsTarget,  // savingsTarget
                    BigDecimal.ZERO,  // savingsAmount
                    budget,  // budget
                    BigDecimal.ZERO,  // spentOnBudget
                    year + "-" + String.format("%02d", month) + " Budget",  // budgetName
                    startDate,
                    endDate
            );

            subBudget.setYear(year);
            subBudgets.add(subBudget);
        }

        return subBudgets;
    }

    public Optional<SubBudget> createNewMonthSubBudget(final Budget budget, final LocalDate startDate, final LocalDate endDate, final BigDecimal monthlyIncome, final BudgetGoals budgetGoals)
    {
        if(budget == null || monthlyIncome == null || startDate == null || endDate == null || budgetGoals == null)
        {
            return Optional.empty();
        }
        // Is the start and end dates within the budget start date and end date?
        LocalDate budgetStartDate = budget.getStartDate();
        LocalDate budgetEndDate = budget.getEndDate();
        DateRange subBudgetDateRange = new DateRange(startDate, endDate);
        Long budgetId = budget.getId();
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
            BigDecimal allocatedAmountNeeded = budgetCalculations.calculateActualMonthlyAllocation(monthlyAllocation, targetAmount, currentSavings, monthlyIncome, totalMonthsToSave);

            // 2. Determine the Subsavings target for the sub budget
            BigDecimal subBudgetSavingsTarget = getTotalSubBudgetSavingsTarget(targetAmount, totalMonthsToSave, currentSavings, monthlyAllocation);

            // 3. Determine the SubSavings amount that's been put into the sub budget
            BigDecimal totalSavingsInSubBudget = budgetCalculations.calculateSubBudgetSavings(subBudgetDateRange, budgetId);
            BigDecimal totalSubBudgetSpending = budgetCalculations.calculateSubBudgetSpending(subBudgetDateRange, budgetId);

            // 4. Determine what's been spent on the sub budget
            // 5. Build the Budget Schedules for the sub budget
            SubBudget subBudget = buildSubBudget(true, totalSubBudgetAmount, subBudgetSavingsTarget, totalSavingsInSubBudget, budget, totalSubBudgetSpending, subBudgetName, startDate, endDate);
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

    public List<SubBudget> createMonthlySubBudgets(final Budget budget, final BudgetGoals budgetGoals)
    {
        List<SubBudget> monthlySubBudgets = new ArrayList<>();
        if(budget == null || budgetGoals == null)
        {
            log.warn("Missing budget found");
            return Collections.emptyList();
        }
        LocalDate budgetStartDate = budget.getStartDate();
        LocalDate budgetEndDate = budget.getEndDate();
        DateRange budgetDateRange = new DateRange(budgetStartDate, budgetEndDate);
        List<DateRange> monthlyBudgetDates = budgetDateRange.splitIntoMonths();
        BigDecimal incomeAmount = budget.getIncome();
        try
        {
            for(DateRange budgetMonth : monthlyBudgetDates)
            {
                LocalDate monthStart = budgetMonth.getStartDate();
                LocalDate monthEnd = budgetMonth.getEndDate();
                Optional<SubBudget> monthSubBudget = createNewMonthSubBudget(budget, monthStart, monthEnd, incomeAmount, budgetGoals);
                if(monthSubBudget.isEmpty())
                {
                    throw new RuntimeException("Month Sub budget for: " + monthStart + " - " + monthEnd + " not found");
                }
                SubBudget subBudget = monthSubBudget.get();
                monthlySubBudgets.add(subBudget);
            }
            return monthlySubBudgets;
        }catch(RuntimeException e)
        {
            log.error("There was an error building the monthly sub budget: ", e);
            return Collections.emptyList();
        }
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
