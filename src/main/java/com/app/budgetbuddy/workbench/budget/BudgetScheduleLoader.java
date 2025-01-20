package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.BudgetSchedule;
import com.app.budgetbuddy.domain.Period;
import com.app.budgetbuddy.services.BudgetScheduleService;
import com.app.budgetbuddy.services.BudgetService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class BudgetScheduleLoader
{
    private final BudgetScheduleService budgetScheduleService;
    private final BudgetService budgetService;
    private final BudgetScheduleEngine budgetScheduleEngine;

    @Autowired
    public BudgetScheduleLoader(BudgetScheduleService budgetScheduleService, BudgetService budgetService,
                                BudgetScheduleEngine budgetScheduleEngine)
    {
        this.budgetScheduleService = budgetScheduleService;
        this.budgetService = budgetService;
        this.budgetScheduleEngine = budgetScheduleEngine;
    }


    public Optional<Budget> loadBudgetByDatesFromDatabase(final LocalDate startDate, final LocalDate endDate, final Long userId)
    {
        if(startDate == null || endDate == null)
        {
            log.warn("Start Date or End Date is missing: startDate={}, endDate={}", startDate, endDate);
            return Optional.empty();
        }
        Budget budget = budgetService.loadUserBudgetForPeriod(userId, startDate, endDate);
        if(budget == null)
        {
            log.warn("Missing Budget for userId={}, StartDate={} and EndDate={}", userId, startDate, endDate);
            return Optional.empty();
        }
        return Optional.of(budget);
    }


    public Optional<BudgetSchedule> loadBudgetScheduleForDatesFromDatabase(final LocalDate startDate, final LocalDate endDate, final Long budgetId)
    {
        return budgetScheduleService.getBudgetScheduleByDate(budgetId, startDate, endDate);
    }

    public Optional<BudgetSchedule> buildBudgetScheduleForMonth(LocalDate startDate, LocalDate endDate, Long userId)
    {
        return Optional.empty();
    }

    public List<BudgetSchedule> buildBudgetSchedules(final Long userId, final LocalDate startMonth, final boolean isFutureEnabled, final int numberOfMonths, final Period period)
    {
        return null;
    }

    public boolean saveBudgetSchedules(List<BudgetSchedule> budgetSchedules)
    {
        return false;
    }
}
