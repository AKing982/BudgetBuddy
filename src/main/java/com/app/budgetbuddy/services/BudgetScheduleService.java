package com.app.budgetbuddy.services;


import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.BudgetScheduleEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BudgetScheduleService extends ServiceModel<BudgetScheduleEntity>
{
    BudgetSchedule createBudgetScheduleByEntity(BudgetScheduleEntity budgetScheduleEntity);

    BudgetSchedule createBudgetSchedule(Long budgetId, LocalDate budgetStartDate, LocalDate budgetEndDate, DateRange budgetDateRange, String status);

    Optional<BudgetScheduleEntity> findByBudgetId(Long budgetId);

    List<BudgetScheduleEntity> findByStatus(ScheduleStatus status);

    List<BudgetScheduleEntity> findActiveSchedules(LocalDate date);

    List<BudgetScheduleEntity> findByPeriodType(PeriodType periodType);

    List<BudgetScheduleEntity> findSchedulesInDateRange(LocalDate startDate, LocalDate endDate);

    Optional<BudgetSchedule> findBudgetScheduleById(Long budgetScheduleId);

    void updateBudgetSchedule(BudgetSchedule budgetSchedule);

    void saveBudgetSchedule(BudgetSchedule budgetSchedule);

    BudgetScheduleEntity createSchedule(
            BudgetEntity budget,
            LocalDate startDate,
            LocalDate endDate,
            String scheduleRange,
            Integer totalPeriodsInRange,
            PeriodType periodType
    );

    void updateScheduleStatus(Long scheduleId, ScheduleStatus newStatus);

    void deleteSchedule(Long scheduleId);

    boolean isScheduleActive(Long scheduleId);

    List<BudgetScheduleEntity> getUpcomingSchedules(LocalDate fromDate, int limit);

    Optional<BudgetSchedule> getBudgetScheduleByDate(Long budgetId, LocalDate startDate, LocalDate endDate);

}
