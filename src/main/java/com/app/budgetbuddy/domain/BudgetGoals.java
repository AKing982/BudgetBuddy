package com.app.budgetbuddy.domain;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BudgetGoals
{
    private Long budgetId;
    private double targetAmount;
    private double monthlyAllocation;
    private double currentSavings;
    private String goalType;
    private String savingsFrequency;
    private String status;

}

