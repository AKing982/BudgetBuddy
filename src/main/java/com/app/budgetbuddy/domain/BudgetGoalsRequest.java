package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonProperty;

public record BudgetGoalsRequest(@JsonProperty("budgetId") Long budgetId,
                                 @JsonProperty("goalName") String goalName,
                                 @JsonProperty("goalDescription") String goalDescription,
                                 @JsonProperty("goalType") String goalType,
                                 @JsonProperty("targetAmount") double targetAmount,
                                 @JsonProperty("monthlyAllocation") double monthlyAllocation,
                                 @JsonProperty("currentSavings") double currentSavings,
                                 @JsonProperty("savingsFrequency") String savingsFrequency,
                                 @JsonProperty("status") String status) {
}
