package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

@Data
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@ToString
@Builder
public class BudgetScheduleRange
{
    private Long budgetScheduleId;
    private LocalDate startRange;
    private LocalDate endRange;
    private int daysInRange;
    private BigDecimal budgetedAmount;
    private BigDecimal spentOnRange;
    private DateRange budgetDateRange;
    private String rangeType;
    private boolean isSingleDate;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BudgetScheduleRange that = (BudgetScheduleRange) o;
        return daysInRange == that.daysInRange && Objects.equals(budgetScheduleId, that.budgetScheduleId) && Objects.equals(startRange, that.startRange) && Objects.equals(endRange, that.endRange) && Objects.equals(budgetedAmount, that.budgetedAmount) && Objects.equals(spentOnRange, that.spentOnRange) && Objects.equals(rangeType, that.rangeType);
    }

    @Override
    public int hashCode() {
        return Objects.hash(budgetScheduleId, startRange, endRange, daysInRange, budgetedAmount, spentOnRange, rangeType);
    }
}
