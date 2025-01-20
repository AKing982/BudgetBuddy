package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
        this.initializeWeeklyDateRanges();
    }

    @Override
    public void initializeBudgetDateRanges()
    {
        super.initializeBudgetDateRanges();
    }

    public void initializeWeeklyDateRanges(){
        List<DateRange> budgetDateRanges = getBudgetDateRanges();
        this.weeklyDateRanges = budgetDateRanges.stream()
                .map(DateRange::splitIntoWeeks)
                .flatMap(List::stream)
                .collect(Collectors.toList());
    }
}
