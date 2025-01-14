package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

@Getter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@Component
@ToString
public class BudgetStats
{
    private Long budgetId;
    private BigDecimal totalBudget;
    private BigDecimal totalSpent;
    private BigDecimal remaining;
    private BigDecimal totalSaved;
    private BigDecimal averageSpendingPerDay;
    private DateRange dateRange;
    private BigDecimal healthScore;
    private BigDecimal monthlyProjection;

    public BudgetStats(Long budgetId, BigDecimal totalBudget, BigDecimal totalSpent, BigDecimal remaining, BigDecimal totalSaved, BigDecimal averageSpendingPerDay, DateRange dateRange){
        this.budgetId = budgetId;
        this.totalBudget = totalBudget;
        this.totalSpent = totalSpent;
        this.remaining = remaining;
        this.totalSaved = totalSaved;
        this.averageSpendingPerDay = averageSpendingPerDay;
        this.dateRange = dateRange;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BudgetStats that = (BudgetStats) o;
        return Objects.equals(budgetId, that.budgetId) && Objects.equals(totalBudget, that.totalBudget) && Objects.equals(totalSpent, that.totalSpent) && Objects.equals(remaining, that.remaining) && Objects.equals(totalSaved, that.totalSaved) && Objects.equals(averageSpendingPerDay, that.averageSpendingPerDay) && Objects.equals(dateRange, that.dateRange);
    }

    @Override
    public int hashCode() {
        return Objects.hash(budgetId, totalBudget, totalSpent, remaining, totalSaved, averageSpendingPerDay, dateRange);
    }
}
