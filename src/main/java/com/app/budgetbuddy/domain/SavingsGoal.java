package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Deprecated
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@Builder
public class SavingsGoal
{
    private BigDecimal actualAllocationAmount;
    private BigDecimal savingsProgress;
    private BigDecimal savingsTargetAmount;
    private int totalMonthsToSave;
    private LocalDate savingsStartDate;
    private LocalDate savingsEndDate;
    private boolean isSavingsGoalReached;
}
