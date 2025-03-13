package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class SubBudgetGoals
{
    private Long id;
    private Long goalId;
    private Long subBudgetId;
    private BigDecimal savingsTarget;
    private BigDecimal contributedAmount;
    private BigDecimal goalScore;
    private BigDecimal remaining;
    private GoalStatus status;
}
