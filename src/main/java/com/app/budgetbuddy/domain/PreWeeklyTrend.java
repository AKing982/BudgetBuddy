package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PreWeeklyTrend
{
    private WeekNumber weekNumber;
    private String category;
    private TrendDirection trendDirection;
    private double spendingTrendPercentage;
    private double savingsTrendPercentage;
    private double goalsMetTrendPercentage;

    public PreWeeklyTrend(WeekNumber weekNumber, String category, TrendDirection trendDirection, double spendingTrendPercentage, double savingsTrendPercentage, double goalsMetTrendPercentage) {
        this.weekNumber = weekNumber;
        this.category = category;
        this.trendDirection = trendDirection;
        this.spendingTrendPercentage = spendingTrendPercentage;
        this.savingsTrendPercentage = savingsTrendPercentage;
        this.goalsMetTrendPercentage = goalsMetTrendPercentage;
    }

    public boolean isPositiveTrend()
    {
        return trendDirection == TrendDirection.POSITIVE;
    }

    public boolean hasSignificantChange(double threshold)
    {
        return Math.abs(spendingTrendPercentage) > threshold;
    }

    public double getAverageTrendPercentage()
    {
        return (spendingTrendPercentage + savingsTrendPercentage + goalsMetTrendPercentage) / 3;
    }

    public boolean isSpendingTrendUp()
    {
        return spendingTrendPercentage > 0;
    }

    public boolean isImprovingFinancially()
    {
        return savingsTrendPercentage > 0 && goalsMetTrendPercentage > 0 && spendingTrendPercentage > 0;
    }

    public String getFormattedSummary() {
        return String.format("%s trends for %s: Spending %+.1f%%, Savings %+.1f%%",
                category, weekNumber, spendingTrendPercentage, savingsTrendPercentage);
    }

}
