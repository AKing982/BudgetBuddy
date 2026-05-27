package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.YearMonth;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
public class EnvelopeEstimate
{
    private String goalName;
    private boolean isAfforable;
    private YearMonth yearMonth;
    private double monthlyAmount;
    private double totalAmount;
    private double budgetImpactPercentage;

    public EnvelopeEstimate(String goalName, boolean isAfforable, YearMonth yearMonth, double monthlyAmount, double totalAmount, double budgetImpactPercentage) {
        this.goalName = goalName;
        this.isAfforable = isAfforable;
        this.yearMonth = yearMonth;
        this.monthlyAmount = monthlyAmount;
        this.totalAmount = totalAmount;
        this.budgetImpactPercentage = budgetImpactPercentage;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        EnvelopeEstimate that = (EnvelopeEstimate) o;
        return isAfforable == that.isAfforable && Double.compare(monthlyAmount, that.monthlyAmount) == 0 && Double.compare(totalAmount, that.totalAmount) == 0 && Double.compare(budgetImpactPercentage, that.budgetImpactPercentage) == 0 && Objects.equals(goalName, that.goalName) && Objects.equals(yearMonth, that.yearMonth);
    }

    @Override
    public int hashCode() {
        return Objects.hash(goalName, isAfforable, yearMonth, monthlyAmount, totalAmount, budgetImpactPercentage);
    }
}
