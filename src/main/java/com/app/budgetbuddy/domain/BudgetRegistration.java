package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@Data
@NoArgsConstructor(access= AccessLevel.PUBLIC)
@AllArgsConstructor(access= AccessLevel.PUBLIC)
@Builder
public class BudgetRegistration
{
    private Long userId;
    private String budgetName;
    private String budgetDescription;
    private Period budgetPeriod;
    private BudgetMode budgetMode;
    private BudgetGoals budgetGoals;
    private int budgetYear;
    private LocalDate budgetStartDate;
    private LocalDate budgetEndDate;
    private Set<DateRange> budgetDateRanges = new HashSet<>();
    private BigDecimal totalIncomeAmount;
    private int numberOfMonths;
    private int totalBudgetsNeeded;
    private BigDecimal previousIncomeAmount;
    private String previousBudgetName;
    private boolean previousBudgetSkipped;
    private Set<ControlledBudgetCategory> controlledBudgetCategorySet = new HashSet<>();

    public BudgetRegistration(Long userId, String budgetName, String budgetDescription, Period budgetPeriod, BudgetMode budgetMode, BudgetGoals budgetGoals, int budgetYear, LocalDate budgetStartDate, LocalDate budgetEndDate, Set<DateRange> budgetDateRanges, BigDecimal totalIncomeAmount, int numberOfMonths, int totalBudgetsNeeded, BigDecimal previousIncomeAmount, String previousBudgetName, boolean isPreviousBudgetSkipped) {
        this.userId = userId;
        this.budgetName = budgetName;
        this.budgetDescription = budgetDescription;
        this.budgetPeriod = budgetPeriod;
        this.budgetMode = budgetMode;
        this.budgetGoals = budgetGoals;
        this.budgetYear = budgetYear;
        this.budgetStartDate = budgetStartDate;
        this.budgetEndDate = budgetEndDate;
        this.budgetDateRanges = budgetDateRanges;
        this.totalIncomeAmount = totalIncomeAmount;
        this.numberOfMonths = numberOfMonths;
        this.totalBudgetsNeeded = totalBudgetsNeeded;
        this.previousIncomeAmount = previousIncomeAmount;
        this.previousBudgetName = previousBudgetName;
        this.previousBudgetSkipped = isPreviousBudgetSkipped;
    }

    public BudgetRegistration(Long userId, String budgetName, String budgetDescription, Period budgetPeriod, BudgetMode budgetMode, BudgetGoals budgetGoals, int budgetYear, Set<DateRange> budgetDateRanges, BigDecimal totalIncomeAmount, int numberOfMonths, int totalBudgetsNeeded, Set<ControlledBudgetCategory> controlledBudgetCategorySet) {
        this.userId = userId;
        this.budgetName = budgetName;
        this.budgetDescription = budgetDescription;
        this.budgetPeriod = budgetPeriod;
        this.budgetMode = budgetMode;
        this.budgetGoals = budgetGoals;
        this.budgetYear = budgetYear;
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
