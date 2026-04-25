package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor( access = lombok.AccessLevel.PUBLIC)
@AllArgsConstructor( access = lombok.AccessLevel.PUBLIC)
@Builder
@ToString
public class BPCategory
{
    private Long id;
    private Long templateDetailId;
    private String name;
    private BPType type;
    private Long budgetCategoryId;
    private DateRange range;
    private BigDecimal actual;
    private BigDecimal plannedAmount;
    private BigDecimal budgeted;
    private BigDecimal lastAmount;
    private boolean isGroupHeader;
    private int columnIndex;
    private boolean isActive;
    private boolean isOverBudget;

    public BPCategory(Long id, String name, BPType type, DateRange range, BigDecimal actual, BigDecimal plannedAmount, BigDecimal budgeted, BigDecimal lastAmount, boolean isGroupHeader, int columnIndex, boolean isActive, boolean isOverBudget, Long budgetCategoryId) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.range = range;
        this.actual = actual;
        this.plannedAmount = plannedAmount;
        this.budgeted = budgeted;
        this.lastAmount = lastAmount;
        this.isGroupHeader = isGroupHeader;
        this.columnIndex = columnIndex;
        this.isActive = isActive;
        this.isOverBudget = isOverBudget;
        this.budgetCategoryId = budgetCategoryId;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        BPCategory that = (BPCategory) o;
        return isGroupHeader == that.isGroupHeader && columnIndex == that.columnIndex && isActive == that.isActive && isOverBudget == that.isOverBudget && Objects.equals(id, that.id) && Objects.equals(name, that.name) && type == that.type && Objects.equals(budgetCategoryId, that.budgetCategoryId) && Objects.equals(range, that.range) && Objects.equals(actual, that.actual) && Objects.equals(plannedAmount, that.plannedAmount) && Objects.equals(budgeted, that.budgeted) && Objects.equals(lastAmount, that.lastAmount);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, name, type, budgetCategoryId, range, actual, plannedAmount, budgeted, lastAmount, isGroupHeader, columnIndex, isActive, isOverBudget);
    }
}
