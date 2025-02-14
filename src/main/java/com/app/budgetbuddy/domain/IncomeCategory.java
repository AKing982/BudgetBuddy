package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@Builder(toBuilder = true)
public class IncomeCategory extends Category
{
    private List<TransactionCategory> incomeCategories;

    public IncomeCategory(String categoryId, String categoryName, String categoryDescription, BigDecimal budgetedAmount, LocalDate categoryStartDate, LocalDate categoryEndDate, BigDecimal actual, boolean isActive, CategoryType categoryType, DateRange dateRange, BigDecimal incomeAmount, String incomeSource, IncomeFrequency frequency) {
        super(categoryId, categoryName, categoryDescription, budgetedAmount, categoryStartDate, categoryEndDate, actual, isActive, categoryType, dateRange);
        this.incomeCategories = new ArrayList<>();
    }

    public void addIncomeCategory(TransactionCategory category)
    {
        incomeCategories.add(category);
        // Update totals
        setBudgetedAmount(getBudgetedAmount().add(BigDecimal.valueOf(category.getBudgetedAmount())));
        setActual(getActual().add(BigDecimal.valueOf(category.getBudgetActual())));
    }

}
