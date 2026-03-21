package com.app.budgetbuddy.domain;

import java.util.Map;

public record BudgetCategoryUpdate(Map<Long, String> budgetCategoryUpdateMap) {
}
