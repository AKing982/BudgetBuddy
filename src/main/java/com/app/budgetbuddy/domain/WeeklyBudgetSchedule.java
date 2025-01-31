package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class WeeklyBudgetSchedule extends BudgetSchedule
{
    private List<DateRange> weeklyDateRanges = new ArrayList<>();
    private Map<DateRange, BigDecimal> weeklyBudgets = new HashMap<>();

    public WeeklyBudgetSchedule(Long budgetScheduleId, Long budgetId, LocalDate startDate, LocalDate endDate, Period period, int totalPeriods, String status)
    {
        super(budgetScheduleId, budgetId, startDate, endDate, period, totalPeriods, status);
//        this.initializeWeeklyDateRanges();
    }

    @Override
    public void initializeBudgetDateRanges()
    {
        super.initializeBudgetDateRanges();
    }

    public void initializeWeeklyDateRanges(){
        List<BudgetScheduleRange> budgetScheduleRanges = getBudgetScheduleRanges();
        this.weeklyDateRanges = budgetScheduleRanges.stream()
                .map(BudgetScheduleRange::getBudgetDateRange)        // get the DateRange field
                .filter(Objects::nonNull)                            // guard against null
                .map(DateRange::splitIntoWeeks)                      // split each DateRange into a list of weekly sub-ranges
                .flatMap(List::stream)                               // flatten all lists into one stream
                .collect(Collectors.toList());
    }
}
