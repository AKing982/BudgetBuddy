package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BPCategoryDetail
{
    private String category;
    private Long bp_week_detail_id;
    private BigDecimal budgetedAmount;
    private BigDecimal plannedAmount;
    private BigDecimal predictedAmount;
    private BigDecimal spendingPercent;
    private BigDecimal savingsPercent;
    private BigDecimal budgetedPercent;

    public BPCategoryDetail(String category, Long bp_week_detail_id, BigDecimal budgetedAmount, BigDecimal plannedAmount, BigDecimal predictedAmount, BigDecimal spendingPercent, BigDecimal savingsPercent, BigDecimal budgetedPercent) {
        this.category = category;
        this.bp_week_detail_id = bp_week_detail_id;
        this.budgetedAmount = budgetedAmount;
        this.plannedAmount = plannedAmount;
        this.predictedAmount = predictedAmount;
        this.spendingPercent = spendingPercent;
        this.savingsPercent = savingsPercent;
        this.budgetedPercent = budgetedPercent;
    }
}
