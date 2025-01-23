package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@Data
@NoArgsConstructor(access= AccessLevel.PUBLIC)
public class BudgetRegistration
{
    private Long userId;
    private String budgetName;
    private Period budgetPeriod;
    private BudgetMode budgetMode;
    private BudgetGoals budgetGoals;
    private Set<DateRange> budgetDateRanges = new HashSet<>();
    private BigDecimal totalIncomeAmount;
    private int numberOfMonths;
    private int totalBudgetsNeeded;
    private Set<ControlledBudgetCategory> controlledBudgetCategorySet = new HashSet<>();

    public BudgetRegistration(Long userId, String budgetName, Period budgetPeriod, BudgetMode budgetMode, BudgetGoals budgetGoals, Set<DateRange> budgetDateRanges, BigDecimal totalIncomeAmount, int numberOfMonths, int totalBudgetsNeeded, Set<ControlledBudgetCategory> controlledBudgetCategorySet) {
        this.userId = userId;
        this.budgetName = budgetName;
        this.budgetPeriod = budgetPeriod;
        this.budgetMode = budgetMode;
        this.budgetGoals = budgetGoals;
        this.budgetDateRanges = budgetDateRanges;
        this.totalIncomeAmount = totalIncomeAmount;
        this.numberOfMonths = numberOfMonths;
        this.totalBudgetsNeeded = totalBudgetsNeeded;
        this.controlledBudgetCategorySet = controlledBudgetCategorySet;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BudgetRegistration that = (BudgetRegistration) o;
        return numberOfMonths == that.numberOfMonths && totalBudgetsNeeded == that.totalBudgetsNeeded && Objects.equals(userId, that.userId) && Objects.equals(budgetName, that.budgetName) && budgetPeriod == that.budgetPeriod && budgetMode == that.budgetMode && Objects.equals(budgetGoals, that.budgetGoals) && Objects.equals(budgetDateRanges, that.budgetDateRanges) && Objects.equals(totalIncomeAmount, that.totalIncomeAmount) && Objects.equals(controlledBudgetCategorySet, that.controlledBudgetCategorySet);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, budgetName, budgetPeriod, budgetMode, budgetGoals, budgetDateRanges, totalIncomeAmount, numberOfMonths, totalBudgetsNeeded, controlledBudgetCategorySet);
    }
}
