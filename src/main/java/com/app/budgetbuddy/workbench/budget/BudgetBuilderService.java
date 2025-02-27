package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.BudgetBuildException;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.services.BudgetService;
import com.app.budgetbuddy.workbench.subBudget.SubBudgetBuilderService;
import com.app.budgetbuddy.workbench.subBudget.SubBudgetConverterUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class BudgetBuilderService
{
    private final BudgetService budgetService;
    private final BudgetGoalsService budgetGoalsService;
    private final BudgetCalculations budgetCalculations;
    private final SubBudgetBuilderService subBudgetBuilderService;
    private final SubBudgetConverterUtil subBudgetConverterUtil;

    @Autowired
    public BudgetBuilderService(BudgetService budgetService,
                                BudgetCalculations budgetCalculations,
                                SubBudgetBuilderService subBudgetBuilderService,
                                SubBudgetConverterUtil subBudgetConverterUtil,
                                BudgetGoalsService budgetGoalsService)
    {
        this.budgetService = budgetService;
        this.budgetCalculations = budgetCalculations;
        this.subBudgetBuilderService = subBudgetBuilderService;
        this.subBudgetConverterUtil = subBudgetConverterUtil;
        this.budgetGoalsService = budgetGoalsService;
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


    @Transactional
    public Optional<Budget> buildBudgetFromRegistration(final BudgetRegistration budgetRegistration) {
        if (budgetRegistration == null) {
            return Optional.empty();
        }

        validateBudgetRegistration(budgetRegistration);

        BigDecimal totalIncomeAmount = budgetRegistration.getTotalIncomeAmount();
        int totalMonths = budgetRegistration.getNumberOfMonths();
        int totalBudgetsNeeded = budgetRegistration.getTotalBudgetsNeeded();
        int budgetYear = budgetRegistration.getBudgetYear();
        BudgetMode budgetMode = budgetRegistration.getBudgetMode();
        Period budgetPeriod = budgetRegistration.getBudgetPeriod();
        Set<DateRange> budgetDateRanges = budgetRegistration.getBudgetDateRanges();
        String budgetName = budgetRegistration.getBudgetName() + " " + LocalDateTime.now().toString();
        Long userId = budgetRegistration.getUserId();
        BudgetGoals budgetGoals = budgetRegistration.getBudgetGoals();
        String budgetDescription = budgetRegistration.getBudgetDescription();
        LocalDate budgetStartDate = budgetRegistration.getBudgetStartDate();
        LocalDate budgetEndDate = budgetRegistration.getBudgetEndDate();

        try {
            // Calculate the Budget Amount
            double monthlyAllocation = budgetGoals.getMonthlyAllocation();
            double targetAmount = budgetGoals.getTargetAmount();
            double currentSavings = budgetGoals.getCurrentSavings();

            BigDecimal actualMonthlyAllocation = budgetCalculations.calculateActualMonthlyAllocation(
                    monthlyAllocation, targetAmount, currentSavings, totalIncomeAmount, totalMonths);
            BigDecimal remainingOnBudgetAfterAllocation = totalIncomeAmount.subtract(actualMonthlyAllocation);

            BigDecimal currentlySaved = BigDecimal.valueOf(currentSavings);
            BigDecimal targetAmountAsDecimal = BigDecimal.valueOf(targetAmount);
            BigDecimal savingsProgress = budgetCalculations.calculateSavingsProgress(
                    actualMonthlyAllocation, currentlySaved, targetAmountAsDecimal);

            // Create BudgetEntity
            BudgetEntity budgetEntity = BudgetEntity.builder()
                    .user(UserEntity.builder().id(userId).build())
                    .budgetName(budgetName)
                    .budgetDescription(budgetDescription)
                    .budgetAmount(remainingOnBudgetAfterAllocation)
                    .budgetMode(budgetMode)
                    .budgetPeriod(budgetPeriod)
                    .monthlyIncome(totalIncomeAmount)
                    .budgetStartDate(budgetStartDate)
                    .budgetEndDate(budgetEndDate)
                    .year(budgetYear)
                    .actualSavingsAllocation(actualMonthlyAllocation)
                    .savingsProgress(savingsProgress)
                    .totalMonthsToSave(totalMonths)
                    .createdDate(LocalDateTime.now())
                    .subBudgetEntities(new HashSet<>())
                    .build();

            // Save BudgetEntity first
            Optional<BudgetEntity> savedBudgetOptional = budgetService.saveBudgetEntity(budgetEntity);
            if (savedBudgetOptional.isEmpty()) {
                log.error("Failed to save budget initially: {}", budgetEntity);
                return Optional.empty();
            }

            BudgetEntity savedBudgetEntity = savedBudgetOptional.get();
            Long budgetId = savedBudgetEntity.getId();
            if (budgetId == null) {
                log.error("Saved budget ID is null");
                return Optional.empty();
            }
            log.info("Budget saved with ID: {}", budgetId);

            // Create and link BudgetGoalsEntity
            BudgetGoalsEntity goalsEntity = BudgetGoalsEntity.builder()
                    .budget(savedBudgetEntity)
                    .targetAmount(targetAmountAsDecimal.doubleValue())
                    .monthlyAllocation(monthlyAllocation)
                    .currentSavings(currentSavings)
                    .goalName(budgetGoals.getGoalName())
                    .goalDescription(budgetGoals.getGoalDescription())
                    .goalType(budgetGoals.getGoalType())
                    .savingsFrequency(budgetGoals.getSavingsFrequency())
                    .status(budgetGoals.getStatus())
                    .createdAt(LocalDateTime.now())
                    .build();

            budgetGoalsService.save(goalsEntity);
            savedBudgetEntity.setBudgetGoals(goalsEntity);

            // Convert to Budget domain model
            Optional<BudgetEntity> budgetEntityOptional = budgetService.saveBudgetEntity(savedBudgetEntity);
            if(budgetEntityOptional.isEmpty())
            {
                return Optional.empty();
            }
            BudgetEntity budgetEntity1 = budgetEntityOptional.get();
            log.debug("Created Budget: id={}, income={}", budgetEntity1.getId(), budgetEntity1.getMonthlyIncome());

            // Save the updated BudgetEntity instead of using updateBudgetEntity
            Optional<BudgetEntity> updatedBudgetOptional = budgetService.saveBudgetEntity(savedBudgetEntity);
            if (updatedBudgetOptional.isEmpty()) {
                log.error("Failed to update budget with sub-budgets for ID: {}", budgetId);
                return Optional.empty();
            }

            Budget finalBudget = budgetService.convertBudgetEntity(updatedBudgetOptional.get());
            log.info("Budget successfully created and updated with ID: {}", budgetId);
            return Optional.of(finalBudget);

        } catch (BudgetBuildException e) {
            log.error("There was an error building the budget from the registration: ", e);
            return Optional.empty();
        } catch (Exception e) {
            log.error("Unexpected error during budget creation: ", e);
            return Optional.empty();
        }
    }

    private Budget createBudget(BigDecimal actualMonthlyAllocation, int totalMonths, Long userId, String budgetDescription, int budgetYear,  Period budgetPeriod, BudgetMode budgetMode, BigDecimal totalIncome, String budgetName, BigDecimal savingsProgress, BigDecimal remainingOnBudgetAfterAllocation, LocalDate budgetStartDate, LocalDate endDate) {
        return Budget.builder()
                .savingsAmountAllocated(actualMonthlyAllocation)
                .savingsProgress(savingsProgress)
                .totalMonthsToSave(totalMonths)
                .userId(userId)
                .budgetDescription(budgetDescription)
                .budgetPeriod(budgetPeriod)
                .budgetMode(budgetMode)
                .budgetName(budgetName)
                .budgetYear(budgetYear)
                .income(totalIncome)
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

    public Optional<BudgetEntity> updateBudget(Budget budget)
    {
        if(budget == null)
        {
            return Optional.empty();
        }
        try
        {
            return budgetService.updateBudget(budget);
        }catch(DataAccessException e){
            log.error("There was an error updating the budget: ", e);
            return Optional.empty();
        }
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
