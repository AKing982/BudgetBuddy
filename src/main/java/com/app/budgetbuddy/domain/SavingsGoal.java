package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class SavingsGoal
{
    private BigDecimal currentSavingsAmount;
    private BigDecimal monthlyAllocation;
    private BigDecimal actualAllocationAmount;
    private BigDecimal savingsProgress;
    private BigDecimal savingsTargetAmount;
    private int totalMonthsToSave;
    private LocalDate savingsStartDate;
    private LocalDate savingsEndDate;
    private boolean isSavingsGoalReached;
}
