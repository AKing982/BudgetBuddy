package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.BudgetBuildException;
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

            // Calculate the Savings Goal data

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

    public Map<Long, List<BudgetSchedule>> createBudgetSchedulesGroupByPeriod(final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        return null;
    }

    public void assignBudgetSchedulesToBudget(final List<BudgetSchedule> budgetSchedules, final Budget budget)
    {

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

    }

    public void saveBudgetSchedules(List<BudgetSchedule> budgetSchedules)
    {

    }

    public void saveBudget(Budget budget)
    {

    }

}
