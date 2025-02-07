package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class IncomeCategory extends Category
{
    private BigDecimal incomeGrossAmount;
    private String incomeSource;
    private IncomeFrequency frequency;

    public IncomeCategory(String categoryId, String categoryName, String categoryDescription, BigDecimal budgetedAmount, LocalDate categoryStartDate, LocalDate categoryEndDate, BigDecimal actual, boolean isActive, CategoryType categoryType, DateRange dateRange, BigDecimal incomeAmount, String incomeSource, IncomeFrequency frequency) {
        super(categoryId, categoryName, categoryDescription, budgetedAmount, categoryStartDate, categoryEndDate, actual, isActive, categoryType, dateRange);
        this.incomeGrossAmount = incomeAmount;
        this.incomeSource = incomeSource;
        this.frequency = frequency;
    }
}
