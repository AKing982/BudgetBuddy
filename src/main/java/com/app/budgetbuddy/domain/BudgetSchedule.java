package com.app.budgetbuddy.domain;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Data
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@Builder
public class BudgetSchedule
{
    private Long budgetScheduleId;
    private Long budgetId;
    private LocalDate startDate;
    private LocalDate endDate;
    private DateRange scheduleRange;
    private Period period;
    private int totalPeriods;
    private String status;
    private LocalDateTime createdDate;

    public BudgetSchedule(Long budgetScheduleId, Long budgetId, LocalDate startDate, LocalDate endDate, int totalPeriods, String status){
        this.budgetScheduleId = budgetScheduleId;
        this.budgetId = budgetId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.scheduleRange = new DateRange(startDate, endDate);
        this.totalPeriods = totalPeriods;
        this.status = status;
        this.createdDate = LocalDateTime.now();
    }

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

    @Override
    public String toString() {
        return "BudgetSchedule{" +
                "budgetScheduleId=" + budgetScheduleId +
                ", budgetId=" + budgetId +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                ", scheduleRange=" + scheduleRange +
                ", totalPeriods=" + totalPeriods +
                ", status='" + status + '\'' +
                ", createdDate=" + createdDate +
                '}';
    }
}
