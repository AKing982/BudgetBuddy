package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class SavingsGoal
{
    private BigDecimal savingsAmount;
    private BigDecimal currentSavingsAmount;
    private LocalDate savingsStartDate;
    private LocalDate savingsEndDate;
    private double savingsGoalProgress;
    private boolean isSavingsGoalReached;

    public SavingsGoal(BigDecimal savingsAmount, BigDecimal currentSavingsAmount, LocalDate savingsStartDate, LocalDate savingsEndDate, double savingsGoalProgress, boolean isSavingsGoalReached) {
        this.savingsAmount = savingsAmount;
        this.currentSavingsAmount = currentSavingsAmount;
        this.savingsStartDate = savingsStartDate;
        this.savingsEndDate = savingsEndDate;
        this.savingsGoalProgress = savingsGoalProgress;
        this.isSavingsGoalReached = isSavingsGoalReached;
    }
}
