package com.app.budgetbuddy.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SavingsCategory extends Category
{
    private BigDecimal targetSavingsAmount;
    private BigDecimal currentSavings;
    private LocalDate savingsGoalDate;
    private boolean isGoalReached;

    public SavingsCategory(String categoryId, String categoryName, String categoryDescription, BigDecimal budgetedAmount, LocalDate categoryStartDate, LocalDate categoryEndDate, BigDecimal actual, boolean isActive, CategoryType categoryType, DateRange dateRange, BigDecimal targetSavingsAmount, BigDecimal currentSavings, LocalDate savingsGoalDate, boolean isGoalReached) {
        super(categoryId, categoryName, categoryDescription, budgetedAmount, categoryStartDate, categoryEndDate, actual, isActive, categoryType, dateRange);
        this.targetSavingsAmount = targetSavingsAmount;
        this.currentSavings = currentSavings;
        this.savingsGoalDate = savingsGoalDate;
        this.isGoalReached = isGoalReached;
    }
}
