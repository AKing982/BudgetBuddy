package com.app.budgetbuddy.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BudgetGoals
{
    private Long budgetId;
    private double targetAmount;
    private double monthlyAllocation;
    private double currentSavings;
    private String goalName;
    private String goalDescription;
    private String goalType;
    private String savingsFrequency;
    private String status;
}

