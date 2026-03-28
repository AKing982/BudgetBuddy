package com.app.budgetbuddy.domain;

import jakarta.persistence.Entity;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor(access= AccessLevel.PUBLIC)
@EqualsAndHashCode
public class BPGoalsDetail
{
    private Long id;
    private Long bp_template_id;
    private Long subBudgetGoals_id;
    private String bpGoalsName;
    private BigDecimal totalAllocatedAmount;
    private BigDecimal totalSpent;
    private BigDecimal monthGoalAmount;
    private String goalType;
    private GoalStatus goalStatus;
    private double savingsPercent;
    private double overBudgetPercentage;

    public BPGoalsDetail(Long id, Long bp_template_id, Long subBudgetGoals_id, String bpGoalsName, BigDecimal totalAllocatedAmount, BigDecimal totalSpent, BigDecimal monthGoalAmount, String goalType, GoalStatus goalStatus, double savingsPercent, double overBudgetPercentage) {
        this.id = id;
        this.bp_template_id = bp_template_id;
        this.subBudgetGoals_id = subBudgetGoals_id;
        this.bpGoalsName = bpGoalsName;
        this.totalAllocatedAmount = totalAllocatedAmount;
        this.totalSpent = totalSpent;
        this.monthGoalAmount = monthGoalAmount;
        this.goalType = goalType;
        this.goalStatus = goalStatus;
        this.savingsPercent = savingsPercent;
        this.overBudgetPercentage = overBudgetPercentage;
    }
}
