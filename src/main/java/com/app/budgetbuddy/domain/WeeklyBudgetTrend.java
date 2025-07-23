package com.app.budgetbuddy.domain;

public class WeeklyBudgetTrend
{
    private Long wTrendId;
    private DateRange weekRange;
    private double savingsTrendPercent;
    private double expenseTrendPercent;

    public WeeklyBudgetTrend(Long wTrendId, DateRange weekRange, double savingsTrendPercent, double expenseTrendPercent)
    {
        this.wTrendId = wTrendId;
        this.weekRange = weekRange;
        this.savingsTrendPercent = savingsTrendPercent;
        this.expenseTrendPercent = expenseTrendPercent;
    }
}
