package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.jetbrains.annotations.NotNull;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class DateRange implements Comparable<DateRange>
{
    private LocalDate startDate;
    private LocalDate endDate;

    public DateRange(LocalDate startDate, LocalDate endDate){
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public List<DateRange> splitByPeriod(Period period){
        switch(period)
        {
            case MONTHLY -> {
                return splitIntoMonths();
            }
            case WEEKLY -> {
                return splitIntoWeeks();
            }
            case BIWEEKLY -> {
                return splitIntoBiWeeks();
            }
            case DAILY -> {
                return splitIntoDays();
            }
            default -> {
                throw new UnsupportedOperationException("Unsupported period: " + period);
            }
        }
    }

    public Integer getDateRangeDifference(LocalDate startDate, LocalDate endDate){
        return Math.toIntExact(ChronoUnit.DAYS.between(startDate, endDate));
    }

    public DateRange incrementNextPeriod(Period period){
        switch(period)
        {
            case MONTHLY -> {
                return new DateRange(startDate.plusMonths(1), endDate.plusMonths(1));
            }
            case WEEKLY -> {
                return new DateRange(startDate.plusWeeks(1), endDate.plusWeeks(1));
            }
            case BIWEEKLY -> {
                return new DateRange(startDate.plusWeeks(2), endDate.plusWeeks(2));
            }
            case DAILY -> {
                return new DateRange(startDate.plusDays(1), endDate.plusDays(1));
            }
            default -> {
                throw new UnsupportedOperationException("Unsupported period: " + period);
            }
        }
    }

    public List<DateRange> splitIntoDays(){
        List<DateRange> dateRanges = new ArrayList<>();
        LocalDate current = startDate;
        while(!current.isAfter(endDate)){
            dateRanges.add(new DateRange(current, current));
            current = current.plusDays(1);
        }
        return dateRanges;
    }

    public List<DateRange> splitIntoWeeks(){
        List<DateRange> dateRanges = new ArrayList<>();
        LocalDate current = startDate;
        while(!current.isAfter(endDate)){
            dateRanges.add(new DateRange(current, current));
            current = current.plusWeeks(1);
        }
        return dateRanges;
    }

    public List<DateRange> splitIntoBiWeeks(){
        List<DateRange> dateRanges = new ArrayList<>();
        LocalDate current = startDate;
        while(!current.isAfter(endDate)){
            dateRanges.add(new DateRange(current, current));
            current = current.plusWeeks(2);
        }
        return dateRanges;
    }

    public List<DateRange> splitIntoMonths(){
        List<DateRange> dateRanges = new ArrayList<>();
        LocalDate current = startDate;
        while(!current.isAfter(endDate)){
            dateRanges.add(new DateRange(current, current));
            current = current.plusMonths(1);
        }
        return dateRanges;
    }

    public DateRange incrementToPreviousPeriod(Period period){
        switch(period)
        {
            case MONTHLY -> {
                return new DateRange(startDate.minusMonths(1), endDate.minusMonths(1));
            }
            case WEEKLY -> {
                return new DateRange(startDate.minusWeeks(1), endDate.minusWeeks(1));
            }
            case BIWEEKLY -> {
                return new DateRange(startDate.minusWeeks(2), endDate.minusWeeks(2));
            }
            case DAILY -> {
                return new DateRange(startDate.minusDays(1), endDate.minusDays(1));
            }
            default -> {
                throw new UnsupportedOperationException("Unsupported period: " + period);
            }
        }

    }

    public boolean containsDate(LocalDate date){
        return (date.isEqual(startDate) || date.isAfter(startDate) && (date.isEqual(endDate) || date.isBefore(endDate)));
    }

    public boolean dateOverlaps(DateRange otherDateRange){
        return this.startDate.isBefore(otherDateRange.endDate) && otherDateRange.startDate.isBefore(this.endDate);
    }

    public boolean isWithinMonth(LocalDate startDate, LocalDate endDate){
        long daysDifference = ChronoUnit.DAYS.between(startDate, endDate);
        return daysDifference >= 0 && daysDifference <= 31;
    }

    public boolean isWithinMonth(LocalDate date){
        return date.getYear() == startDate.getYear() && date.getMonth() == startDate.getMonth();
    }

    public boolean isWithinBiWeek(LocalDate date){
        long daysDifference = ChronoUnit.DAYS.between(startDate, date);
        return daysDifference >= 0 && daysDifference <= 14;
    }

    public boolean isWithinWeek(LocalDate date){
        long daysDifference = ChronoUnit.DAYS.between(startDate, date);
        return daysDifference >= 0 && daysDifference <= 7;
    }

    public boolean isWithinWeek(LocalDate startDate, LocalDate endDate)
    {
        long daysDifference = ChronoUnit.DAYS.between(startDate, endDate);
        return daysDifference >= 0 && daysDifference <= 7;
    }

    public long getDaysInRange(){
        return ChronoUnit.DAYS.between(startDate, endDate) + 1;
    }

    public long getMonthsInRange(){
        return ChronoUnit.MONTHS.between(startDate, endDate);
    }

    public long getWeeksInRange(){
        return ChronoUnit.WEEKS.between(startDate, endDate);
    }

    public long getYearsInRange(){
        return ChronoUnit.YEARS.between(startDate, endDate);
    }

    public long getBiWeeksInRange(){
        return getDaysInRange() / 14;
    }

    public String formatDateRange(){
        return String.format("%s to %s", startDate, endDate);
    }

    @Override
    public int compareTo(@NotNull DateRange o) {
        int result = this.startDate.compareTo(o.startDate);
        if(result == 0){
            result = this.endDate.compareTo(o.endDate);
        }
        return result;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DateRange dateRange = (DateRange) o;
        return Objects.equals(startDate, dateRange.startDate) && Objects.equals(endDate, dateRange.endDate);
    }

    @Override
    public int hashCode() {
        return Objects.hash(startDate, endDate);
    }
}
