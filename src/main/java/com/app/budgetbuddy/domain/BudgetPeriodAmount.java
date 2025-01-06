package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class BudgetPeriodAmount
{
    private DateRange dateRange;
    private double amount;

    public BudgetPeriodAmount(DateRange dateRange, double amount)
    {
        this.dateRange = dateRange;
        this.amount = amount;
    }
}
