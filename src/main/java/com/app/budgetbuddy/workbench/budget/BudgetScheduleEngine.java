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

    private BudgetSchedule createBudgetSchedule(Long budgetId, LocalDate startDate, LocalDate endDate)
    {
        BudgetSchedule budgetSchedule = BudgetSchedule.builder()
                .subBudgetId(budgetId)
                .startDate(startDate)
                .endDate(endDate)
                .period(Period.MONTHLY)
                .totalPeriods(4)
                .scheduleRange(new DateRange(startDate, endDate))
                .status("Active")
                .build();
        budgetSchedule.initializeBudgetDateRanges();
        return budgetSchedule;
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

        LocalDate subBudgetStartDate = subBudget.getStartDate();
        LocalDate subBudgetEndDate = subBudget.getEndDate();
        List<BudgetSchedule> budgetSchedules = subBudget.getBudgetSchedule();
        if(!budgetSchedules.isEmpty())
        {
            for(BudgetSchedule budgetSchedule : budgetSchedules)
            {
                if (budgetSchedule.getStartDate().isEqual(subBudgetStartDate) &&
                        budgetSchedule.getEndDate().isEqual(subBudgetEndDate))
                {
                    return Optional.of(budgetSchedule);
                }
            }
        }
        // Create a new BudgetSchedule if none exists
        BudgetSchedule newBudgetSchedule = new BudgetSchedule();
        newBudgetSchedule.setStartDate(subBudgetStartDate);
        newBudgetSchedule.setEndDate(subBudgetEndDate);
        newBudgetSchedule.setPeriod(Period.MONTHLY);
        newBudgetSchedule.setScheduleRange(new DateRange(subBudgetStartDate, subBudgetEndDate));
        newBudgetSchedule.setStatus("Active");
        newBudgetSchedule.setTotalPeriods(4); // Example: Adjust based on real calculations
        newBudgetSchedule.setSubBudgetId(subBudget.getId());

        // Initialize date ranges for the budget schedule
        newBudgetSchedule.initializeBudgetDateRanges();

        List<BudgetScheduleRange> budgetScheduleRanges = budgetScheduleRangeBuilderService.createBudgetScheduleRangesBySubBudget(subBudget);
        newBudgetSchedule.setBudgetScheduleRanges(budgetScheduleRanges);
        return Optional.of(newBudgetSchedule);
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
        List<BudgetScheduleRange> budgetScheduleRanges = budgetScheduleRangeBuilderService.createBudgetScheduleRangesBySubBudget(subBudget);
        budgetSchedule.setBudgetScheduleRanges(budgetScheduleRanges);
        budgetScheduleOptional = Optional.of(budgetSchedule);
        return budgetScheduleOptional;
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
        Set<BudgetSchedule> uniqueBudgetSchedules = new HashSet<>();
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
                                uniqueBudgetSchedules.add(budgetSchedule);
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
                        newBudgetScheduleOptional.ifPresent(uniqueBudgetSchedules::add);
                    }
                }

                budgetSchedules.addAll(uniqueBudgetSchedules);
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
                        throw new IllegalDateException("Start Date or End Date missing for budgetId: " + subBudgetId + " in date range: " + dateRange.toString());
                    }
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
        budgetSchedule.setTotalPeriods(4); // Hardcoded, replace with actual logic if needed
        budgetSchedule.setScheduleRange(new DateRange(startDate, endDate));
        budgetSchedule.initializeBudgetDateRanges();
        return budgetSchedule;
    }

    private void validateUserId(Long userId)
    {
        if(userId < 1){
            throw new IllegalArgumentException("User id cannot be less than 1");
        }
    }

    private void validateNumberOfMonths(int numberOfMonths){
        if(numberOfMonths < 0){
            throw new IllegalArgumentException("Number of months cannot be less than 0");
        }
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
