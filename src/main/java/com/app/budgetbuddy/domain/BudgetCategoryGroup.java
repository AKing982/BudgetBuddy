package com.app.budgetbuddy.domain;

import java.util.List;

public record BudgetCategoryGroup(String groupName, List<BPBudgetCategory> categories, List<BPRow> bpRows) {
}
