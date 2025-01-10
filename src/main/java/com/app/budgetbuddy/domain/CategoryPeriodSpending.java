package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@ToString
public class CategoryPeriodSpending
{
    private String categoryId;
    private String categoryName;
    private BigDecimal actualSpending;
    private LocalDate spendingDate;
    private DateRange dateRange;

    public CategoryPeriodSpending(String categoryId, String categoryName, BigDecimal actualSpending)
    {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.actualSpending = actualSpending;
    }

    public CategoryPeriodSpending(String categoryName, BigDecimal actualSpending, DateRange dateRange) {
        this.categoryName = categoryName;
        this.actualSpending = actualSpending;
        this.dateRange = dateRange;
    }


    public CategoryPeriodSpending(String categoryId, String categoryName, BigDecimal actualSpending, DateRange dateRange) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.actualSpending = actualSpending;
        this.dateRange = dateRange;
    }

    public CategoryPeriodSpending(String categoryName, BigDecimal actualSpending)
    {
        this.categoryName = categoryName;
        this.actualSpending = actualSpending;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CategoryPeriodSpending that = (CategoryPeriodSpending) o;
        return Objects.equals(categoryName, that.categoryName) && Objects.equals(actualSpending, that.actualSpending);
    }

    @Override
    public int hashCode() {
        return Objects.hash(categoryName, actualSpending);
    }
}
