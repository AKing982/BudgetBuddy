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
    private String category;
    private BigDecimal budgeted;
    private BigDecimal actual;
    private BigDecimal remaining;
    private DateRange dateRange;
    private boolean isOverBudget;
    private double spendingPercentage;
    private BudgetStatus budgetStatus;

    public BudgetPeriodParams(String category, BigDecimal budgeted, BigDecimal actual, DateRange dateRange, BudgetStatus budgetStatus) {
        this.category = category;
        this.budgeted = budgeted;
        this.actual = actual;
        this.remaining = getRemainingCalculation(budgeted, actual);
        this.dateRange = dateRange;
        this.isOverBudget = isOverBudget(budgeted, actual);
        this.spendingPercentage = calculateSpendingPercentage(budgeted, actual);
        this.budgetStatus = budgetStatus;
    }

    private boolean isOverBudget(BigDecimal budgeted, BigDecimal actual) {
        return budgeted.compareTo(actual) > 0;
    }

    private BigDecimal getRemainingCalculation(final BigDecimal budgeted, BigDecimal actual)
    {
        BigDecimal remainingAmount = budgeted.subtract(actual);
        if(remainingAmount.compareTo(BigDecimal.ZERO) <= 0){
            return BigDecimal.ZERO;
        }
        return remainingAmount;
    }

    private double calculateSpendingPercentage(BigDecimal budgeted, BigDecimal actual)
    {
        double budgetedAsDouble = budgeted.doubleValue();
        double actualAsDouble = actual.doubleValue();
        return actualAsDouble / budgetedAsDouble;
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
