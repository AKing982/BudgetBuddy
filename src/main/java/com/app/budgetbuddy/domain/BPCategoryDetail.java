package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public abstract class BPCategoryDetail
{
    private String category;
    private Long bp_week_detail_id;
    private BigDecimal plannedAmount;
    private BigDecimal actualAmount;

    public BPCategoryDetail(String category, Long bp_week_detail_id, BigDecimal plannedAmount, BigDecimal actualAmount)
    {
        this.category = category;
        this.bp_week_detail_id = bp_week_detail_id;
        this.plannedAmount = plannedAmount;
        this.actualAmount = actualAmount;
    }

    public double calculateBudgetedPercent(BigDecimal budgetedAmount, BigDecimal plannedAmount)
    {
        return 0;
    }

    public double calculateSpendingPercent(BigDecimal actualSpending, BigDecimal plannedSpending)
    {
        return 0;
    }

    public double calculateSavingsPercent(BigDecimal actualSavings, BigDecimal plannedSavings)
    {
        return 0;
    }

}
