package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Data
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BudgetSchedule
{
    private Long budgetScheduleId;
    private Long budgetId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String scheduleRange;
    private int totalPeriods;
    private String status;
    private LocalDateTime createdDate;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BudgetSchedule that = (BudgetSchedule) o;
        return totalPeriods == that.totalPeriods && Objects.equals(budgetScheduleId, that.budgetScheduleId) && Objects.equals(budgetId, that.budgetId) && Objects.equals(startDate, that.startDate) && Objects.equals(endDate, that.endDate) && Objects.equals(scheduleRange, that.scheduleRange) && Objects.equals(status, that.status) && Objects.equals(createdDate, that.createdDate);
    }

    @Override
    public int hashCode() {
        return Objects.hash(budgetScheduleId, budgetId, startDate, endDate, scheduleRange, totalPeriods, status, createdDate);
    }
}
