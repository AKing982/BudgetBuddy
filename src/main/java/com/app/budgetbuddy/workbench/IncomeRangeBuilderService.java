package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.domain.PostedDateInfo;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.services.TransactionCategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Slf4j
public class IncomeRangeBuilderService
{
    private final TransactionCategoryService transactionCategoryService;

    @Autowired
    public IncomeRangeBuilderService(TransactionCategoryService transactionCategoryService)
    {
        this.transactionCategoryService = transactionCategoryService;
    }

    private Map<String, List<SubBudget>> splitSubBudgetsByCurrentDate(final List<SubBudget> subBudgets)
    {
        LocalDate currentDate = LocalDate.now();
        Map<String, List<SubBudget>> splitSubBudgets = new HashMap<>();
        List<SubBudget> pastSubBudgets = new ArrayList<>();
        List<SubBudget> futureSubBudgets = new ArrayList<>();
        for(SubBudget subBudget : subBudgets)
        {
            if(subBudget.getEndDate().isBefore(currentDate))
            {
                pastSubBudgets.add(subBudget);
            }
            else
            {
                futureSubBudgets.add(subBudget);
            }
        }
        splitSubBudgets.put("past", pastSubBudgets);
        splitSubBudgets.put("future", futureSubBudgets);
        return splitSubBudgets;
    }

    private PostedDateInfo calculatePostedDateDifference(final List<LocalDate> pastPostedDates, final List<SubBudget> subBudgets)
    {
        if(pastPostedDates == null || pastPostedDates.isEmpty() || subBudgets == null || subBudgets.isEmpty())
        {
            return new PostedDateInfo(0, null);
        }
        LocalDate today = LocalDate.now();
        List<LocalDate> sortedDates = sortPastPostedDates(pastPostedDates);
        long totalDaysBetween = 0;
        long totalInterval = 0;
        for(SubBudget subBudget : subBudgets)
        {
            LocalDate startDate = subBudget.getStartDate();
            LocalDate endDate = subBudget.getEndDate();
            for(int i = 0; i < sortedDates.size() - 1; i++)
            {
                LocalDate current = sortedDates.get(i);
                LocalDate next = sortedDates.get(i + 1);
                if(!current.isBefore(startDate) && !next.isAfter(endDate))
                {
                    totalDaysBetween += ChronoUnit.DAYS.between(current, next);
                    totalInterval++;
                }
            }
        }
        LocalDate lastPostedDate = sortedDates.stream()
                .filter(d -> d.isBefore(today))
                .reduce((first, second) -> second)
                .orElse(null);
        log.info("Last Posted Date: " + lastPostedDate);
        long daysBetween = totalDaysBetween / totalInterval;
        PostedDateInfo postedDateInfo = new PostedDateInfo(daysBetween, lastPostedDate);
        log.info("Posted Date Info: " + postedDateInfo.toString());
        return postedDateInfo;
    }

    private List<LocalDate> sortPastPostedDates(List<LocalDate> pastPostedDates)
    {
        if(pastPostedDates == null || pastPostedDates.isEmpty())
        {
            return Collections.emptyList();
        }
        List<LocalDate> sortedDates = new ArrayList<>(pastPostedDates);
        Collections.sort(sortedDates);
        return sortedDates;
    }

    private boolean isDateInMonthRange(LocalDate date, LocalDate startDate, LocalDate endDate)
    {
        return date.isAfter(startDate) && date.isBefore(endDate);
    }

    List<DateRange> generateFutureIncomeRanges(List<SubBudget> subBudgets, List<LocalDate> pastPostedDates)
    {
        if((pastPostedDates == null || pastPostedDates.isEmpty()) || (subBudgets == null || subBudgets.isEmpty()))
        {
            return Collections.emptyList();
        }
        List<DateRange> futureIncomeRanges = new ArrayList<>();
        PostedDateInfo lastPostedDateInfo = calculatePostedDateDifference(pastPostedDates, subBudgets);
        List<SubBudget> futureSubBudgets = splitSubBudgetsByCurrentDate(subBudgets).get("future");
        LocalDate lastPostedDate = lastPostedDateInfo.lastPostedDate();
        long daysBetweenPosted = lastPostedDateInfo.avgDaysBetween();
        LocalDate rangeStart = lastPostedDate;
        for(SubBudget subBudget : futureSubBudgets)
        {
            LocalDate startDate = subBudget.getStartDate();
            LocalDate endDate = subBudget.getEndDate();
            if(isDateInMonthRange(lastPostedDate, startDate, endDate))
            {
                rangeStart = lastPostedDate;
            }
            while(!rangeStart.isAfter(endDate))
            {
                futureIncomeRanges.add(new DateRange(rangeStart, rangeStart.plusDays(daysBetweenPosted)));
                rangeStart = rangeStart.plusDays(daysBetweenPosted + 1);
            }
        }
        return futureIncomeRanges;
    }

    private List<DateRange> createPastIncomeRanges(List<LocalDate> pastPostedDates, Integer startDay)
    {
        pastPostedDates.sort(LocalDate::compareTo);
        if(startDay != null && !pastPostedDates.isEmpty())
        {
            pastPostedDates.set(0, pastPostedDates.get(0).withDayOfMonth(startDay));
        }
        List<DateRange> incomeRanges = new ArrayList<>();
        for(int i = 0; i < pastPostedDates.size() - 1; i++)
        {
            LocalDate current = pastPostedDates.get(i);
            LocalDate dayPriorNext = pastPostedDates.get(i + 1).minusDays(1);
            incomeRanges.add(new DateRange(current, dayPriorNext));
        }
        return incomeRanges;
    }

    public List<DateRange> generateStandardIncomeRanges(final List<SubBudget> subBudgets, Integer startDay)
    {
        if(subBudgets == null || subBudgets.isEmpty())
        {
            return Collections.emptyList();
        }
        List<DateRange> incomeRanges = new ArrayList<>();
        List<LocalDate> allPastPostedDates = new ArrayList<>();
        List<SubBudget> pastSubBudgets = splitSubBudgetsByCurrentDate(subBudgets).get("past");
        for(int i = 0; i < pastSubBudgets.size(); i++)
        {
            SubBudget subBudget = subBudgets.get(i);
            Long userId = subBudget.getBudget().getUserId();
            Long subBudgetId = subBudget.getId();
            LocalDate startDate = (i == 0 && startDay != null) ? subBudget.getStartDate().withDayOfMonth(startDay) : subBudget.getStartDate();
            LocalDate endDate = subBudget.getEndDate();
            allPastPostedDates.addAll(transactionCategoryService.getIncomePostedDatesByDateShift(userId, subBudgetId, startDate, endDate));
        }
        List<DateRange> futureIncomeRanges = generateFutureIncomeRanges(subBudgets, allPastPostedDates);
        List<DateRange> pastIncomeRanges = createPastIncomeRanges(allPastPostedDates, startDay);
        incomeRanges.addAll(pastIncomeRanges);
        incomeRanges.addAll(futureIncomeRanges);
        return incomeRanges;
    }
}
