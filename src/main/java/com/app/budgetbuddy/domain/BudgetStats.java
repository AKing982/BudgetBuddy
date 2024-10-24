package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Objects;

@Getter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@Component
public class BudgetStats
{
    private Long budgetId;
    private BigDecimal totalBudget;
    private BigDecimal totalSpent;
    private BigDecimal remaining;

    public BudgetStats(Long budgetId, BigDecimal totalBudget, BigDecimal totalSpent, BigDecimal remaining){
        this.budgetId = budgetId;
        this.totalBudget = totalBudget;
        this.totalSpent = totalSpent;
        this.remaining = remaining;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BudgetStats that = (BudgetStats) o;
        return Objects.equals(budgetId, that.budgetId) && Objects.equals(totalBudget, that.totalBudget) && Objects.equals(totalSpent, that.totalSpent) && Objects.equals(remaining, that.remaining);
    }

    @Override
    public int hashCode() {
        return Objects.hash(budgetId, totalBudget, totalSpent, remaining);
    }
}