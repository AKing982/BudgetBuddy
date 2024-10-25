package com.app.budgetbuddy.domain;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Embeddable
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class Category
{
    private String categoryId;
    private String categoryName;
    private String categoryDescription;
    private BigDecimal budgetedAmount;
    private LocalDate categoryStartDate;
    private LocalDate categoryEndDate;
    private BigDecimal actual;
    private boolean isActive;
    private CategoryType categoryType;

    public Category(String categoryId, String categoryName, String categoryDescription, BigDecimal budgetedAmount, LocalDate categoryStartDate, LocalDate categoryEndDate, BigDecimal actual, boolean isActive, CategoryType categoryType) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.categoryDescription = categoryDescription;
        this.budgetedAmount = budgetedAmount;
        this.categoryStartDate = categoryStartDate;
        this.categoryEndDate = categoryEndDate;
        this.actual = actual;
        this.isActive = isActive;
        this.categoryType = categoryType;
    }
}
