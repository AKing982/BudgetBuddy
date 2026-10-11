package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
public class IncomeBudget
{
    private Long subBudgetId;
    private BigDecimal incomeAmount;
    private BigDecimal totalSpent;
    private BigDecimal totalBills;
    private BigDecimal bucketTotal;
    private BigDecimal totalRemaining;
    private BigDecimal totalSavings;
    private BigDecimal totalRecurring;
    private DateRange incomeRange;

    public IncomeBudget(Long subBudgetId, BigDecimal incomeAmount, BigDecimal totalSpent, BigDecimal totalBills, BigDecimal bucketTotal, BigDecimal totalSavings, BigDecimal totalRecurring, DateRange incomeRange) {
        this.subBudgetId = subBudgetId;
        this.incomeAmount = incomeAmount;
        this.totalSpent = totalSpent;
        this.totalBills = totalBills;
        this.bucketTotal = bucketTotal;
        this.totalSavings = totalSavings;
        this.totalRecurring = totalRecurring;
        this.incomeRange = incomeRange;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        IncomeBudget that = (IncomeBudget) o;
        return Objects.equals(subBudgetId, that.subBudgetId) && Objects.equals(incomeAmount, that.incomeAmount) && Objects.equals(totalSpent, that.totalSpent) && Objects.equals(totalBills, that.totalBills) && Objects.equals(bucketTotal, that.bucketTotal) && Objects.equals(totalSavings, that.totalSavings) && Objects.equals(totalRecurring, that.totalRecurring) && Objects.equals(incomeRange, that.incomeRange);
    }

    @Override
    public int hashCode() {
        return Objects.hash(subBudgetId, incomeAmount, totalSpent, totalBills, bucketTotal, totalSavings, totalRecurring, incomeRange);
    }

    public BigDecimal getRemaining() {
        return totalRemaining = incomeAmount.subtract(totalSpent);
    }

    public BigDecimal getSavings(){
        return totalSavings = totalSpent.subtract(totalRecurring).subtract(totalBills)
                .subtract(bucketTotal);
    }

    @Override
    public String toString() {
        return "IncomeBudget{" +
                "subBudgetId=" + subBudgetId +
                ", incomeAmount=" + incomeAmount +
                ", totalSpent=" + totalSpent +
                ", totalBills=" + totalBills +
                ", bucketTotal=" + bucketTotal +
                ", totalRemaining=" + totalRemaining +
                ", totalSavings=" + totalSavings +
                ", totalRecurring=" + totalRecurring +
                ", incomeRange=" + incomeRange +
                '}';
    }
}
