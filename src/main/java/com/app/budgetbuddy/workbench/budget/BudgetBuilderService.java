package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.exceptions.BudgetBuildException;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.services.BudgetService;
import com.app.budgetbuddy.workbench.subBudget.SubBudgetBuilderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class BudgetBuilderService
{
    private final BudgetService budgetService;
    private final BudgetCalculations budgetCalculations;
    private final SubBudgetBuilderService subBudgetBuilderService;

    @Autowired
    public BudgetBuilderService(BudgetService budgetService,
                                BudgetCalculations budgetCalculations,
                                SubBudgetBuilderService subBudgetBuilderService)
    {
        this.budgetService = budgetService;
        this.budgetCalculations = budgetCalculations;
        this.subBudgetBuilderService = subBudgetBuilderService;
    }

    private void validateBudgetRegistration(final BudgetRegistration budgetRegistration)
    {
        try
        {
            Long userId = budgetRegistration.getUserId();
            String budgetName = budgetRegistration.getBudgetName();
            BudgetMode budgetType = budgetRegistration.getBudgetMode();
            Period budgetPeriod = budgetRegistration.getBudgetPeriod();
            BudgetGoals budgetGoals = budgetRegistration.getBudgetGoals();
            Set<DateRange> budgetDateRanges = budgetRegistration.getBudgetDateRanges();
            BigDecimal totalIncomeAmount = budgetRegistration.getTotalIncomeAmount();
            int totalMonths = budgetRegistration.getNumberOfMonths();
            int totalBudgetsNeeded = budgetRegistration.getTotalBudgetsNeeded();
            if(userId == null || budgetName == null || budgetType == null || budgetPeriod == null ||
                    budgetGoals == null || budgetDateRanges == null || totalIncomeAmount == null || totalMonths <= 0 || totalBudgetsNeeded <= 0)
            {
                throw new BudgetBuildException("Found Missing Budget Registration parameters");
            }

        }catch(BudgetBuildException e)
        {
            log.error("There was an error building the budget from the registration: ", e);
            log.warn("There was an error with the BudgetRegistration: {}", budgetRegistration.toString());
            throw e;
        }
    }


    public Optional<Budget> buildBudgetFromRegistration(final BudgetRegistration budgetRegistration)
    {
        if(budgetRegistration == null)
        {
            return Optional.empty();
        }
        validateBudgetRegistration(budgetRegistration);
        BigDecimal totalIncomeAmount = budgetRegistration.getTotalIncomeAmount();
        int totalMonths = budgetRegistration.getNumberOfMonths();
        int totalBudgetsNeeded = budgetRegistration.getTotalBudgetsNeeded();
        BudgetMode budgetMode = budgetRegistration.getBudgetMode();
        Period budgetPeriod = budgetRegistration.getBudgetPeriod();
        Set<DateRange> budgetDateRanges = budgetRegistration.getBudgetDateRanges();
        String budgetName = budgetRegistration.getBudgetName();
        Long userId = budgetRegistration.getUserId();
        BudgetGoals budgetGoals = budgetRegistration.getBudgetGoals();
        String budgetDescription = budgetRegistration.getBudgetDescription();
        LocalDate budgetStartDate = budgetRegistration.getBudgetStartDate();
        LocalDate budgetEndDate = budgetRegistration.getBudgetEndDate();
        if(budgetPeriod == Period.MONTHLY && budgetMode == BudgetMode.SAVINGS_PLAN)
        {
            // Calculate the Budget Amount
            double monthlyAllocation = budgetGoals.getMonthlyAllocation();
            double targetAmount = budgetGoals.getTargetAmount();
            double currentSavings = budgetGoals.getCurrentSavings();
            // Based on target amount for savings, and given what the user wants to allocate every month and what their current savings are
            // determine how much needs to be allocated and deduct this from the totalIncomeAmount
            BigDecimal actualMonthlyAllocation = budgetCalculations.calculateActualMonthlyAllocation(monthlyAllocation, targetAmount, currentSavings, totalIncomeAmount, totalMonths);
            // Use the remaining amount after the savings has been deducted as the budget amount
            BigDecimal remainingOnBudgetAfterAllocation = totalIncomeAmount.subtract(actualMonthlyAllocation);

            // Calculate the savings progress
            BigDecimal currentlySaved = BigDecimal.valueOf(currentSavings);
            BigDecimal targetAmountAsDecimal = BigDecimal.valueOf(targetAmount);
            BigDecimal savingsProgress = budgetCalculations.calculateSavingsProgress(actualMonthlyAllocation, currentlySaved, targetAmountAsDecimal);

            // Next create the Budget Schedules
            Map<BudgetMonth, List<DateRange>> monthlyBudgetDateRanges = createMonthlyBudgetDateRanges(budgetDateRanges);
            List<DateRange> budgetStartAndEndDateRanges = getBudgetStartAndEndDateCriteria(monthlyBudgetDateRanges);
            Budget budget = createBudget(actualMonthlyAllocation, totalMonths, userId, budgetDescription, budgetPeriod, budgetMode, budgetName,savingsProgress, remainingOnBudgetAfterAllocation, budgetStartDate, budgetEndDate);
            List<SubBudget> subBudgets = subBudgetBuilderService.createMonthlySubBudgets(budget, budgetGoals);
            subBudgetBuilderService.saveSubBudgets(subBudgets);
            budget.setSubBudgets(subBudgets);
            Optional<BudgetEntity> savedBudget = saveBudget(budget);
            if(savedBudget.isEmpty())
            {
                return Optional.empty();
            }
            Long budgetId = savedBudget.get().getId();
            // Once saved, get the id for the budget
            budget.setId(budgetId);

            return Optional.of(budget);
        }
        // Depending on the period and budget mode and the budget goals, we need to calculate the budget amount
        return Optional.empty();
    }

    private Budget createBudget(BigDecimal actualMonthlyAllocation, int totalMonths, Long userId, String budgetDescription,  Period budgetPeriod, BudgetMode budgetMode, String budgetName, BigDecimal savingsProgress, BigDecimal remainingOnBudgetAfterAllocation, LocalDate budgetStartDate, LocalDate endDate) {
        return Budget.builder()
                .savingsAmountAllocated(actualMonthlyAllocation)
                .savingsProgress(savingsProgress)
                .totalMonthsToSave(totalMonths)
                .userId(userId)
                .budgetDescription(budgetDescription)
                .budgetPeriod(budgetPeriod)
                .budgetMode(budgetMode)
                .budgetName(budgetName)
                .startDate(budgetStartDate)
                .endDate(endDate)
                .budgetAmount(remainingOnBudgetAfterAllocation)
                .actual(BigDecimal.ZERO)
                .build();
    }

    public List<DateRange> getBudgetStartAndEndDateCriteria(final Map<BudgetMonth, List<DateRange>> budgetMonthListMap)
    {
        if(budgetMonthListMap == null || budgetMonthListMap.isEmpty())
        {
            return Collections.emptyList();
        }
        return budgetMonthListMap.entrySet().stream()
                .sorted(Comparator.comparing(entry -> entry.getKey().getYearMonth()))
                .map(entry -> {
                    BudgetMonth budgetMonth = entry.getKey();
                    List<DateRange> monthRanges = entry.getValue();

                    // Find the earliest startDate and the latest endDate among all ranges for this month
                    LocalDate earliestStart = monthRanges.stream()
                            .map(DateRange::getStartDate)
                            .min(LocalDate::compareTo)
                            .orElseThrow(() -> new IllegalStateException(
                                    "No start date found for " + budgetMonth));

                    LocalDate latestEnd = monthRanges.stream()
                            .map(DateRange::getEndDate)
                            .max(LocalDate::compareTo)
                            .orElseThrow(() -> new IllegalStateException(
                                    "No end date found for " + budgetMonth));

                    // Combine them into a single "collapsed" DateRange for that month
                    return new DateRange(earliestStart, latestEnd);
                })
                .collect(Collectors.toList());
    }

    public Map<BudgetMonth, List<DateRange>> createMonthlyBudgetDateRanges(final Set<DateRange> dateRanges)
    {
        if(dateRanges == null || dateRanges.isEmpty())
        {
            return Collections.emptyMap();
        }
        Map<BudgetMonth, List<DateRange>> monthlyBudgetStartAndEndDates = new HashMap<>();
        for(DateRange dateRange : dateRanges)
        {
            if(dateRange == null)
            {
                log.warn("Date Range was found null");
                continue;
            }

            LocalDate dateRangeStartDate = dateRange.getStartDate();
            LocalDate dateRangeEndDate = dateRange.getEndDate();
            if(dateRangeStartDate == null || dateRangeEndDate == null)
            {
                log.warn("Missing Start Date or End Date: {}", dateRange.toString());
                continue;
            }
            while(!dateRangeStartDate.isAfter(dateRangeEndDate))
            {
                YearMonth currentMonth = YearMonth.from(dateRangeStartDate);
                BudgetMonth budgetMonth = new BudgetMonth(currentMonth);
                LocalDate endOfMonth = currentMonth.atEndOfMonth();
                LocalDate chunkEnd = endOfMonth.isBefore(dateRangeEndDate) ? endOfMonth : dateRangeEndDate;
                DateRange subRange = new DateRange(chunkEnd, endOfMonth);
                monthlyBudgetStartAndEndDates.computeIfAbsent(budgetMonth, k -> new ArrayList<>()).add(subRange);
                dateRangeStartDate = chunkEnd.plusDays(1);
            }
        }
        return monthlyBudgetStartAndEndDates;
    }



    public Optional<BudgetEntity> saveBudget(Budget budget)
    {
        if(budget == null)
        {
            return Optional.empty();
        }

        try
        {
            return budgetService.saveBudget(budget);
        }catch(DataAccessException e){
            log.error("There was an error saving the budget to the database: ", e);
            return Optional.empty();
        }
    }

}
