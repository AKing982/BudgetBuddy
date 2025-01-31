package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
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
    private BigDecimal monthlySavingsTarget;
    private BigDecimal monthlyContributed;
    private BigDecimal remainingAmount;
    private String monthlyStatus;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MonthlyBudgetGoals that = (MonthlyBudgetGoals) o;
        return Objects.equals(userId, that.userId) && Objects.equals(monthlyBudgetGoalId, that.monthlyBudgetGoalId) && Objects.equals(month, that.month) && Objects.equals(monthlySavingsTarget, that.monthlySavingsTarget) && Objects.equals(monthlyContributed, that.monthlyContributed) && Objects.equals(remainingAmount, that.remainingAmount) && Objects.equals(monthlyStatus, that.monthlyStatus);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, monthlyBudgetGoalId, month, monthlySavingsTarget, monthlyContributed, remainingAmount, monthlyStatus);
    }
}
