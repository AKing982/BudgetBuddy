package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Objects;

@Getter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
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
        return 0;
    }

    public int getWeekNumberByDateRange(final DateRange dateRange)
    {
        return 0;
    }

    public DateRange getDateRangeByWeekNumber(int weekNumber)
    {
        return null;
    }

    public DateRange getDateRangeByWeekNumberAndYear(int weekNumber, int year)
    {
        return null;
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
