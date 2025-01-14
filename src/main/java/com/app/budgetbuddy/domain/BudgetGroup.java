package com.app.budgetbuddy.domain;

import lombok.Data;

import java.util.HashSet;
import java.util.Set;

@Data
public class BudgetGroup
{
    private Long id;
    private Long userId;
    private String groupName;
    private String groupDescription;
    private Set<Budget> budgets = new HashSet<>();

}
