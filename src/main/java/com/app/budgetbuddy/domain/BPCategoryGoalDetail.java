package com.app.budgetbuddy.domain;

import java.math.BigDecimal;

public class BPCategoryGoalDetail extends BPCategoryDetail implements Cloneable
{
    private BigDecimal goalAmount;
    private BigDecimal goalMetAmount;
    private BigDecimal goalRemainingAmount;

    private double goalAmountPercentage;
    private double goalMetAmountPercentage;
    private double goalRemainingAmountPercentage;

    public BPCategoryGoalDetail(BigDecimal goalAmount, BigDecimal goalMetAmount, BigDecimal goalRemainingAmount, double goalAmountPercentage, double goalMetAmountPercentage, double goalRemainingAmountPercentage) {
        this.goalAmount = goalAmount;
        this.goalMetAmount = goalMetAmount;
        this.goalRemainingAmount = goalRemainingAmount;
        this.goalAmountPercentage = goalAmountPercentage;
        this.goalMetAmountPercentage = goalMetAmountPercentage;
        this.goalRemainingAmountPercentage = goalRemainingAmountPercentage;
    }

    @Override
    public BPCategoryGoalDetail clone()
    {
        try
        {
            return (BPCategoryGoalDetail) super.clone();
        }catch(CloneNotSupportedException e){
            throw new AssertionError();
        }
        // TODO: copy mutable state here, so the clone can't change the internals of the original
    }
}
