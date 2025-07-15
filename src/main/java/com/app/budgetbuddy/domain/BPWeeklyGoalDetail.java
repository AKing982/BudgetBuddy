package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class BPWeeklyGoalDetail extends BPWeekDetail implements Cloneable
{
    private BigDecimal goalAmount;
    private BigDecimal goalMetAmount;
    private BigDecimal goalRemainingAmount;

    private double goalAmountPercentage;
    private double goalMetAmountPercentage;
    private double goalRemainingAmountPercentage;

    private boolean goalMet;

    public BPWeeklyGoalDetail(Long id, Long template_detail_id, DateRange weekRange, BigDecimal plannedAmount, BigDecimal actualAmount, BigDecimal balance, BigDecimal goalAmount, BigDecimal goalMetAmount, BigDecimal goalRemainingAmount, double goalAmountPercentage, double goalMetAmountPercentage, double goalRemainingAmountPercentage, boolean goalMet) {
        super(id, template_detail_id, weekRange, plannedAmount, actualAmount, balance);
        this.goalAmount = goalAmount;
        this.goalMetAmount = goalMetAmount;
        this.goalRemainingAmount = goalRemainingAmount;
        this.goalAmountPercentage = goalAmountPercentage;
        this.goalMetAmountPercentage = goalMetAmountPercentage;
        this.goalRemainingAmountPercentage = goalRemainingAmountPercentage;
        this.goalMet = goalMet;
    }

    @Override
    public BPWeeklyGoalDetail clone() throws CloneNotSupportedException
    {
        return (BPWeeklyGoalDetail) super.clone();
    }
}
