package com.app.budgetbuddy.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode
public class CategoryPeriodCriteria
{
    private List<DateRange> categoryDateRanges;
    private List<BudgetPeriodAmount> budgetAmounts;
    private List<BudgetPeriodAmount> actualAmounts;

    public void addBudgetAmount(DateRange dateRange, Double amount) {
        if (budgetAmounts == null) {
            budgetAmounts = new ArrayList<>();
        }
        budgetAmounts.add(new BudgetPeriodAmount(dateRange, amount));
    }

    public void addActualAmount(DateRange dateRange, Double amount) {
        if (actualAmounts == null) {
            actualAmounts = new ArrayList<>();
        }
        actualAmounts.add(new BudgetPeriodAmount(dateRange, amount));
    }

    public Double getBudgetAmount(DateRange dateRange) {
        return budgetAmounts.stream()
                .filter(dra -> dra.getDateRange().equals(dateRange))
                .findFirst()
                .map(BudgetPeriodAmount::getAmount)
                .orElse(null);
    }

    public Double getActualAmount(DateRange dateRange) {
        return actualAmounts.stream()
                .filter(dra -> dra.getDateRange().equals(dateRange))
                .findFirst()
                .map(BudgetPeriodAmount::getAmount)
                .orElse(null);
    }

}
