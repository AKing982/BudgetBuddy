package com.app.budgetbuddy.domain;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class BiWeeklyBudgetPeriod extends BudgetPeriod
{
    private List<DateRange> biWeeklyRanges;

    public BiWeeklyBudgetPeriod(LocalDate startDate, LocalDate endDate) {
        super(Period.BIWEEKLY, startDate, endDate);
        this.biWeeklyRanges = getBiWeeklyRanges();
    }

    public List<DateRange> getBiWeeklyRanges() {
        DateRange biWeeklyRange = new DateRange(super.getStartDate(), super.getEndDate());
        return biWeeklyRange.splitIntoBiWeeks();
    }
}
