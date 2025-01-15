package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.BudgetSchedule;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.domain.Period;
import com.app.budgetbuddy.exceptions.BudgetScheduleException;
import com.app.budgetbuddy.services.BudgetScheduleService;
import com.app.budgetbuddy.services.BudgetScheduleServiceImpl;
import com.app.budgetbuddy.services.BudgetService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

/**
 * This class will implement logic for building both past and future Budget Schedules\
 * This class will handle building Budget Schedules that can span over normal month ranges,
 * or custom ranges depending on the particular budget plan
 * This class will also need to build BudgetSchedules for up to 1-2 months in the future and also build budget schedules for past or previous periods
 */
@Service
@Slf4j
public class BudgetScheduleEngine
{
    private BudgetService budgetService;
    private BudgetScheduleService budgetScheduleService;

    @Autowired
    public BudgetScheduleEngine(BudgetService budgetService,
                                BudgetScheduleService budgetScheduleService)
    {
        this.budgetService = budgetService;
        this.budgetScheduleService = budgetScheduleService;
    }
    /**
     * This method will build a budget schedule for a particular month
     *
     */
    public Optional<BudgetSchedule> createMonthBudgetSchedule(final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        if(userId == null || startDate == null || endDate == null)
        {
            return Optional.empty();
        }
        // Find the budget that matches the userId and the startDate and endDate
        Budget userBudget = budgetService.loadUserBudgetForPeriod(userId, startDate, endDate);

        // Next, get the Budget Schedules tied to this budget
        List<BudgetSchedule> budgetSchedules = userBudget.getBudgetSchedules();
        Optional<BudgetSchedule> budgetScheduleOptional = Optional.empty();
        if(budgetSchedules.size() == 1)
        {
            return Optional.of(budgetSchedules.get(0));
        }
        else if(budgetSchedules.size() > 1)
        {
            Set<BudgetSchedule> foundBudgetSchedules = new HashSet<>();
            for(BudgetSchedule budgetSchedule : budgetSchedules)
            {
                LocalDate budgetScheduleStartDate = budgetSchedule.getStartDate();
                log.info("Budget schedule start date: {}", budgetScheduleStartDate);
                LocalDate budgetScheduleEndDate = budgetSchedule.getEndDate();
                log.info("Budget schedule end date: {}", budgetScheduleEndDate);

                // CASE 1: The BudgetSchedule Start Date is equal to the start date and Budget Schedule End date is equal to the end date
                if(startDate.isEqual(budgetScheduleStartDate) || endDate.isEqual(budgetScheduleEndDate))
                {
                    log.info("Found Budget Schedule: " + budgetSchedule.toString());
                    foundBudgetSchedules.add(budgetSchedule);
                    break;
                }
                //CASE 2: The startDate is between the BudgetSchedule start date and BudgetSchedule end date
            }
            if(foundBudgetSchedules.size() == 1)
            {
                budgetScheduleOptional = Optional.of(foundBudgetSchedules.iterator().next());
            }
        }
        return budgetScheduleOptional;
    }

    /**
     * Creates budget schedules for future periods
     *
     * @param budget The budget to create future schedules for
     * @param numberOfMonths Number of months to generate schedules for
     * @return List<BudgetSchedule> Generated future schedules
     */
    public List<BudgetSchedule> createFutureBudgetSchedules(Long userId, LocalDate startMonth, int numberOfMonths)
    {
        return null;
    }

    /**
     * Creates budget schedules for past periods
     *
     * @param budget The budget to create past schedules for
     * @param startDate The start date for past schedules
     * @return List<BudgetSchedule> Generated past schedules
     */
    public List<BudgetSchedule> createPastBudgetSchedules(final LocalDate startDate, final int numberOfMonths, final Long userId)
    {
        return null;
    }

    public Optional<BudgetSchedule> createSingleBudgetSchedule(final Long userId, final LocalDate startDate, final LocalDate endDate, final Period period)
    {
        return null;
    }

    public Optional<BudgetSchedule> updateBudgetSchedule(final Long budgetScheduleId, final BudgetSchedule budgetSchedule){
        return Optional.empty();
    }

    /**
     * Retrieves budget schedules for a specified user within a date range.
     *
     * @param userId ID of the user whose budget schedules to retrieve
     * @param startDate Start date of the query range
     * @param endDate End date of the query range
     * @return List of BudgetSchedule objects within the given date range
     */
    public List<BudgetSchedule> getBudgetSchedulesByDateRange(final Long userId,
                                                              final LocalDate startDate,
                                                              final LocalDate endDate)
    {
        // Implementation here
        return new ArrayList<>();
    }

    /**
     * Retrieves a single BudgetSchedule by its unique ID.
     *
     * @param budgetScheduleId The ID of the BudgetSchedule
     * @return An Optional containing the BudgetSchedule if found, or empty if not found
     */
    public Optional<BudgetSchedule> getBudgetScheduleById(final Long budgetScheduleId)
    {
        // Implementation here
        return Optional.empty();
    }

    public Map<Budget, List<BudgetSchedule>> groupBudgetSchedulesByBudget(List<BudgetSchedule> budgetSchedules)
    {
        return null;
    }

    public Map<Long, List<BudgetSchedule>> groupBudgetSchedulesByBudgetId(List<BudgetSchedule> budgetSchedules){
        return null;
    }

    /**
     * Deletes a BudgetSchedule by ID.
     *
     * @param budgetScheduleId The ID of the BudgetSchedule to delete
     * @return true if deletion was successful, false otherwise
     */
    public boolean deleteBudgetSchedule(final Long budgetScheduleId)
    {
        // Implementation here
        return false;
    }

    public void saveBudgetSchedule(final BudgetSchedule budgetSchedule){

    }

    public void saveOrUpdateBudgetSchedules(List<BudgetSchedule> budgetSchedules){

    }

}
