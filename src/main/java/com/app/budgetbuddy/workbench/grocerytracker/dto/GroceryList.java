package com.app.budgetbuddy.workbench.grocerytracker.dto;

import java.util.List;

public record GroceryList(Long id, Long groceryBudgetId, double budgetedAmount, List<GroceryListItem> groceryItems) {
}
