package com.app.budgetbuddy.domain;

public record BudgetCategory(Long budgetId,
                             String categoryName,
                             Double allocatedAmount,
                             Double monthlySpendingLimit,
                             Double currentSpending,
                             Boolean isFixedExpense,
                             Boolean isActive,
                             Integer priority) {
}
