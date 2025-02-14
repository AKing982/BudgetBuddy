package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetScheduleRange;
import com.app.budgetbuddy.domain.DateRange;

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

            // Only combine if they are consecutive weeks
            if (firstWeek.getEndRange().plusDays(1).equals(secondWeek.getStartRange()))
            {
                DateRange biWeeklyRange = new DateRange(
                        firstWeek.getStartRange(),
                        secondWeek.getEndRange());

                BudgetScheduleRange biWeeklySchedule = new BudgetScheduleRange(
                        firstWeek.getBudgetScheduleId(),  // Use first week's ID
                        firstWeek.getStartRange(),
                        secondWeek.getEndRange(),
                        firstWeek.getBudgetedAmount().add(secondWeek.getBudgetedAmount()),
                        firstWeek.getSpentOnRange().add(secondWeek.getSpentOnRange()),
                        biWeeklyRange,
                        "BIWEEKLY",
                        false
                );

                budgetScheduleRanges.add(biWeeklySchedule);
            }
        }

        return budgetScheduleRanges;
    }
}
