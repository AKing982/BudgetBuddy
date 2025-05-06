package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class DateRangeSpending
{
    private DateRange dateRange;
    private double spentOnRange;

    public DateRangeSpending(DateRange dateRange, double spentOnRange)
    {
        this.dateRange = dateRange;
        this.spentOnRange = spentOnRange;
    }
}
