package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.util.Objects;

@Getter
@Setter(AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@ToString
public class BudgetPeriodCategory
{
    private String category;
    private BigDecimal budgeted;
    private BigDecimal actual;
    private BigDecimal remaining;
    private DateRange dateRange;
    private boolean isOverBudget;
    private double spendingPercentage;
    private BudgetStatus budgetStatus;

    public BudgetPeriodCategory(String category, BigDecimal budgeted, BigDecimal actual, DateRange dateRange, BudgetStatus budgetStatus) {
        this.category = category;
        this.budgeted = budgeted;
        this.actual = actual;
        this.remaining = getRemainingCalculation(budgeted, actual);
        this.dateRange = dateRange;
        this.isOverBudget = isOverBudget(budgeted, actual);
        this.spendingPercentage = calculateSpendingPercentage(budgeted, actual);
        this.budgetStatus = budgetStatus;
    }

    /**
     * Determines if the budget is over-spent or under-utilized.
     */
    private BudgetStatus determineBudgetStatus(double spendingPercentage)
    {
        if (spendingPercentage > 1.0) {
            return BudgetStatus.OVER_BUDGET;
        } else if (spendingPercentage < 0.8) {
            return BudgetStatus.UNDER_UTILIZED;
        } else {
            return BudgetStatus.GOOD;
        }
    }

    private boolean isOverBudget(BigDecimal budgeted, BigDecimal actual) {
        return actual.compareTo(budgeted) > 0;
    }

    private BigDecimal getRemainingCalculation(final BigDecimal budgeted, final BigDecimal actual)
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
        BudgetPeriodCategory that = (BudgetPeriodCategory) o;
        return isOverBudget == that.isOverBudget && Double.compare(spendingPercentage, that.spendingPercentage) == 0 && Objects.equals(budgeted, that.budgeted) && Objects.equals(actual, that.actual) && Objects.equals(remaining, that.remaining) && Objects.equals(dateRange, that.dateRange) && budgetStatus == that.budgetStatus;
    }

    @Override
    public int hashCode() {
        return Objects.hash(budgeted, actual, remaining, dateRange, isOverBudget, spendingPercentage, budgetStatus);
    }
}
