package com.app.budgetbuddy.domain;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class SubBudget
{
    private Long id;
    private BigDecimal allocatedAmount;
    private BigDecimal subSavingsTarget;
    private BigDecimal subSavingsAmount;
    private BigDecimal spentOnBudget;
    private Budget budget;
    private List<BudgetSchedule> budgetSchedule;
    private List<ControlledBudgetCategory> controlledBudgetCategory;
    private boolean isActive;

    public SubBudget(Long id, BigDecimal allocatedAmount, BigDecimal subSavingsTarget, BigDecimal subSavingsAmount, BigDecimal spentOnBudget, Budget budget, List<BudgetSchedule> budgetSchedule, List<ControlledBudgetCategory> controlledBudgetCategory, boolean isActive) {
        this.id = id;
        this.allocatedAmount = allocatedAmount;
        this.subSavingsTarget = subSavingsTarget;
        this.subSavingsAmount = subSavingsAmount;
        this.spentOnBudget = spentOnBudget;
        this.budget = budget;
        this.budgetSchedule = budgetSchedule;
        this.controlledBudgetCategory = controlledBudgetCategory;
        this.isActive = isActive;
    }
}
