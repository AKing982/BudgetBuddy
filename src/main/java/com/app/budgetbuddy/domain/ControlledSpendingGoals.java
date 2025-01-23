package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;

@Data
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class ControlledSpendingGoals
{
      private Long budgetId;
      private int totalSpendingCategories;
      private Set<ControlledBudgetCategory> controlledBudgetCategories;
}
