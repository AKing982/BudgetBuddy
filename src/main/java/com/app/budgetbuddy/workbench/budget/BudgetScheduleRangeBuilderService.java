package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetScheduleEntity;
import com.app.budgetbuddy.entities.BudgetScheduleRangeEntity;
import com.app.budgetbuddy.exceptions.BudgetScheduleException;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BudgetScheduleRepository;
import com.app.budgetbuddy.services.BudgetScheduleRangeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class BudgetScheduleRangeBuilderService
{
    private final BudgetScheduleRangeService budgetScheduleRangeService;
    private final BudgetScheduleRepository budgetScheduleRepository;

    @Autowired
    public BudgetScheduleRangeBuilderService(BudgetScheduleRangeService budgetScheduleRangeService,
                                             BudgetScheduleRepository budgetScheduleRepository)
    {
        this.budgetScheduleRangeService = budgetScheduleRangeService;
        this.budgetScheduleRepository = budgetScheduleRepository;
    }

    public List<BudgetScheduleRange> createBudgetScheduleRangesBySubBudget(final SubBudget subBudget)
    {
        List<BudgetScheduleRange> budgetScheduleRanges = new ArrayList<>();
        if (subBudget == null || subBudget.getStartDate() == null || subBudget.getEndDate() == null) {
            return budgetScheduleRanges;
        }
        log.info("BudgetSchedules size: {}", subBudget.getBudgetSchedule().size());
        LocalDate subBudgetStartDate = subBudget.getStartDate();
        log.info("SubBudgetStartDate: {}", subBudgetStartDate);
        LocalDate subBudgetEndDate = subBudget.getEndDate();
        log.info("SubBudgetEndDate: {}", subBudgetEndDate);
        Budget budget = subBudget.getBudget();
        try
        {

            // Check if sub-budget spans a single month
            if (!subBudgetStartDate.getMonth().equals(subBudgetEndDate.getMonth()) ||
                    subBudgetStartDate.getYear() != subBudgetEndDate.getYear()) {
                throw new IllegalArgumentException("SubBudget must span exactly one month: start=" +
                        subBudgetStartDate + ", end=" + subBudgetEndDate);
            }

            // Ensure sub-budget is within parent budget's range
            LocalDate budgetStartDate = budget.getStartDate();
            LocalDate budgetEndDate = budget.getEndDate();
            if (subBudgetStartDate.isBefore(budgetStartDate) || subBudgetEndDate.isAfter(budgetEndDate)) {
                throw new IllegalArgumentException("SubBudget must be within parent budget range: " +
                        "subBudgetStart=" + subBudgetStartDate + ", subBudgetEnd=" + subBudgetEndDate +
                        ", budgetStart=" + budgetStartDate + ", budgetEnd=" + budgetEndDate);
            }

            // Create a DateRange for the sub-budget's month
            DateRange monthDateRange = new DateRange(subBudgetStartDate, subBudgetEndDate);

            // Split into weekly ranges
            List<DateRange> weeklyRanges = monthDateRange.splitIntoWeeks();
            log.info("WeeklyRanges: {}", weeklyRanges.toString());

            // Determine budget per week
            BigDecimal totalBudget = subBudget.getAllocatedAmount();
            BigDecimal totalSpent = subBudget.getSpentOnBudget();
            int numWeeks = weeklyRanges.size();

            BigDecimal weeklyBudget = totalBudget.divide(BigDecimal.valueOf(numWeeks), RoundingMode.HALF_UP);
            BigDecimal weeklySpent = totalSpent.divide(BigDecimal.valueOf(numWeeks), RoundingMode.HALF_UP);

            // Convert DateRanges to BudgetScheduleRange
            for (DateRange weekRange : weeklyRanges)
            {
                BudgetScheduleRange range = new BudgetScheduleRange();
                range.setStartRange(weekRange.getStartDate());
                range.setEndRange(weekRange.getEndDate());
                range.setBudgetedAmount(weeklyBudget);
                range.setSpentOnRange(weeklySpent);
                range.setRangeType("Week");
                range.setSingleDate(false);
                range.setBudgetDateRange(weekRange);
                List<BudgetSchedule> budgetSchedules = subBudget.getBudgetSchedule();
                BudgetSchedule budgetSchedule = budgetSchedules.get(0);
                range.setBudgetScheduleId(budgetSchedule.getBudgetScheduleId());
                saveBudgetScheduleRange(range);
                budgetScheduleRanges.add(range);
            }
            log.info("Saving BudgetScheduleRanges: {}", budgetScheduleRanges.toString());
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
