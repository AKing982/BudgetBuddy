package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SubBudgetTrend
{
    private Long subBudgetId;
    private boolean isSavingsIncreasing;
    private boolean isIncomeIncreasing;
    private boolean isSpendingIncreasing;

    private double incomeTrendPercent;
    private double savingsTrendPercent;
    private double spendingTrendPercent;
    private double goalTrendPercent;

    public SubBudgetTrend(Long subBudgetId, double incomeTrendPercent, double savingsTrendPercent, double spendingTrendPercent, double goalTrendPercent)
    {
        this.subBudgetId = subBudgetId;
        this.incomeTrendPercent = incomeTrendPercent;
        this.savingsTrendPercent = savingsTrendPercent;
        this.spendingTrendPercent = spendingTrendPercent;
        this.goalTrendPercent = goalTrendPercent;
    }

    public boolean isSavingsIncreasing()
    {
        return false;
    }

    public boolean isExpenseIncreasing()
    {
        return false;
    }

    public boolean isIncomeIncreasing()
    {
        return false;
    }
}
