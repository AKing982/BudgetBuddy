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
    private final BudgetScheduleEngine budgetScheduleEngine;

    @Autowired
    public SubBudgetBuilderService(SubBudgetService subBudgetService,
                                   BudgetScheduleEngine budgetScheduleEngine)
    {
        this.subBudgetService = subBudgetService;
        this.budgetScheduleEngine = budgetScheduleEngine;
    }

    public Optional<SubBudget> createNewMonthSubBudget(final Budget budget, final LocalDate startDate, final LocalDate endDate, final BigDecimal totalIncome, final MonthlyBudgetGoals monthlyBudgetGoals)
    {
        return null;
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

    private List<BudgetSchedule> getBudgetSchedulesByBudgetStartAndEndDates(final List<DateRange> budgetDateRanges, final Long userId, final Period period)
    {
        List<BudgetSchedule> budgetSchedules = new ArrayList<>();
        for(DateRange dateRange : budgetDateRanges)
        {
            LocalDate budgetStartDate = dateRange.getStartDate();
            LocalDate budgetEndDate = dateRange.getEndDate();
            List<BudgetSchedule> newSchedules = createBudgetSchedules(budgetStartDate, budgetEndDate, userId, period);
            budgetSchedules.addAll(newSchedules);
        }
        return budgetSchedules;
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
                Optional<BudgetSchedule> budgetScheduleOptional = budgetScheduleEngine.createMonthSubBudgetSchedule(userId, monthStart, monthEnd);
                if(budgetScheduleOptional.isPresent())
                {
                    BudgetSchedule monthBudgetSchedule = budgetScheduleOptional.get();
                    newBudgetSchedules.add(monthBudgetSchedule);
                }
            }
            return newBudgetSchedules;
        }catch(InvalidUserIDException e)
        {
            log.error("There was an error creating the budget schedules with the invalid userId: ", e);
            return Collections.emptyList();
        }
    }




}
