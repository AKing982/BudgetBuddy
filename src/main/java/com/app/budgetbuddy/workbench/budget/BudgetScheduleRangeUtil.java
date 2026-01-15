package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetScheduleRange;
import com.app.budgetbuddy.domain.DateRange;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class BudgetScheduleRangeUtil
{
    public static List<BudgetScheduleRange> buildBiWeeklyBudgetScheduleRanges(List<BudgetScheduleRange> originalBudgetScheduleRanges)
    {
        List<BudgetScheduleRange> budgetScheduleRanges = new ArrayList<>();
        // First sort by start date to ensure proper order
        List<BudgetScheduleRange> sortedRanges = originalBudgetScheduleRanges.stream()
                .sorted(Comparator.comparing(BudgetScheduleRange::getStartRange))
                .toList();

        // Group into bi-weekly ranges
        for (int i = 0; i < sortedRanges.size() - 1; i += 2)
        {
            BudgetScheduleRange firstWeek = sortedRanges.get(i);
            BudgetScheduleRange secondWeek = sortedRanges.get(i + 1);
            BigDecimal spentOnFirstWeek = firstWeek.getSpentOnRange();
            // Only combine if they are consecutive weeks
            if (firstWeek.getEndRange().plusDays(1).equals(secondWeek.getStartRange()))
            {
                BudgetScheduleRange biWeeklySchedule = BudgetScheduleRange.builder()
                        .id(firstWeek.getId())  // Use first week's ID
                        .budgetScheduleId(firstWeek.getBudgetScheduleId())
                        .startRange(firstWeek.getStartRange())
                        .endRange(secondWeek.getEndRange())
                        .budgetedAmount(firstWeek.getBudgetedAmount().add(secondWeek.getBudgetedAmount()))
                        .spentOnRange(firstWeek.getSpentOnRange().add(secondWeek.getSpentOnRange()))
                        .budgetDateRange(new DateRange(firstWeek.getStartRange(), secondWeek.getEndRange()))
                        .rangeType("BIWEEKLY")
                        .build();

                budgetScheduleRanges.add(biWeeklySchedule);
            }
        }

        return budgetScheduleRanges;
    }
}
