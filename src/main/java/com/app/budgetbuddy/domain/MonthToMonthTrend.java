package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@Setter
public class MonthToMonthTrend
{
    // SubBudget Id's for two months
    private Long currentMonthId;
    private Long previousMonthId;

    // Trend Data between two months
    private BigDecimal spendingPercent;
    private BigDecimal savedPercent;
    private BigDecimal incomePercent;
    private BigDecimal budgetedPercent;
    private BigDecimal goalsMetPercent;
    private BigDecimal remainingPercent;

    private Map<TrendEntry, Map<BigDecimal, TrendDirection>> monthToMonthTrendDirectionMap;

    public MonthToMonthTrend(Long currentMonthId, Long previousMonthId, BigDecimal spendingPercent, BigDecimal savedPercent, BigDecimal incomePercent, BigDecimal budgetedPercent, BigDecimal goalsMetPercent, BigDecimal remainingPercent)
    {
        this.currentMonthId = currentMonthId;
        this.previousMonthId = previousMonthId;
        this.spendingPercent = spendingPercent;
        this.savedPercent = savedPercent;
        this.incomePercent = incomePercent;
        this.budgetedPercent = budgetedPercent;
        this.goalsMetPercent = goalsMetPercent;
        this.remainingPercent = remainingPercent;
    }
}
