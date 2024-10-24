package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class DateRange
{
    private LocalDate startDate;
    private LocalDate endDate;

    public DateRange(LocalDate startDate, LocalDate endDate){
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public List<DateRange> splitByPeriod(Period period){
        return null;
    }

    public Integer getDateRangeDifference(LocalDate startDate, LocalDate endDate){
        return null;
    }

    public DateRange incrementNextPeriod(Period period){
        return null;
    }

    public List<DateRange> splitIntoDays(){
        return null;
    }

    public List<DateRange> splitIntoWeeks(){
        return null;
    }

    public List<DateRange> splitIntoBiWeeks(){
        return null;
    }

    public List<DateRange> splitIntoMonths(){
        return null;
    }

    public DateRange incrementToPreviousPeriod(Period period){
        return null;
    }

    public boolean containsDate(LocalDate date){
        return false;
    }

    public boolean dateOverlaps(DateRange otherDateRange){
        return false;
    }

    public boolean isWithinMonth(LocalDate date){
        return false;
    }

    public long getDaysInRange(){
        return 0;
    }

    public long getMonthsInRange(){
        return 0;
    }

    public long getWeeksInRange(){
        return 0;
    }

    public long getYearsInRange(){
        return 0;
    }

    public long getBiWeeksInRange(){
        return 0;
    }

    public String formatDateRange(){
        return "";
    }

}
