package com.app.budgetbuddy.domain;

import java.time.YearMonth;

public class MonthNumber extends PeriodBase
{
    private YearMonth yearMonth;

    public MonthNumber(int number, int year, DateRange range, YearMonth yearMonth)
    {
        super(number, year, range);
        this.yearMonth = yearMonth;
    }
}
