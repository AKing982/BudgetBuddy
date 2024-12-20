package com.app.budgetbuddy.domain;

import lombok.Getter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
public class WeeklyBudgetPeriod extends BudgetPeriod
{
    private List<DateRange> weeklyDateRange;

    public WeeklyBudgetPeriod(LocalDate startDate, LocalDate endDate)
    {
        super(Period.WEEKLY, startDate, endDate);
        this.weeklyDateRange = getWeeklyDateRanges();
    }

    private List<DateRange> getWeeklyDateRanges()
    {
        DateRange dateRange = new DateRange(getStartDate(), getEndDate());
        List<DateRange> weekRanges = dateRange.splitIntoWeeks();
        return new ArrayList<>(weekRanges);
    }
}
