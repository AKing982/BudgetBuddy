package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.BudgetBuildException;
import com.app.budgetbuddy.services.BudgetScheduleService;
import com.app.budgetbuddy.services.BudgetService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class BudgetBuilderService
{
    private final BudgetService budgetService;
    private final BudgetScheduleEngine budgetScheduleEngine;

    @Autowired
    public BudgetBuilderService(BudgetService budgetService,
                                BudgetScheduleEngine budgetScheduleEngine)
    {
        this.budgetService = budgetService;
        this.budgetScheduleEngine = budgetScheduleEngine;
    }

    private void validateBudgetRegistration(BudgetRegistration budgetRegistration)
    {
        try
        {
            Long userId = budgetRegistration.getUserId();
            String budgetName = budgetRegistration.getBudgetName();
            String budgetType = budgetRegistration.getBudgetType();
            Period budgetPeriod = budgetRegistration.getBudgetPeriod();
            BudgetGoals budgetGoals = budgetRegistration.getBudgetGoals();
            LocalDate budgetStartDate = budgetRegistration.getBudgetStartDate();
            LocalDate budgetEndDate = budgetRegistration.getBudgetEndDate();
            BigDecimal budgetedAmount = budgetRegistration.getBudgetedAmount();
            BigDecimal totalIncomeAmount = budgetRegistration.getTotalIncomeAmount();
            int totalMonths = budgetRegistration.getNumberOfMonths();

        }catch(BudgetBuildException e){
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
