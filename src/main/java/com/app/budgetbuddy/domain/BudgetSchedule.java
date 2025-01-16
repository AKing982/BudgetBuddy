package com.app.budgetbuddy.domain;

import lombok.*;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Data
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@Builder
@Slf4j
public class BudgetSchedule
{
    private Long budgetScheduleId;
    private Long budgetId;
    private LocalDate startDate;
    private LocalDate endDate;
    private DateRange scheduleRange;
    private List<DateRange> budgetDateRanges;
    private Period period;
    private int totalPeriods;
    private String status;
    private LocalDateTime createdDate;

    public BudgetSchedule(Long budgetScheduleId, Long budgetId, LocalDate startDate, LocalDate endDate, Period period, int totalPeriods, String status){
        this.budgetScheduleId = budgetScheduleId;
        this.budgetId = budgetId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.period = period;
        this.scheduleRange = new DateRange(startDate, endDate);
        this.totalPeriods = totalPeriods;
        this.budgetDateRanges = new ArrayList<>();
        this.status = status;
        this.createdDate = LocalDateTime.now();
    }

    public void initializeBudgetDateRanges()
    {
        DateRange scheduleRange = getScheduleRange();
        this.budgetDateRanges = new ArrayList<>();
        if(scheduleRange != null)
        {
            log.info("Schedule Range: {}", scheduleRange.toString());
            List<DateRange> budgetDateRanges = getScheduleRange().splitIntoWeeks();
            log.info("Budget DateRanges: {}", budgetDateRanges.toString());
            this.budgetDateRanges.addAll(budgetDateRanges);
            log.info("Budget DateRanges Size: {}", budgetDateRanges.size());
        }
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
