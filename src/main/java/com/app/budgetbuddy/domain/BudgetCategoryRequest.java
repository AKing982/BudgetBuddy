package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record BudgetCategoryRequest(@JsonProperty("categories") List<BudgetCategory> categories) {
}
