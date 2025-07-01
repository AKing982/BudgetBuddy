package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor(access= AccessLevel.PUBLIC)
public class BPGoalsDetail
{
    private Long id;
    private Long bp_template_id;
    private Long subBudgetGoals_id;
    private String bpGoalsName;
    private BigDecimal totalAllocatedAmount;
    private BigDecimal monthGoalAmount;
    private String goalType;
    private GoalStatus goalStatus;
    private double savingsPercent;

    public BPGoalsDetail(Long id, Long bp_template_id, String bpGoalsName, BigDecimal totalAllocatedAmount, BigDecimal monthGoalAmount, BigDecimal monthSavedAmount, String goalType, GoalStatus goalStatus, double savingsPercent) {
        this.id = id;
        this.bp_template_id = bp_template_id;
        this.bpGoalsName = bpGoalsName;
        this.totalAllocatedAmount = totalAllocatedAmount;
        this.monthGoalAmount = monthGoalAmount;
        this.goalType = goalType;
        this.goalStatus = goalStatus;
        this.savingsPercent = savingsPercent;
    }

}
