package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.SubBudgetGoalsService;
import com.app.budgetbuddy.services.SubBudgetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PreCalculationTrendService
{
    private List<SubBudgetTrend> subBudgetTrends = new ArrayList<>();
    private Map<DateRange, List<CategoryEntryAmount>> categoryEntryAmounts = new HashMap<>();
    private Map<DateRange, Map<EntryType, BigDecimal>> totalEntryTypeAmounts = new HashMap<>();
    private final SubBudgetService subBudgetService;
    private final SubBudgetGoalsService subBudgetGoalsService;

    @Autowired
    public PreCalculationTrendService(SubBudgetService subBudgetService, SubBudgetGoalsService subBudgetGoalsService)
    {
        this.subBudgetService = subBudgetService;
        this.subBudgetGoalsService = subBudgetGoalsService;
    }

    public BigDecimal calculateTrendPercentageFormulaForNthMonth(final Map<Integer, BigDecimal> monthSpendingMap, final int numberOfMonths)
    {
        if(monthSpendingMap.isEmpty())
        {
            return BigDecimal.ZERO;
        }
        if(monthSpendingMap.size() < numberOfMonths)
        {
            return BigDecimal.ZERO;
        }
        if(numberOfMonths == 1)
        {
            BigDecimal singleMonthTrend = BigDecimal.ZERO;
            if(monthSpendingMap.size() == 1)
            {
                BigDecimal singleMonthSpending = monthSpendingMap.get(1);
                singleMonthTrend = (singleMonthSpending.subtract(BigDecimal.ZERO)).divide(singleMonthSpending, 1, BigDecimal.ROUND_HALF_UP);
            }
            return singleMonthTrend;
        }
        else if(numberOfMonths == 2)
        {

            BigDecimal firstMonthAmount = monthSpendingMap.get(1);
            BigDecimal secondMonthAmount = monthSpendingMap.get(2);
            return (secondMonthAmount.subtract(firstMonthAmount))
                    .divide(firstMonthAmount, 10, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(1, BigDecimal.ROUND_HALF_UP);
        }
        else
        {
            BigDecimal monthTrendPercent = BigDecimal.ZERO;
            for(int i = 1; i < numberOfMonths; i++)
            {
                BigDecimal startMonthSpending = monthSpendingMap.get(i);
                BigDecimal finalMonthSpending = monthSpendingMap.get(i + 1);
                BigDecimal trend = (finalMonthSpending.subtract(startMonthSpending))
                        .divide(startMonthSpending, 10, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(1, RoundingMode.HALF_UP);
                monthTrendPercent = monthTrendPercent.add(trend);
            }
            return monthTrendPercent.divide(BigDecimal.valueOf(2), 1, RoundingMode.HALF_UP);
        }
    }

    public BigDecimal calculateTrendPercentageFormula(double monthStartAmount, double monthEndAmount, boolean enableAverage)
    {
        if(monthStartAmount == 0.0 || monthEndAmount == 0.0)
        {
            return BigDecimal.ZERO;
        }
        if(monthStartAmount < 0.0 || monthEndAmount < 0.0)
        {
            return BigDecimal.ZERO;
        }
        if(enableAverage)
        {
            BigDecimal firstMonthAmount = new BigDecimal(monthStartAmount);
            BigDecimal secondMonthAmount = new BigDecimal(monthEndAmount);
            BigDecimal trendPercent = (secondMonthAmount.subtract(firstMonthAmount))
                    .divide(firstMonthAmount, 10, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(1, RoundingMode.HALF_UP);

            return trendPercent.divide(BigDecimal.valueOf(2), 1,  RoundingMode.HALF_UP);
        }
        BigDecimal firstMonthAmount = new BigDecimal(monthStartAmount);
        BigDecimal secondMonthAmount = new BigDecimal(monthEndAmount);
        return (secondMonthAmount.subtract(firstMonthAmount))
                .divide(firstMonthAmount, 10, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(1, RoundingMode.HALF_UP);
    }

    public BigDecimal calculateTrendForNthMonthsByEntryType(final Map<Integer, Map<EntryType, BigDecimal>> monthSpendingByEntryType, final int numberOfMonths, final EntryType entryType)
    {
        if(monthSpendingByEntryType.isEmpty() || numberOfMonths <= 1 || entryType == null)
        {
            return BigDecimal.ZERO;
        }
        Map<Integer, BigDecimal> filteredByEntryType = filterMonthlySpendingMapByEntryType(entryType, monthSpendingByEntryType);
        if(numberOfMonths == 2)
        {
            if(filteredByEntryType.size() < 2)
            {
                return BigDecimal.ZERO;
            }
            BigDecimal firstMonthAmount = filteredByEntryType.get(1);
            BigDecimal secondMonthAmount = filteredByEntryType.get(2);
            return (secondMonthAmount.subtract(firstMonthAmount))
                    .divide(firstMonthAmount, 10, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(1, RoundingMode.HALF_UP);
        }
        BigDecimal trendFormula = BigDecimal.ZERO;
        for(int i = 1; i < numberOfMonths; i++)
        {
            BigDecimal firstMonth = filteredByEntryType.get(i);
            BigDecimal secondMonthAmount = filteredByEntryType.get(i + 1);
            BigDecimal trend = (secondMonthAmount.subtract(firstMonth))
                    .divide(firstMonth, 10, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(1, RoundingMode.HALF_UP);
            trendFormula = trendFormula.add(trend);
        }
        return trendFormula.divide(BigDecimal.valueOf(2), 1, RoundingMode.HALF_UP);
    }

    private Map<Integer, BigDecimal> filterMonthlySpendingMapByEntryType(EntryType entryType, Map<Integer, Map<EntryType, BigDecimal>> monthSpendingByEntryType)
    {
        return monthSpendingByEntryType.entrySet().stream()
                .filter(e -> e.getValue().containsKey(entryType) && e.getValue().get(entryType) != null)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> e.getValue().get(entryType)
                ));
    }

    public List<PreWeeklyTrend> createWeeklyTrends(final List<CategoryEntryAmount> categoryEntryAmounts, final BudgetSchedule budgetSchedule)
    {
        return null;
    }

    public List<SubBudgetTrend> createSubBudgetTrendsByEntryType(final Map<DateRange, Map<EntryType, BigDecimal>> monthlyTotalEntryAmounts, final Long userId)
    {
        if(monthlyTotalEntryAmounts.isEmpty())
        {
            return Collections.emptyList();
        }
        for(Map.Entry<DateRange, Map<EntryType, BigDecimal>> entry : monthlyTotalEntryAmounts.entrySet())
        {
            DateRange monthRange = entry.getKey();
            Optional<SubBudget> subBudget = subBudgetService.getSubBudgetsByUserIdAndDate(userId, monthRange.getStartDate(), monthRange.getEndDate());
            if(subBudget.isEmpty())
            {
                return Collections.emptyList();
            }
            SubBudget subBudget1 = subBudget.get();
            SubBudgetGoals subBudgetGoals = subBudgetGoalsService.getSubBudgetGoalsEntitiesBySubBudgetId(subBudget1.getId());
            BigDecimal subBudgetGoalAmount = subBudgetGoals.getSavingsTarget();
            Map<EntryType, BigDecimal> monthSpendingByEntryType = entry.getValue();
            SubBudgetTrend subBudgetTrend = new SubBudgetTrend();
            for(EntryType entryType : monthSpendingByEntryType.keySet())
            {
                subBudgetTrend.setSubBudgetId(subBudget1.getId());
                subBudgetTrend.setMonthRange(monthRange);
                BigDecimal entryAmount = monthSpendingByEntryType.get(entryType);
                if(entryType.equals(EntryType.FIXED_EXPENSE))
                {
                    subBudgetTrend.setMonthlyFixedExpenses(entryAmount.doubleValue());
                }
                else if(entryType.equals(EntryType.VARIABLE_EXPENSE))
                {
                    subBudgetTrend.setMonthlyVariableExpenses(entryAmount.doubleValue());
                }
                else if(entryType.equals(EntryType.INCOME))
                {
                    subBudgetTrend.setMonthlyIncome(entryAmount.doubleValue());
                }
                double savedAmount = subBudgetTrend.getMonthlyIncome() - (subBudgetTrend.getMonthlyVariableExpenses() + subBudgetTrend.getMonthlyFixedExpenses());
                subBudgetTrend.setMonthlySaved(savedAmount);
                subBudgetTrend.setMonthlyGoalAmount(subBudgetGoalAmount.doubleValue());
                double monthlyGoalReached = subBudgetGoalAmount.doubleValue() - savedAmount;
                subBudgetTrend.setMonthlyGoalReached(monthlyGoalReached);
            }
            subBudgetTrends.add(subBudgetTrend);
        }
        return subBudgetTrends;
    }

    private Map<BudgetScheduleRange, List<PreCalculationEntry>> createBudgetScheduleToPreCalculationEntryMap(final List<PreCalculationEntry> preCalculationEntries, final List<BudgetScheduleRange> budgetScheduleRanges)
    {
        Map<BudgetScheduleRange, List<PreCalculationEntry>> map = new HashMap<>();
        for (BudgetScheduleRange range : budgetScheduleRanges) {
            LocalDate rangeStart = range.getStartRange();
            LocalDate rangeEnd = range.getEndRange();

            List<PreCalculationEntry> entriesInRange = preCalculationEntries.stream()
                    .filter(entry -> {
                        LocalDate entryStart = entry.dateRange().getStartDate();
                        LocalDate entryEnd = entry.dateRange().getEndDate();
                        return !entryEnd.isBefore(rangeStart) && !entryStart.isAfter(rangeEnd);
                    })
                    .toList();

            map.put(range, entriesInRange);
        }
        return map;
    }

    //
    public Map<DateRange, Map<EntryType, BigDecimal>> calculateTotalEntryTypeAmountsByDateRange(final Map<DateRange, List<CategoryEntryAmount>> monthlyCategoryEntryAmounts)
    {
        if(monthlyCategoryEntryAmounts.isEmpty())
        {
            return Collections.emptyMap();
        }
        for(Map.Entry<DateRange, List<CategoryEntryAmount>> entry : monthlyCategoryEntryAmounts.entrySet())
        {
            DateRange dateRangeKey = entry.getKey();
            List<CategoryEntryAmount> categoryEntryAmounts = entry.getValue();
            Map<EntryType, BigDecimal> entryTypeBigDecimalMap = new HashMap<>();
            for(CategoryEntryAmount categoryEntryAmount : categoryEntryAmounts)
            {
                if(categoryEntryAmount == null)
                {
                    continue;
                }
                EntryType entryType = categoryEntryAmount.getEntryType();
                if(entryType.equals(EntryType.INCOME))
                {
                    BigDecimal budgetedAmount = categoryEntryAmount.getBudgeted();
                    entryTypeBigDecimalMap.put(entryType, budgetedAmount);
                }
                BigDecimal totalAmount = categoryEntryAmount.getAmount();
                if(totalAmount == null)
                {
                    totalAmount = BigDecimal.ZERO;
                }
                if(totalAmount.compareTo(BigDecimal.ZERO) < 0)
                {
                    throw new IllegalArgumentException("Error calculating total entry type amounts for date range: " + dateRangeKey.toString() + ". Total amount is less than zero: " + totalAmount);
                }
                entryTypeBigDecimalMap.merge(entryType, totalAmount, BigDecimal::add);
            }
            totalEntryTypeAmounts.put(dateRangeKey, entryTypeBigDecimalMap);
        }
        return totalEntryTypeAmounts;
    }

    public Map<DateRange, List<CategoryEntryAmount>> calculateMonthlyEntryAmountsByDateRange(final List<PreCalculationEntry> preCalculationEntries, final List<BudgetScheduleRange> budgetScheduleRanges)
    {
        if(preCalculationEntries.isEmpty())
        {
            return Collections.emptyMap();
        }
        List<CategoryEntryAmount> entryAmountList = new ArrayList<>();
        Map<BudgetScheduleRange, List<PreCalculationEntry>> preCalculationEntrySchedules = createBudgetScheduleToPreCalculationEntryMap(preCalculationEntries, budgetScheduleRanges);
        for(Map.Entry<BudgetScheduleRange, List<PreCalculationEntry>> entry : preCalculationEntrySchedules.entrySet())
        {
            BudgetScheduleRange range = entry.getKey();
            List<PreCalculationEntry> entriesInRange = entry.getValue();
            for(PreCalculationEntry calculationEntry : entriesInRange)
            {
                String category = calculationEntry.category();
                DateRange dateRange = calculationEntry.dateRange();
                BigDecimal budgetedAmount = calculationEntry.budgeted();
                BigDecimal spentAmount = calculationEntry.actual();
                EntryType entryType = calculationEntry.entryType();
                CategoryEntryAmount entryAmount = new CategoryEntryAmount(entryType, dateRange, category, budgetedAmount, spentAmount);
                entryAmountList.add(entryAmount);
            }
            DateRange budgetWeek = range.getBudgetDateRange();
            categoryEntryAmounts.put(budgetWeek, entryAmountList);
        }
        return categoryEntryAmounts;
    }

}
