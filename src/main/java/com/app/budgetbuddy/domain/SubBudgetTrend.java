package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.jetbrains.annotations.NotNull;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor(access=AccessLevel.PUBLIC)
public class SubBudgetTrend implements Comparable<SubBudgetTrend>
{
    private Long subBudgetId;
    private DateRange monthRange;
    private double monthlySaved;
    private double monthlyVariableExpenses;
    private double monthlyFixedExpenses;
    private double monthlyIncome;
    private double monthlyGoalReached;
    private double monthlyGoalAmount;

    public SubBudgetTrend(Long subBudgetId, DateRange monthRange, double monthlySaved, double monthlyVariableExpenses,
                          double monthlyFixedExpenses,
                          double monthlyIncome,
                          double monthlyGoalReached,
                          double monthlyGoalAmount)
    {
        this.subBudgetId = subBudgetId;
        this.monthRange = monthRange;
        this.monthlySaved = monthlySaved;
        this.monthlyVariableExpenses = monthlyVariableExpenses;
        this.monthlyFixedExpenses = monthlyFixedExpenses;
        this.monthlyIncome = monthlyIncome;
        this.monthlyGoalReached = monthlyGoalReached;
        this.monthlyGoalAmount = monthlyGoalAmount;
    }

    @Override
    public int compareTo(@NotNull SubBudgetTrend o)
    {
        return o.subBudgetId.compareTo(this.subBudgetId);
    }
}
