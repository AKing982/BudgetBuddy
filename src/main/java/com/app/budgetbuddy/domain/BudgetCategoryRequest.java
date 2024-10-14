package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonProperty;

public record BudgetCategoryRequest(@JsonProperty("budgetId") Long budgetId,
                                    @JsonProperty("categoryName") String categoryName,
                                    @JsonProperty("allocatedAmount") Double allocatedAmount,
                                    @JsonProperty("monthlySpendingLimit") Double monthlySpendingLimit,
                                    @JsonProperty("currentSpending") Double currentSpending,
                                    @JsonProperty("isFixedExpense") Boolean isFixedExpense,
                                    @JsonProperty("isActive") Boolean isActive,
                                    @JsonProperty("priority") Integer priority) {
}
