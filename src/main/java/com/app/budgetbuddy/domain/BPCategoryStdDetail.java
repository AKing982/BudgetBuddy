package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class BPCategoryStdDetail extends BPCategoryDetail implements Cloneable
{
    private double savingsPercentage;
    private double spendingPercentage;

    public BPCategoryStdDetail(String category, Long bp_week_detail_id, BigDecimal plannedAmount, BigDecimal actualAmount, double savingsPercentage, double spendingPercentage) {
        super(category, bp_week_detail_id, plannedAmount, actualAmount);
        this.savingsPercentage = savingsPercentage;
        this.spendingPercentage = spendingPercentage;
    }

    @Override
    public BPCategoryStdDetail clone() {
        try
        {
            BPCategoryStdDetail clone = (BPCategoryStdDetail) super.clone();
            // TODO: copy mutable state here, so the clone can't change the internals of the original
            return clone;
        } catch (CloneNotSupportedException e) {
            throw new AssertionError();
        }
    }
}
