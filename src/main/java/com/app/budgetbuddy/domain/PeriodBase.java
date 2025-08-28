package com.app.budgetbuddy.domain;

import lombok.Getter;

@Getter
public class PeriodBase
{
    private int number;
    private int year;
    private DateRange range;

    public PeriodBase(int number, int year, DateRange range) {
        this.number = number;
        this.year = year;
        this.range = range;
    }
}
