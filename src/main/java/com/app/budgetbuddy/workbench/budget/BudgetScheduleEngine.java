package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.exceptions.BudgetScheduleException;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.BudgetScheduleService;
import com.app.budgetbuddy.services.BudgetScheduleServiceImpl;
import com.app.budgetbuddy.services.BudgetService;
import com.app.budgetbuddy.services.SubBudgetService;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cglib.core.Local;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * This class will implement logic for building both past and future Budget Schedules\
 * This class will handle building Budget Schedules that can span over normal month ranges,
 * or custom ranges depending on the particular budget plan
 * This class will also need to build BudgetSchedules for up to 1-2 months in the future and also build budget schedules for past or previous periods
 */
@Service
@Slf4j
@Setter
@Getter
public class BudgetScheduleEngine
{
    private final BudgetService budgetService;
    private final BudgetScheduleService budgetScheduleService;
    private final BudgetScheduleRangeBuilderService budgetScheduleRangeBuilderService;
    private final SubBudgetService subBudgetService;
    private boolean isBudgetScheduleFound = false;
    private Map<Long, List<DateRange>> missingBudgetSchedulesMap = new HashMap<>();

    @Autowired
    public BudgetScheduleEngine(BudgetService budgetService,
                                BudgetScheduleService budgetScheduleService,
                                BudgetScheduleRangeBuilderService budgetScheduleRangeBuilderService,
                                SubBudgetService subBudgetService)
    {
        this.budgetService = budgetService;
        this.budgetScheduleService = budgetScheduleService;
        this.budgetScheduleRangeBuilderService = budgetScheduleRangeBuilderService;
        this.subBudgetService = subBudgetService;
    }

    private Optional<BudgetSchedule> getBudgetScheduleFromDatabase(final Long budgetId, final LocalDate startDate, final LocalDate endDate)
    {
        try
        {
            Optional<BudgetSchedule> budgetSchedule = budgetScheduleService.getBudgetScheduleByDate(budgetId, startDate, endDate);
            if(budgetSchedule.isEmpty())
            {
                throw new BudgetScheduleException("Budget schedule not found");
            }
            return budgetSchedule;
        }catch(BudgetScheduleException e)
        {
            log.error(e.getMessage());
            return Optional.empty();
        }
    }

    private Optional<BudgetSchedule> findMatchingBudgetSchedule(final SubBudget subBudget)
    {
        if(subBudget == null)
        {
            return Optional.empty();
        }
        LocalDate startDate = subBudget.getStartDate();
        LocalDate endDate = subBudget.getEndDate();
        List<BudgetSchedule> budgetSchedules = subBudget.getBudgetSchedule();
        if(budgetSchedules.isEmpty())
        {
            return Optional.empty();
        }
        return budgetSchedules.stream()
                .filter(schedule -> isScheduleMatching(schedule, startDate, endDate))
                .findFirst();
    }

    private boolean isScheduleMatching(BudgetSchedule schedule, LocalDate startDate, LocalDate endDate)
    {
        return schedule.getStartDate().isEqual(startDate) && schedule.getEndDate().isEqual(endDate);
    }

    private BudgetSchedule createNewBudgetSchedule(SubBudget subBudget)
    {
        BudgetSchedule newBudgetSchedule = new BudgetSchedule();
        LocalDate startDate = subBudget.getStartDate();
        LocalDate endDate = subBudget.getEndDate();
        newBudgetSchedule.setStartDate(startDate);
        newBudgetSchedule.setEndDate(endDate);
        newBudgetSchedule.setPeriod(Period.MONTHLY);
        newBudgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
        newBudgetSchedule.setStatus("Active");
        newBudgetSchedule.setTotalPeriods(4); // Example: Adjust based on real calculations
        newBudgetSchedule.setSubBudgetId(subBudget.getId());

        // Initialize date ranges for the budget schedule
        newBudgetSchedule.initializeBudgetDateRanges();

        List<BudgetScheduleRange> budgetScheduleRanges = budgetScheduleRangeBuilderService.createBudgetScheduleRangesBySubBudget(subBudget);
        newBudgetSchedule.setBudgetScheduleRanges(budgetScheduleRanges);
        return newBudgetSchedule;
    }

    /**
     * This method will build a budget schedule for a particular month
     *
     */
    public Optional<BudgetSchedule> createMonthSubBudgetSchedule(final SubBudget subBudget)
    {
        if(subBudget == null)
        {
            return Optional.empty();
        }

        Optional<BudgetSchedule> existingBudgetSchedule = findMatchingBudgetSchedule(subBudget);
        if(existingBudgetSchedule.isPresent())
        {
            return existingBudgetSchedule;
        }
        BudgetSchedule newBudgetSchedule = createNewBudgetSchedule(subBudget);
        try
        {
            budgetScheduleService.saveBudgetSchedule(newBudgetSchedule);
            return Optional.of(newBudgetSchedule);
        }catch(BudgetScheduleException e)
        {
            log.error("Failed to Save new Budget Schedule for subBudget {}: {}", subBudget.getId(), e.getMessage());
            return Optional.empty();
        }
    }

    public Optional<BudgetSchedule> createSingleBudgetSchedule(final LocalDate startDate, final LocalDate endDate, final SubBudget subBudget)
    {
        if(startDate == null || endDate == null)
        {
            return Optional.empty();
        }
        Optional<BudgetSchedule> budgetScheduleOptional;
        BudgetSchedule budgetSchedule = getBudgetSchedule(startDate, endDate, subBudget);
        //TODO: Create the BudgetScheduleRanges and add to the budget schedule
        try
        {
            List<BudgetScheduleRange> budgetScheduleRanges = budgetScheduleRangeBuilderService.createBudgetScheduleRangesBySubBudget(subBudget);
            budgetSchedule.setBudgetScheduleRanges(budgetScheduleRanges);
            budgetScheduleRangeBuilderService.saveBudgetScheduleRanges(budgetScheduleRanges);
            budgetScheduleOptional = Optional.of(budgetSchedule);
            return budgetScheduleOptional;

        }catch(BudgetScheduleException e)
        {
            log.error("Failed to Save new Budget Schedule for subBudget {}: {}", subBudget.getId(), e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Creates budget schedules for future periods
     *
     * @param userId The userId to create future schedules for
     * @param numberOfMonths Number of months to generate schedules for
     * @return List<BudgetSchedule> Generated future schedules
     */
    //TODO: Add code which re-adds missing budget schedules and add unit tests for this
    public List<BudgetSchedule> createMonthlyBudgetSchedules(final Long userId, final LocalDate startMonth, final boolean isFutureEnabled, final int numberOfMonths)
    {
        if(startMonth == null)
        {
            return Collections.emptyList();
        }
        List<BudgetSchedule> budgetSchedules = new ArrayList<>();
        try
        {
            if(numberOfMonths < 0)
            {
                throw new IllegalArgumentException("Number of months cannot be less than 1");
            }
            LocalDate currentStartDate = isFutureEnabled ? startMonth.plusMonths(1) : startMonth.minusMonths(numberOfMonths);
            log.info("Current Start Date: {}", currentStartDate);
            for(int monthIndex = 0; monthIndex < numberOfMonths; monthIndex++)
            {
                LocalDate startDate = currentStartDate.withDayOfMonth(1);
                log.info("Start Date: {}", startDate);
                LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
                log.info("End Date: {}", endDate);

                // Are there any sub budgets in this time frame?
                Optional<SubBudget> monthlySubBudgetOptional = subBudgetService.getSubBudgetsByUserIdAndDate(userId, startDate, endDate);
                if(monthlySubBudgetOptional.isEmpty())
                {
                    log.warn("No Sub-Budgets found for user {} for period {} - {}. Skipping budget schedule creation.", userId, startDate, endDate);
                    return Collections.emptyList();
                }
                else
                {
                    SubBudget subBudget = monthlySubBudgetOptional.get();
                    Long subBudgetId = subBudget.getId();
                    List<BudgetSchedule> subBudgetSchedules = subBudget.getBudgetSchedule();
                    if(!isFutureEnabled && !subBudgetSchedules.isEmpty())
                    {
                        boolean isBudgetScheduleFound = false;
                        for(BudgetSchedule budgetSchedule : subBudgetSchedules)
                        {
                            if (budgetSchedule == null)
                            {
                                log.error("No Budget Schedule found for period: {} to {} with subBudgetId: {}", startDate, endDate, subBudgetId);
                                addMissingBudgetScheduleCriteria(subBudgetId, startDate, endDate);
                                continue;
                            }
                            LocalDate scheduleStartDate = budgetSchedule.getStartDate();
                            LocalDate scheduleEndDate = budgetSchedule.getEndDate();
                            if (startDate.isEqual(scheduleStartDate) && endDate.isEqual(scheduleEndDate))
                            {
                                isBudgetScheduleFound = true;
                                budgetSchedules.add(budgetSchedule);
                                break;
                            }
                        }

                        if(!isBudgetScheduleFound)
                        {
                            BudgetSchedule newBudgetSchedule = getBudgetSchedule(startDate, endDate, subBudget);
                            budgetSchedules.add(newBudgetSchedule);
                        }
                    }
                    else
                    {
                        Optional<BudgetSchedule> newBudgetScheduleOptional = createSingleBudgetSchedule(startDate, endDate, subBudget);
                        newBudgetScheduleOptional.ifPresent(budgetSchedules::add);
                    }
                }

                currentStartDate = currentStartDate.plusMonths(1);

                // ** Ensure the schedules are sorted properly **
                budgetSchedules.sort(Comparator.comparing(BudgetSchedule::getStartDate).reversed());

            }
            return budgetSchedules;
        }catch(IllegalArgumentException e)
        {
            log.error("There was an error while trying to create a future budget schedule: ", e);
            return Collections.emptyList();
        }
    }

    private void addMissingBudgetScheduleCriteria(Long budgetId, LocalDate startDate, LocalDate endDate)
    {
        missingBudgetSchedulesMap.computeIfAbsent(budgetId, k -> new ArrayList<>()).add(new DateRange(startDate, endDate));
    }

    public List<BudgetSchedule> createMissingBudgetSchedules(final Map<Long, List<DateRange>> missingBudgetSchedulesMap)
    {
        if(missingBudgetSchedulesMap.isEmpty())
        {
            return Collections.emptyList();
        }
        List<BudgetSchedule> budgetSchedules = new ArrayList<>();
        try
        {
            for(Map.Entry<Long, List<DateRange>> entry : missingBudgetSchedulesMap.entrySet())
            {
                Long subBudgetId = entry.getKey();
                List<DateRange> dateRanges = entry.getValue();
                if(dateRanges.isEmpty())
                {
                    break;
                }
                Optional<SubBudget> subBudgetOptional = subBudgetService.findSubBudgetById(subBudgetId);
                if(subBudgetOptional.isEmpty())
                {
                    return Collections.emptyList();
                }
                SubBudget subBudget = subBudgetOptional.get();
                for(DateRange dateRange : dateRanges)
                {
                    LocalDate dateRangeStart = dateRange.getStartDate();
                    LocalDate dateRangeEnd = dateRange.getEndDate();
                    if(dateRangeStart == null || dateRangeEnd == null)
                    {
                        throw new IllegalDateException("Start Date or End Date missing for subBudgetId: " + subBudgetId + " in date range: " + dateRange.toString());
                    }
                    subBudget.setStartDate(dateRangeStart);
                    subBudget.setEndDate(dateRangeEnd);
                    BudgetSchedule budgetSchedule = getBudgetSchedule(dateRangeStart, dateRangeEnd, subBudget);
                    List<BudgetScheduleRange> budgetScheduleRanges = budgetScheduleRangeBuilderService.createBudgetScheduleRangesBySubBudget(subBudget);
                    budgetSchedule.setBudgetScheduleRanges(budgetScheduleRanges);
                    budgetSchedules.add(budgetSchedule);
                }
            }
        }catch(IllegalDateException e){
            log.error("There was an error with one of the budget date ranges: ", e);
            throw e;
        }

        return budgetSchedules;
    }

    private static @NotNull BudgetSchedule getBudgetSchedule(LocalDate startDate, LocalDate endDate, SubBudget subBudget)
    {
        Long subBudgetId = subBudget.getId();
        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setStartDate(startDate);
        budgetSchedule.setEndDate(endDate);
        budgetSchedule.setPeriod(Period.MONTHLY);
        budgetSchedule.setSubBudgetId(subBudgetId); // Hardcoded for simplicity, replace with actual logic if needed
        budgetSchedule.setStatus("Active");
        budgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
        budgetSchedule.initializeBudgetDateRanges();  // Initialize the ranges first
        budgetSchedule.setTotalPeriods(budgetSchedule.getBudgetScheduleRanges().size());  // Set total periods based on actual ranges
        return budgetSchedule;
    }

    public Map<Long, List<BudgetSchedule>> groupBudgetSchedulesByBudgetId(final List<BudgetSchedule> budgetSchedules)
    {
        if(budgetSchedules.isEmpty())
        {
            return Collections.emptyMap();
        }

        // Use Streams to group BudgetSchedules by their budgetId
        return budgetSchedules.stream()
                .collect(Collectors.groupingBy(BudgetSchedule::getSubBudgetId));
    }

    public void updateBudgetSchedule(final Long budgetScheduleId, final BudgetSchedule newBudgetSchedule)
    {
        Optional<BudgetSchedule> existingBudgetSchedule = budgetScheduleService.findBudgetScheduleById(budgetScheduleId);
        try
        {
            if(existingBudgetSchedule.isEmpty())
            {
                throw new BudgetScheduleException("Budget schedule with id " + budgetScheduleId + " does not exist");
            }
            BudgetSchedule budgetSchedule1 = setNewBudgetSchedule(newBudgetSchedule, existingBudgetSchedule);

            // Update the Budget Schedule
            budgetScheduleService.updateBudgetSchedule(budgetSchedule1);

        }catch(BudgetScheduleException e){
            log.error("There was an error while trying to update the budget schedule: ", e);
            return;
        }

    }

    private static @NotNull BudgetSchedule setNewBudgetSchedule(BudgetSchedule newBudgetSchedule, Optional<BudgetSchedule> existingBudgetSchedule) {
        BudgetSchedule budgetSchedule1 = existingBudgetSchedule.get();
        budgetSchedule1.setStartDate(newBudgetSchedule.getStartDate());
        budgetSchedule1.setEndDate(newBudgetSchedule.getEndDate());
        budgetSchedule1.setPeriod(newBudgetSchedule.getPeriod());
        budgetSchedule1.setSubBudgetId(newBudgetSchedule.getSubBudgetId());
        budgetSchedule1.setStatus(newBudgetSchedule.getStatus());
        budgetSchedule1.setTotalPeriods(newBudgetSchedule.getTotalPeriods());
        budgetSchedule1.setScheduleRange(newBudgetSchedule.getScheduleRange());
        budgetSchedule1.initializeBudgetDateRanges();
        return budgetSchedule1;
    }


    public void saveOrUpdateBudgetSchedules(final List<BudgetSchedule> budgetSchedules, final boolean updateEnabled)
    {
        if(budgetSchedules == null || budgetSchedules.isEmpty())
        {
            log.warn("Cancelling Save of Missing or Empty Budget Schedules");
            return;
        }
        try
        {
            for(BudgetSchedule budgetSchedule : budgetSchedules)
            {
                if(budgetSchedule == null)
                {
                    log.warn("Skipping Save of Missing or Empty Budget Schedule");
                    continue;
                }
                Long budgetScheduledId = budgetSchedule.getSubBudgetId();
                if(updateEnabled)
                {
                        updateBudgetSchedule(budgetScheduledId, budgetSchedule);
                }
                else
                {
                        budgetScheduleService.saveBudgetSchedule(budgetSchedule);
                }
            }
        }catch(Exception e){
            log.error("There was an exception saving/updating the Budget Schedules: ", e);
            return;
        }
    }

}
