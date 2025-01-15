package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.BudgetSchedule;
import com.app.budgetbuddy.domain.DateRange;

import java.util.List;

/**
 * This class will implement logic for building both past and future Budget Schedules\
 * This class will handle building Budget Schedules that can span over normal month ranges,
 * or custom ranges depending on the particular budget plan
 * This class will also need to build BudgetSchedules for up to 1-2 months in the future and also build budget schedules for past or previous periods
 */
public class BudgetScheduleEngine
{
    /**
     * This method will build monthly budget schedules
     *
     */
    public BudgetSchedule createMonthlyBudgetSchedule(final Budget budget, final DateRange dateRange)
    {
        return null;
    }

    /**
     *
     */

    public List<BudgetSchedule> createCustomBudgetSchedule(Budget budget, )
}
