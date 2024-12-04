package com.app.budgetbuddy.domain;

public record BudgetGoals(Long budgetId, double targetAmount, double monthlyAllocation, double currentSavings, String goalType, String savingsFrequency, String status) {
}
