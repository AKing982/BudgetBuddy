package com.app.budgetbuddy.domain;

import java.util.List;

public record BudgetCategoryGroup(String groupName, List<BudgetCategory> categories) {
}
