package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

@Data
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@ToString
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class BudgetScheduleRange
{
    private Long id;
    private Long budgetScheduleId;
    private BigDecimal spentOnRange;
    private BigDecimal budgetedAmount;
    private DateRange budgetDateRange;
    private String rangeType;
    private boolean isActive;
    private LocalDate startRange;
    private LocalDate endRange;
    private boolean isSingleDate;

    public BudgetScheduleRange(BigDecimal spentOnRange, String rangeType, boolean isActive, LocalDate startDate, LocalDate endDate, Long id, Long budgetScheduleId, BigDecimal budgetedAmount, DateRange budgetDateRange) {
        this.id = id;
        this.budgetScheduleId = budgetScheduleId;
        this.budgetedAmount = budgetedAmount;
        this.budgetDateRange = budgetDateRange;
        this.startRange = startDate;
        this.endRange = endDate;
        this.isActive = isActive;
        this.spentOnRange = spentOnRange;
        this.rangeType = rangeType;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BudgetScheduleRange that = (BudgetScheduleRange) o;
        return Objects.equals(id, that.id) && Objects.equals(budgetScheduleId, that.budgetScheduleId) && Objects.equals(budgetedAmount, that.budgetedAmount) && Objects.equals(budgetDateRange, that.budgetDateRange);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, budgetScheduleId, budgetedAmount, budgetDateRange);
    }
}
