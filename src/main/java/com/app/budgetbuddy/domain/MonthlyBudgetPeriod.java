package com.app.budgetbuddy.domain;

import lombok.Getter;

import java.time.LocalDate;

@Getter
public class MonthlyBudgetPeriod extends BudgetPeriod
{
    private DateRange monthRange;

    protected MonthlyBudgetPeriod(LocalDate startDate, LocalDate endDate) {
        super(Period.MONTHLY, startDate, endDate);
        this.monthRange = new DateRange(startDate, endDate);
    }

    public MonthlyBudgetPeriod getNextMonth(){
        return new MonthlyBudgetPeriod(getStartDate().plusMonths(1), getEndDate().plusMonths(1));
    }

    public MonthlyBudgetPeriod getPreviousMonth(){
        return new MonthlyBudgetPeriod(getStartDate().minusMonths(1), getEndDate().minusMonths(1));
    }
}
