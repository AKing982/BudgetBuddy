package com.app.budgetbuddy.domain;

import java.time.LocalDate;

public class WeeklyRange extends DateRange
{
    public WeeklyRange(LocalDate startDate, LocalDate endDate) {
        super(startDate, endDate);
    }

}
