package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Objects;

@Getter
@Setter(AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BudgetPeriodParams
{
    private Category category;
    private BigDecimal budgeted;
    private BigDecimal actual;
    private BigDecimal remaining;

    public BudgetPeriodParams(Category category, BigDecimal budgeted, BigDecimal actual, BigDecimal remaining) {
        this.category = category;
        this.budgeted = budgeted;
        this.actual = actual;
        this.remaining = remaining;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BudgetPeriodParams that = (BudgetPeriodParams) o;
        return Objects.equals(category, that.category) && Objects.equals(budgeted, that.budgeted) && Objects.equals(actual, that.actual) && Objects.equals(remaining, that.remaining);
    }

    @Override
    public int hashCode() {
        return Objects.hash(category, budgeted, actual, remaining);
    }
}
