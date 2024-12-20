package com.app.budgetbuddy.domain;

import lombok.Getter;

import java.time.LocalDate;

@Getter
public class DailyBudgetPeriod extends BudgetPeriod
{
    public DailyBudgetPeriod(LocalDate date) {
        super(Period.DAILY, date, date);
    }

    public DailyBudgetPeriod nextDay(){
        return new DailyBudgetPeriod(LocalDate.now().plusDays(1));
    }

    public DailyBudgetPeriod previousDay(){
        return new DailyBudgetPeriod(LocalDate.now().minusDays(1));
    }
}
