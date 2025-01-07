package com.app.budgetbuddy.domain;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode
@ToString
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
