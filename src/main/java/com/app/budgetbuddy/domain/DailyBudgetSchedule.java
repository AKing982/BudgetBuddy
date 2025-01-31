package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
public class DailyBudgetSchedule extends BudgetSchedule
{
    private List<DateRange> dailyDates = new ArrayList<>();

    public DailyBudgetSchedule(Long budgetScheduleId, Long budgetId, LocalDate startDate, LocalDate endDate, Period period, int totalPeriods, String status, List<LocalDate> dailyDates) {
        super(budgetScheduleId, budgetId, startDate, endDate, period, totalPeriods, status);

    }

//   public void initializeDailyDates(){
//        List<DateRange> budgetDateRanges = getBudgetScheduleRanges();
//        this.dailyDates = budgetDateRanges.stream()
//                .map(DateRange::splitIntoDays)
//                .flatMap(List::stream)
//                .collect(Collectors.toList());
//   }
}
