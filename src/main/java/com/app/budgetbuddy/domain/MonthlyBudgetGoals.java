package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.YearMonth;
import java.util.Objects;

@Data
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class MonthlyBudgetGoals
{
    private Long userId;
    private Long monthlyBudgetGoalId;
    private BudgetMonth month;
    private double monthlySavingsTarget;
    private double monthlyContributed;
    private double remainingAmount;
    private String monthlyStatus;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MonthlyBudgetGoals that = (MonthlyBudgetGoals) o;
        return Double.compare(monthlySavingsTarget, that.monthlySavingsTarget) == 0 && Double.compare(monthlyContributed, that.monthlyContributed) == 0 && Double.compare(remainingAmount, that.remainingAmount) == 0 && Objects.equals(monthlyBudgetGoalId, that.monthlyBudgetGoalId)  && Objects.equals(month, that.month) && Objects.equals(monthlyStatus, that.monthlyStatus);
    }

    @Override
    public int hashCode() {
        return Objects.hash(monthlyBudgetGoalId, month, monthlySavingsTarget, monthlyContributed, remainingAmount, monthlyStatus);
    }
}
