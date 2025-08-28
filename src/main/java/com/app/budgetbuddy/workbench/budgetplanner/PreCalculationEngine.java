package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.InvalidBudgetScheduleException;
import com.app.budgetbuddy.exceptions.InvalidPrecalculationException;
import com.app.budgetbuddy.exceptions.InvalidWeekNumberCategoryException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@Slf4j
public class PreCalculationEngine
{
    private final PreCalculationThreadService preCalculationThreadService;
    private final PreCalculationTrendService preCalculationTrendService;
    private final PreCalculationModelService preCalculationModelService;
    private Map<WeekNumber, List<PreCalculationEntry>> precalculationEntriesByMonth = new HashMap<>();
    private Map<WeekNumber, List<BudgetCategory>> budgetCategoriesByWeekNumber = new HashMap<>();

    @Autowired
    public PreCalculationEngine(PreCalculationThreadService preCalculationThreadService,
                                PreCalculationTrendService preCalculationTrendService,
                                PreCalculationModelService preCalculationModelService)
    {
       this.preCalculationThreadService = preCalculationThreadService;
       this.preCalculationTrendService = preCalculationTrendService;
       this.preCalculationModelService = preCalculationModelService;
    }

    List<WeekNumber> generateWeekNumbersByCurrentBudgetSchedule(final BudgetSchedule budgetSchedule)
    {
        if(budgetSchedule == null)
        {
            return Collections.emptyList();
        }
        List<WeekNumber> weekNumbers = new ArrayList<>();
        DateRange monthRange = budgetSchedule.getScheduleRange();
        List<DateRange> weeksInMonth = monthRange.splitIntoISOWeeks();
        for(DateRange weekRange : weeksInMonth)
        {
            LocalDate weekStart = weekRange.getStartDate();
            int year = weekStart.getYear();
            int isoWeekNumber = weekRange.getISOWeekNumberBasedYear();
            WeekNumber weekNumber = new WeekNumber(isoWeekNumber, year, weekRange);
            weekNumbers.add(weekNumber);
        }
        return weekNumbers;
    }

    public List<SubBudgetTrend> getSubBudgetTrendForMonths(int numberOfMonths, Long userId)
    {
        return null;
    }

    public Map<WeekNumber, List<BudgetCategory>> getBudgetCategoriesByWeekNumber(final List<BudgetCategory> budgetCategories, final BudgetSchedule budgetSchedule)
    {
        if(budgetCategories == null || budgetCategories.isEmpty())
        {
            return Collections.emptyMap();
        }
        try
        {
            if(budgetSchedule == null)
            {
                throw new InvalidBudgetScheduleException("Budget schedule is null");
            }
            List<WeekNumber> weekNumbers = generateWeekNumbersByCurrentBudgetSchedule(budgetSchedule);
            for(WeekNumber weekNumber : weekNumbers)
            {
                List<BudgetCategory> weekBudgetCategories = new ArrayList<>();
                DateRange weekRange = weekNumber.getDateRange();
                for(BudgetCategory budgetCategory : budgetCategories)
                {
                    LocalDate budgetCategoryStartDate = budgetCategory.getStartDate();
                    LocalDate budgetCategoryEndDate = budgetCategory.getEndDate();
                    // Check if the category overlaps with the week
                    if (!budgetCategoryStartDate.isAfter(weekRange.getEndDate()) && !budgetCategoryEndDate.isBefore(weekRange.getStartDate()))
                    {
                        weekBudgetCategories.add(budgetCategory);
                    }
                }
                budgetCategoriesByWeekNumber.put(weekNumber, weekBudgetCategories);
            }

        }catch(InvalidBudgetScheduleException e){
            log.error("There was an error retrieving the budget schedule from the database: ", e);
            return Collections.emptyMap();
        }
        return budgetCategoriesByWeekNumber;
    }

    private boolean validateWeekNumberInMonth(final WeekNumber weekNumber, final BudgetSchedule budgetSchedule)
    {
        LocalDate monthStart = budgetSchedule.getStartDate();
        LocalDate monthEnd = budgetSchedule.getEndDate();
        DateRange weekNumberRange = weekNumber.getDateRange();
        return !weekNumberRange.getStartDate().isBefore(monthStart) &&
                !weekNumberRange.getEndDate().isAfter(monthEnd);
    }

    public Map<WeekNumber, List<PreCalculationEntry>> getPrecalculationEntriesByMonth(final Map<WeekNumber, List<BudgetCategory>> budgetCategories, final SubBudget subBudget)
    {
        if(budgetCategories == null || subBudget == null)
        {
            return Collections.emptyMap();
        }
        BudgetSchedule budgetSchedule = subBudget.getBudgetSchedule().get(0);
        try
        {
            for(Map.Entry<WeekNumber, List<BudgetCategory>> entry : budgetCategories.entrySet())
            {
                WeekNumber weekNumber = entry.getKey();
                if(!validateWeekNumberInMonth(weekNumber, budgetSchedule))
                {
                    throw new InvalidPrecalculationException("Week number " + weekNumber + " is not valid for the current budget schedule");
                }
                List<BudgetCategory> budgetCategoryList = entry.getValue();
                if(budgetCategoryList.isEmpty())
                {
                    // TODO: If a week number is missing budget category data, then record the week number for data repair
                    continue;
                }
                List<PreCalculationEntry> preCalculationEntries = new ArrayList<>();
                for(BudgetCategory budgetCategory : budgetCategoryList)
                {
                    String category = budgetCategory.getCategoryName();
                    BigDecimal budgetedAmount = BigDecimal.valueOf(budgetCategory.getBudgetedAmount());
                    BigDecimal currentSpending = BigDecimal.valueOf(budgetCategory.getBudgetActual());
                    CategoryType categoryType = CategoryType.getCategoryType(category);
                    DateRange currentDateRange = new DateRange(budgetCategory.getStartDate(), budgetCategory.getEndDate());
                    EntryType entryType = switch (categoryType) {
                        case RENT, UTILITIES, INSURANCE -> EntryType.FIXED_EXPENSE;
                        default -> EntryType.VARIABLE_EXPENSE;
                    };
                    PreCalculationEntry preCalculationEntry = new PreCalculationEntry(
                            category,
                            currentDateRange,
                            budgetedAmount,
                            currentSpending,
                            entryType
                    );
                    preCalculationEntries.add(preCalculationEntry);
                }
                precalculationEntriesByMonth.put(weekNumber, preCalculationEntries);
            }
        }catch(InvalidWeekNumberCategoryException e)
        {
            throw new InvalidWeekNumberCategoryException("Invalid week number category: " + e.getMessage());
        }
        return precalculationEntriesByMonth;
    }

    public Map<WeekNumber, List<SubBudgetGoals>> getSubBudgetGoalsByWeek(final BudgetSchedule budgetSchedule, final SubBudgetGoals subBudgetGoals)
    {
        if(budgetSchedule == null || subBudgetGoals == null)
        {
            return Collections.emptyMap();
        }
        return null;
    }

}
