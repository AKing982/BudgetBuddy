package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class BPWeekStandardDetail extends BPWeekDetail implements Cloneable
{
    private double savingsPercentage;
    private double spendingPercentage;

    public BPWeekStandardDetail(Long id, Long template_detail_id, DateRange weekRange, BigDecimal plannedAmount, BigDecimal actualAmount, BigDecimal balance, double savingsPercentage, double spendingPercentage) {
        super(id, template_detail_id, weekRange, plannedAmount, actualAmount, balance);
        this.savingsPercentage = savingsPercentage;
        this.spendingPercentage = spendingPercentage;
    }

    @Override
    public BPWeekStandardDetail clone() {
        try {
            return (BPWeekStandardDetail) super.clone();
        } catch (CloneNotSupportedException e) {
            throw new AssertionError();
        }
    }
}
