package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Objects;

@Getter
@Setter(AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BudgetPeriodParams
{
    private BigDecimal budgeted;
    private BigDecimal actual;
    private BigDecimal remaining;
    private DateRange dateRange;
    private boolean isOverBudget;
    private double spendingPercentage;
    private BudgetStatus budgetStatus;

    public BudgetPeriodParams(BigDecimal budgeted, BigDecimal actual, BigDecimal remaining, DateRange dateRange, boolean isOverBudget, double spendingPercentage, BudgetStatus budgetStatus) {
        this.budgeted = budgeted;
        this.actual = actual;
        this.remaining = remaining;
        this.dateRange = dateRange;
        this.isOverBudget = isOverBudget;
        this.spendingPercentage = spendingPercentage;
        this.budgetStatus = budgetStatus;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BudgetPeriodParams that = (BudgetPeriodParams) o;
        return isOverBudget == that.isOverBudget && Double.compare(spendingPercentage, that.spendingPercentage) == 0 && Objects.equals(budgeted, that.budgeted) && Objects.equals(actual, that.actual) && Objects.equals(remaining, that.remaining) && Objects.equals(dateRange, that.dateRange) && budgetStatus == that.budgetStatus;
    }

    @Override
    public int hashCode() {
        return Objects.hash(budgeted, actual, remaining, dateRange, isOverBudget, spendingPercentage, budgetStatus);
    }
}
