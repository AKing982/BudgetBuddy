package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetScheduleEntity;
import com.app.budgetbuddy.entities.BudgetScheduleRangeEntity;
import com.app.budgetbuddy.exceptions.BudgetScheduleException;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BudgetScheduleRepository;
import com.app.budgetbuddy.services.BudgetScheduleRangeService;
import com.app.budgetbuddy.workbench.subBudget.HistoricalSubBudgetService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Slf4j
public class BudgetScheduleRangeBuilderService
{
    private final BudgetScheduleRangeService budgetScheduleRangeService;
    private final BudgetScheduleRepository budgetScheduleRepository;
    private final HistoricalSubBudgetService historicalSubBudgetService;
    private final String WEEK = "Week";

    @Autowired
    public BudgetScheduleRangeBuilderService(BudgetScheduleRangeService budgetScheduleRangeService,
                                             BudgetScheduleRepository budgetScheduleRepository,
                                             HistoricalSubBudgetService historicalSubBudgetService)
    {
        this.budgetScheduleRangeService = budgetScheduleRangeService;
        this.budgetScheduleRepository = budgetScheduleRepository;
        this.historicalSubBudgetService = historicalSubBudgetService;
    }

    private Map<DateRange, BigDecimal> createWeeklySpendingAmounts(final Long userId, final LocalDate monthStart, final LocalDate monthEnd)
    {
        if(userId == null || monthStart == null || monthEnd == null)
        {
            return Collections.emptyMap();
        }
        Map<DateRange, BigDecimal> spendingAmounts = new HashMap<>();
        try
        {
            int numberOfMonthsSinceStartDate = getNumberOfMonthsSinceBudgetStartDate(monthStart);
            if(numberOfMonthsSinceStartDate > 0)
            {
                spendingAmounts.putAll(historicalSubBudgetService.getTotalWeeklySpending(numberOfMonthsSinceStartDate, userId, monthStart, monthEnd));
            }
            return spendingAmounts;
        }catch(BudgetScheduleException e){
            log.error("There was an error creating the weekly spending amounts: {} ", e.getMessage());
            return Collections.emptyMap();
        }
    }

    private Map<DateRange, BigDecimal> createBudgetedAmountForWeeklyRanges(final Long userId, final LocalDate monthStart, final LocalDate monthEnd, final BigDecimal subBudgetAmount)
    {
        if(monthStart == null || monthEnd == null || subBudgetAmount == null)
        {
            return Collections.emptyMap();
        }
        if(subBudgetAmount.compareTo(BigDecimal.ZERO) == 0)
        {
            return Collections.emptyMap();
        }
        Map<DateRange, BigDecimal> weeklyBudgetedAmounts = new HashMap<>();
        try
        {
            int numberOfMonthsSinceStartDate = getNumberOfMonthsSinceBudgetStartDate(monthStart);
            log.info("Number of Months Since Start Date: {}", numberOfMonthsSinceStartDate);
            log.info("Number of Months Since Start Date: {}", numberOfMonthsSinceStartDate);
            log.info("SubBudget Amount: {}", subBudgetAmount);
            log.info("Month Start: {}", monthStart);
            log.info("Month End: {}", monthEnd);
            weeklyBudgetedAmounts.putAll(historicalSubBudgetService.getWeeklyBudgetedAmounts(numberOfMonthsSinceStartDate, userId, monthStart, monthEnd, subBudgetAmount));
            log.info("Weekly Budgeted Amounts: {}", weeklyBudgetedAmounts);
            return weeklyBudgetedAmounts;
        }catch(BudgetScheduleException e)
        {
            log.error("There was an error calculating the budgeted amount: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    private int getNumberOfMonthsSinceBudgetStartDate(final LocalDate startDate)
    {
        int currentMonth = startDate.getMonthValue();
        int currentYear = startDate.getYear();
        int beginMonth = LocalDate.of(currentYear, 1, 1).getMonthValue();
        return currentMonth - beginMonth;
    }

    public List<BudgetScheduleRange> createBudgetScheduleRangesBySubBudget(final SubBudget subBudget)
    {
        //TODO: Revise the BudgetScheduleRange logic to include more realistic budgeted amounts based on historical spending
        List<BudgetScheduleRange> budgetScheduleRanges = new ArrayList<>();
        if(subBudget == null || subBudget.getStartDate() == null || subBudget.getEndDate() == null)
        {
            return budgetScheduleRanges;
        }
        log.info("BudgetSchedules size: {}", subBudget.getBudgetSchedule().size());
        LocalDate subBudgetStartDate = subBudget.getStartDate();
        log.info("SubBudgetStartDate: {}", subBudgetStartDate);
        LocalDate subBudgetEndDate = subBudget.getEndDate();
        log.info("SubBudgetEndDate: {}", subBudgetEndDate);
        Long userId = subBudget.getBudget().getUserId();
        try
        {
            // Create a DateRange for the sub-budget's month
            DateRange monthDateRange = new DateRange(subBudgetStartDate, subBudgetEndDate);
            // Split into weekly ranges
            List<DateRange> weeklyRanges = monthDateRange.splitIntoWeeks();
            log.info("WeeklyRanges: {}", weeklyRanges.toString());
            BigDecimal totalBudget = subBudget.getAllocatedAmount();
            Map<DateRange, BigDecimal> weeklyBudgetAmounts = createBudgetedAmountForWeeklyRanges(userId, subBudgetStartDate, subBudgetEndDate, totalBudget);
            Map<DateRange, BigDecimal> weeklyTotalSpending = createWeeklySpendingAmounts(userId, subBudgetStartDate, subBudgetEndDate);
            // Convert DateRanges to BudgetScheduleRange
            for(DateRange weekRange : weeklyRanges)
            {
                BigDecimal weeklyBudget = weeklyBudgetAmounts.get(weekRange);
                BigDecimal weeklySpending = weeklyTotalSpending.get(weekRange);
                BudgetScheduleRange range = new BudgetScheduleRange();
                range.setStartRange(weekRange.getStartDate());
                range.setEndRange(weekRange.getEndDate());
                range.setBudgetedAmount(weeklyBudget);
                range.setSpentOnRange(weeklySpending);
                range.setRangeType(WEEK);
                range.setBudgetDateRange(weekRange);
                List<BudgetSchedule> budgetSchedules = subBudget.getBudgetSchedule();
                BudgetSchedule budgetSchedule = budgetSchedules.get(0);
                range.setBudgetScheduleId(budgetSchedule.getBudgetScheduleId());
                saveBudgetScheduleRange(range);
                budgetScheduleRanges.add(range);
            }
            log.info("Saving BudgetScheduleRanges: {}", budgetScheduleRanges);
            return budgetScheduleRanges;

        } catch (IllegalArgumentException e)
        {
            log.error("There was an error generating the budget schedule ranges: ", e);
            log.error("There was an issue with the budget schedule range: startDate={}, endDate={}", subBudgetStartDate, subBudgetEndDate);
            return budgetScheduleRanges;
        }
    }

    public List<BudgetScheduleRange> getBudgetScheduleRangeByDate(final LocalDate startDate, final LocalDate endDate, final Long scheduleID)
    {
        if (startDate == null || endDate == null)
        {
            return Collections.emptyList();
        }
        try
        {
            return budgetScheduleRangeService.getBudgetScheduleRangesByRangeAndScheduleId(startDate, endDate, scheduleID);
        } catch (Exception e)
        {
            log.error("There was an error generating the budget schedule ranges: ", e);
            return Collections.emptyList();
        }
    }

    public Optional<BudgetScheduleRangeEntity> saveBudgetScheduleRange(final BudgetScheduleRange budgetScheduleRange)
    {
        if(budgetScheduleRange == null)
        {
            return Optional.empty();
        }
        try
        {
            BudgetScheduleRangeEntity budgetScheduleRangeEntity = convertBudgetScheduleRange(budgetScheduleRange);
            log.info("Saving BudgetScheduleRange: {}", budgetScheduleRangeEntity.toString());
            budgetScheduleRangeService.save(budgetScheduleRangeEntity);
            log.info("Successfully saved BudgetScheduleRange: {}", budgetScheduleRangeEntity.toString());
            return Optional.of(budgetScheduleRangeEntity);
        }catch(DataAccessException e)
        {
            log.error("There was an error saving the budget schedule range entity: ", e);
            return Optional.empty();
        }
    }

    public void saveBudgetScheduleRanges(List<BudgetScheduleRange> budgetScheduleRanges)
    {
        try
        {
            for(BudgetScheduleRange budgetScheduleRange : budgetScheduleRanges)
            {
                BudgetScheduleRangeEntity budgetScheduleRangeEntity = convertBudgetScheduleRange(budgetScheduleRange);
                budgetScheduleRangeService.save(budgetScheduleRangeEntity);
            }
        }catch(DataAccessException e){
            log.error("There was an error saving the budget schedule ranges: ", e);
        }
    }

    public BudgetScheduleRangeEntity convertBudgetScheduleRange(final BudgetScheduleRange budgetScheduleRange)
    {
        try
        {
            BudgetScheduleRangeEntity budgetScheduleRangeEntity = new BudgetScheduleRangeEntity();
            budgetScheduleRangeEntity.setBudgetedAmount(budgetScheduleRange.getBudgetedAmount());
            budgetScheduleRangeEntity.setSpentOnRange(budgetScheduleRange.getSpentOnRange());
            budgetScheduleRangeEntity.setRangeType(budgetScheduleRange.getRangeType());
            Optional<BudgetScheduleEntity> budgetScheduleEntityOptional = findBudgetScheduleEntity(budgetScheduleRange.getBudgetScheduleId());
            if(budgetScheduleEntityOptional.isEmpty())
            {
                log.warn("Unable to find BudgetScheduleEntity with scheduleID: {}", budgetScheduleRange.getBudgetScheduleId());
                budgetScheduleRangeEntity.setBudgetSchedule(null);
            }
            BudgetScheduleEntity budgetScheduleEntity = budgetScheduleEntityOptional.get();
            budgetScheduleRangeEntity.setBudgetSchedule(budgetScheduleEntity);
            budgetScheduleRangeEntity.setRangeStart(budgetScheduleRange.getStartRange());
            budgetScheduleRangeEntity.setRangeEnd(budgetScheduleRange.getEndRange());
            budgetScheduleRangeEntity.setId(budgetScheduleRange.getId());
            return budgetScheduleRangeEntity;
        }catch(BudgetScheduleException e)
        {
            log.error("There was an error converting the budget schedule range: ", e);
            throw e;
        }
    }

    private Optional<BudgetScheduleEntity> findBudgetScheduleEntity(Long budgetScheduleId)
    {
        if(budgetScheduleId == null || budgetScheduleId < 1)
        {
            return Optional.empty();
        }
        try
        {
            return budgetScheduleRepository.findById(budgetScheduleId);
        }catch(DataAccessException e)
        {
            log.error("Unable to find the budget schedule entity: ", e);
            return Optional.empty();
        }
    }

}
