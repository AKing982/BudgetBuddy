package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.Objects;

@Getter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@Slf4j
public class WeekNumber
{
    private int weekNumber;
    private DateRange dateRange;
    private int year;

    public WeekNumber(int number, int year, DateRange range)
    {
        this.weekNumber = number;
        this.dateRange = range;
        this.year = year;
    }

    public int getMonthByWeekNumberAndDateRange(int weekNumber, DateRange dateRange)
    {
        if(dateRange == null)
        {
            log.warn("DateRange is null for weekNumber: {}", weekNumber);
            return 0;
        }
        // use the start date of the range to determine the month
        return dateRange.getStartDate().getMonthValue();
    }

    public int getWeekNumberByDateRange(final DateRange dateRange)
    {
        if(dateRange == null)
        {
            log.warn("DateRange is null");
            return 0;
        }
        return dateRange.getStartDate()
                .get(java.time.temporal.IsoFields.WEEK_OF_WEEK_BASED_YEAR);
    }

    public DateRange getDateRangeByWeekNumber(int weekNumber)
    {
        if(weekNumber <= 0 || weekNumber > 53)
        {
            log.warn("Invalid weekNumber: {}", weekNumber);
            return null;
        }
        return getDateRangeByWeekNumberAndYear(weekNumber, this.year);
    }

    public DateRange getDateRangeByWeekNumberAndYear(int weekNumber, int year)
    {
        if(weekNumber <= 0 || weekNumber > 53)
        {
            log.warn("Invalid weekNumber: {} for year: {}", weekNumber, year);
            return null;
        }
        try
        {
            // ISO weeks start on Monday
            LocalDate weekStart = LocalDate.of(year, 1, 1)
                    .with(java.time.temporal.IsoFields.WEEK_OF_WEEK_BASED_YEAR, weekNumber)
                    .with(java.time.DayOfWeek.MONDAY);
            LocalDate weekEnd = weekStart.plusDays(6);
            return new DateRange(weekStart, weekEnd);
        }
        catch(Exception e)
        {
            log.error("Error deriving date range for weekNumber: {} year: {}", weekNumber, year, e);
            return null;
        }
    }

    public static WeekNumber of(LocalDate date)
    {
        if(date == null)
        {
            throw new IllegalArgumentException("Date is required");
        }
        int isoWeek = date.get(java.time.temporal.IsoFields.WEEK_OF_WEEK_BASED_YEAR);
        int year = date.get(java.time.temporal.IsoFields.WEEK_BASED_YEAR);
        LocalDate weekStart = date.with(java.time.DayOfWeek.MONDAY);
        LocalDate weekEnd = weekStart.plusDays(6);
        return new WeekNumber(isoWeek, year, new DateRange(weekStart, weekEnd));
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        WeekNumber that = (WeekNumber) o;
        return weekNumber == that.weekNumber &&
                year == that.year &&
                Objects.equals(dateRange, that.dateRange);
    }

    @Override
    public int hashCode() {
        return Objects.hash(weekNumber, year, dateRange);
    }

    @Override
    public String toString() {
        return "WeekNumber{" +
                "weekNumber=" + weekNumber +
                ", year=" + year +
                ", dateRange=" + dateRange +
                '}';
    }
}
