package com.app.budgetbuddy.domain;

import java.time.LocalDate;

public record BudgetCategorySpending(String categoryName, Long subBudgetId, Double spending, Double totalBudgeted, LocalDate startDate, LocalDate endDate) {
}
