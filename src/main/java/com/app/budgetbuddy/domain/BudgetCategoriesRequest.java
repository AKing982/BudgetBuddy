package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record BudgetCategoriesRequest(@JsonProperty("categories") List<BudgetCategory> categories) {
}
