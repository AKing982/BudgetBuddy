package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor( access = lombok.AccessLevel.PUBLIC)
@Builder
@ToString
public class BPCategory
{
    private String name;
    private BPType type;
    private Long budgetCategoryId;
    private DateRange range;
    private BigDecimal actual;
    private BigDecimal budgeted;
    private BigDecimal lastAmount;
    private boolean isGroupHeader;
    private int columnIndex;
    private boolean isActive;
    private boolean isOverBudget;

    public BPCategory(String name, BPType type, Long budgetCategoryId, DateRange range, BigDecimal actual, BigDecimal budgeted, BigDecimal lastAmount, boolean isGroupHeader, int columnIndex, boolean isActive, boolean isOverBudget) {
        this.name = name;
        this.type = type;
        this.budgetCategoryId = budgetCategoryId;
        this.range = range;
        this.actual = actual;
        this.budgeted = budgeted;
        this.lastAmount = lastAmount;
        this.isGroupHeader = isGroupHeader;
        this.columnIndex = columnIndex;
        this.isActive = isActive;
        this.isOverBudget = isOverBudget;
    }
}
