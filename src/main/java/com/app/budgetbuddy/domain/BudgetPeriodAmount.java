package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode
@ToString
@Deprecated
public class BudgetPeriodAmount
{
    private DateRange dateRange;
    private BigDecimal budgeted;
    private BigDecimal actual;

    public BudgetPeriodAmount(DateRange dateRange, BigDecimal budgeted, BigDecimal actual)
    {
        this.dateRange = dateRange;
        this.budgeted = budgeted;
        this.actual = actual;
    }

    public BudgetPeriodAmount(DateRange dateRange, BigDecimal budgeted) {
        this.dateRange = dateRange;
        this.budgeted = budgeted;
    }
}
