package com.app.budgetbuddy.domain;

import lombok.Getter;
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
public class BiWeeklyBudgetSchedule extends BudgetSchedule
{
    private List<DateRange> biweeklyDateRanges = new ArrayList<>();
    private Map<DateRange, BigDecimal> biWeeklyBudgets = new HashMap<>();

    public BiWeeklyBudgetSchedule(Long budgetScheduleId, Long budgetId, LocalDate startDate, LocalDate endDate, Period period, int totalPeriods, String status) {
        super(budgetScheduleId, budgetId, startDate, endDate, period, totalPeriods, status);
        this.initializeBiWeeklyBudgetSchedule();
    }

    public void initializeBiWeeklyBudgetSchedule() {
        List<DateRange> budgetDateRanges = getBudgetDateRanges();
        this.biweeklyDateRanges = budgetDateRanges.stream()
                .map(DateRange::splitIntoBiWeeks)
                .flatMap(List::stream)
                .collect(Collectors.toList());
    }
}
