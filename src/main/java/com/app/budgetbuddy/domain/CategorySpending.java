package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class CategorySpending
{
    private String categoryName;
    private BigDecimal actualSpending;

    public CategorySpending(String categoryName, BigDecimal actualSpending)
    {
        this.categoryName = categoryName;
        this.actualSpending = actualSpending;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CategorySpending that = (CategorySpending) o;
        return Objects.equals(categoryName, that.categoryName) && Objects.equals(actualSpending, that.actualSpending);
    }

    @Override
    public int hashCode() {
        return Objects.hash(categoryName, actualSpending);
    }
}
