package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.BudgetScheduleException;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.BudgetScheduleService;
import com.app.budgetbuddy.services.BudgetScheduleServiceImpl;
import com.app.budgetbuddy.services.BudgetService;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
    private BudgetService budgetService;
    private BudgetScheduleService budgetScheduleService;
    private boolean isBudgetScheduleFound = false;
    private Map<Long, List<DateRange>> missingBudgetSchedulesMap = new HashMap<>();

    @Autowired
    public BudgetScheduleEngine(BudgetService budgetService,
                                BudgetScheduleService budgetScheduleService)
    {
        this.budgetService = budgetService;
        this.budgetScheduleService = budgetScheduleService;
    }

    private BudgetSchedule createBudgetSchedule(Long budgetId, LocalDate startDate, LocalDate endDate)
    {
        BudgetSchedule budgetSchedule = BudgetSchedule.builder()
                .budgetId(budgetId)
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
    public Optional<BudgetSchedule> createMonthBudgetSchedule(final Long userId, final LocalDate budgetStartDate, LocalDate budgetEndDate, final BudgetMonth budgetMonth)
    {
        if(userId == null || budgetStartDate == null || budgetEndDate == null || budgetMonth == null)
        {
            return Optional.empty();
        }
        // Does the user have a budget?
        Budget budget = budgetService.loadUserBudget(userId);
        // Find the sub budget that matches the userId and the startDate and endDate
//        Budget userBudget = budgetService.loadUserBudgetForPeriod(userId, startDate, endDate);
//        Long budgetId = userBudget.getId();

        // If the user has a budget, then check for any subBudgets and obtain the budget schedules
        // from the corresponding SubBudget

//        // Next, get the Budget Schedules tied to this budget
//        List<BudgetSchedule> budgetSchedules = userBudget.getBudgetSchedules();
//        Optional<BudgetSchedule> budgetScheduleOptional = Optional.empty();
//        if(budgetSchedules.size() == 1)
//        {
//            return Optional.of(budgetSchedules.get(0));
//        }
//        else if(budgetSchedules.isEmpty())
//        {
//            // Create a new budget schedule for the month and return
//            BudgetSchedule budgetSchedule = createBudgetSchedule(userId, startDate, endDate);
//            budgetScheduleOptional = Optional.of(budgetSchedule);
//        }
//        else
//        {
//            // IF the Budget Schedules list has multiple budget schedules
//            // Iterate through to find the budget schedule that matches the start date and end date
//            for(BudgetSchedule budgetSchedule : budgetSchedules)
//            {
//                if(budgetSchedule == null)
//                {
//                    continue;
//                }
//                LocalDate budgetScheduleStart = budgetSchedule.getStartDate();
//                LocalDate budgetScheduleEnd = budgetSchedule.getEndDate();
//                if(startDate.isEqual(budgetScheduleStart) && endDate.isEqual(budgetScheduleEnd))
//                {
//                    budgetScheduleOptional = Optional.of(budgetSchedule);
//                    setBudgetScheduleFound(true);
//                    break;
//                }
//                if(startDate.isAfter(budgetScheduleStart) && endDate.isEqual(budgetScheduleEnd))
//                {
//                    budgetScheduleOptional = Optional.of(budgetSchedule);
//                    setBudgetScheduleFound(true);
//                    break;
//                }
//            }
//            // If a budget Schedule is not found in the budgetSchedules list,
//            // Then we can query the database for budget schedules satisfying the criteria
//            if(!isBudgetScheduleFound)
//            {
//                Optional<BudgetSchedule> budgetScheduleOptional2 = getBudgetScheduleFromDatabase(budgetId, startDate, endDate);
//                if(budgetScheduleOptional2.isPresent())
//                {
//                    BudgetSchedule budgetSchedule2 = budgetScheduleOptional2.get();
//                    budgetScheduleOptional = Optional.of(budgetSchedule2);
//                }
//            }
//        }
//        return budgetScheduleOptional;
        return null;
    }


    public Optional<BudgetSchedule> createSingleBudgetSchedule(final LocalDate startDate, final LocalDate endDate, final Long budgetId)
    {
        if(startDate == null || endDate == null)
        {
            return Optional.empty();
        }
        Optional<BudgetSchedule> budgetScheduleOptional;
        try
        {
            if(budgetId < 0)
            {
                throw new IllegalArgumentException("budgetId cannot be negative: " + budgetId);
            }
            BudgetSchedule budgetSchedule = getBudgetSchedule(startDate, endDate, budgetId);
            budgetScheduleOptional = Optional.of(budgetSchedule);

        }catch(IllegalArgumentException e)
        {
            log.error("There was an error building budget schedules by date/period: " + e.getMessage());
            throw e;
        }
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
    public List<BudgetSchedule> createBudgetSchedules(final Long userId, final LocalDate startMonth, final boolean isFutureEnabled, final int numberOfMonths)
    {
        if(startMonth == null)
        {
            return Collections.emptyList();
        }
//        List<BudgetSchedule> budgetSchedules = new ArrayList<>();
//        Set<BudgetSchedule> uniqueBudgetSchedules = new HashSet<>();
//        try
//        {
//            if(numberOfMonths < 0)
//            {
//                throw new IllegalArgumentException("Number of months cannot be less than 1");
//            }
//            // Determine the endDate using the startMonth and the numberOfMonths
//            LocalDate currentStartDate = isFutureEnabled ? startMonth.plusMonths(1) : startMonth;
//            if(period == Period.MONTHLY)
//            {
//                // When iterating through the months we need to exclude the current month and only add the future months to the budget schedules list
//                for(int monthIndex = 0; monthIndex <= numberOfMonths; monthIndex++)
//                {
//                    LocalDate startDate = currentStartDate.withDayOfMonth(1);
//                    LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
//                    // Is there a budget for this timeframe?
//                    Budget budgetForPeriod = budgetService.loadUserBudgetForPeriod(userId, startDate, endDate);
//
//                    // If a budget exists, are there any sub budgets that correspond to this time frame?
//
//                    // If so, then obtain the budget schedules
//
//                    Long budgetId = budgetForPeriod.getId();
//                    List<BudgetSchedule> budgetSchedulesList = budgetForPeriod.getBudgetSchedules();
//                    boolean isBudgetScheduleFound = false;
//                    if(!budgetSchedulesList.isEmpty())
//                    {
//                        for(BudgetSchedule budgetSchedule : budgetSchedulesList)
//                        {
//                            if(budgetSchedule == null)
//                            {
//                                log.error("No Budget Schedule found for period: {} to {} with budgetId: {}", startDate, endDate, budgetId);
//                                addMissingBudgetScheduleCriteria(budgetId, startDate, endDate);
//                                continue;
//                            }
//                            LocalDate budgetScheduleStartDate = budgetSchedule.getStartDate();
//                            LocalDate budgetScheduleEndDate = budgetSchedule.getEndDate();
//                            if(startDate.isEqual(budgetScheduleStartDate) && endDate.isEqual(budgetScheduleEndDate))
//                            {
//                                isBudgetScheduleFound = true;
//                                uniqueBudgetSchedules.add(budgetSchedule);
//                                break;
//                            }
//                        }
//                        // If no Budget Schedule was found in the existing budget schedules list from our budget
//                        // then create new budget schedules for the designated periods
//                        if(!isBudgetScheduleFound)
//                        {
//                            BudgetSchedule budgetSchedule = getBudgetSchedule(startDate, endDate, budgetId);
//                            uniqueBudgetSchedules.add(budgetSchedule);
//                        }
//                    }
//                    // If the BudgetSchedules list doesn't have any existing budget schedules for this period
//                    // Then create new budget schedule for this period
//                    else
//                    {
//                        Optional<BudgetSchedule> newBudgetScheduleOptional = createSingleBudgetSchedule(startDate, endDate, budgetId);
//                        if(newBudgetScheduleOptional.isEmpty())
//                        {
//                            return Collections.emptyList();
//                        }
//                        BudgetSchedule newBudgetSchedule = newBudgetScheduleOptional.get();
//                        uniqueBudgetSchedules.add(newBudgetSchedule);
//                    }
//                    // Move to the next month
//                   currentStartDate = isFutureEnabled ? currentStartDate.plusMonths(1) : currentStartDate.minusMonths(1);
//                }
//            }
//
//            budgetSchedules.addAll(uniqueBudgetSchedules);
//
//            // Sort by start date to ensure order
//            if (!isFutureEnabled) {
//                budgetSchedules.sort(Comparator.comparing(BudgetSchedule::getStartDate).reversed());
//            } else {
//                budgetSchedules.sort(Comparator.comparing(BudgetSchedule::getStartDate));
//            }
//
//            return budgetSchedules;
//
//        }catch(IllegalArgumentException e)
//        {
//            log.error("There was an error while trying to create a future budget schedule: ", e);
//            throw e;
//        }
        return null;
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
                Long budgetId = entry.getKey();
                List<DateRange> dateRanges = entry.getValue();
                if(dateRanges.isEmpty())
                {
                    break;
                }
                for(DateRange dateRange : dateRanges)
                {
                    LocalDate dateRangeStart = dateRange.getStartDate();
                    LocalDate dateRangeEnd = dateRange.getEndDate();
                    if(dateRangeStart == null || dateRangeEnd == null)
                    {
                        throw new IllegalDateException("Start Date or End Date missing for budgetId: " + budgetId + " in date range: " + dateRange.toString());
                    }
                    BudgetSchedule budgetSchedule = getBudgetSchedule(dateRangeStart, dateRangeEnd, budgetId);
                    budgetSchedules.add(budgetSchedule);
                }
            }
        }catch(IllegalDateException e){
            log.error("There was an error with one of the budget date ranges: ", e);
            throw e;
        }

        return budgetSchedules;
    }

    private static @NotNull BudgetSchedule getBudgetSchedule(LocalDate startDate, LocalDate endDate, Long budgetId)
    {
        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setStartDate(startDate);
        budgetSchedule.setEndDate(endDate);
        budgetSchedule.setPeriod(Period.MONTHLY);
        budgetSchedule.setBudgetId(budgetId); // Hardcoded for simplicity, replace with actual logic if needed
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
                .collect(Collectors.groupingBy(BudgetSchedule::getBudgetId));
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
        budgetSchedule1.setBudgetId(newBudgetSchedule.getBudgetId());
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
                Long budgetScheduledId = budgetSchedule.getBudgetId();
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
