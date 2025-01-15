package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.BudgetScheduleEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.repositories.BudgetScheduleRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class BudgetScheduleServiceImpl implements BudgetScheduleService
{
    private final BudgetScheduleRepository budgetScheduleRepository;
    private final BudgetService budgetService;

    @Autowired
    public BudgetScheduleServiceImpl(BudgetScheduleRepository budgetScheduleRepository,
                                     BudgetService budgetService)
    {
        this.budgetScheduleRepository = budgetScheduleRepository;
        this.budgetService = budgetService;
    }

    @Override
    public Collection<BudgetScheduleEntity> findAll()
    {
        try
        {
            return budgetScheduleRepository.findAll();
        }catch(DataAccessException e)
        {
            log.error("There was a problem finding all the budget schedules", e);
            return Collections.emptyList();
        }
    }

    @Override
    public void save(BudgetScheduleEntity budgetPeriodEntity)
    {
        try
        {
            budgetScheduleRepository.save(budgetPeriodEntity);

        }catch(DataException e){
            log.error("There was a problem saving the budget schedule", e);
            return;
        }
    }

    @Override
    public void delete(BudgetScheduleEntity budgetPeriodEntity) {
        try
        {
            budgetScheduleRepository.delete(budgetPeriodEntity);

        }catch(DataException e){
            log.error("There was a problem deleting the budget schedule", e);
            return;
        }
    }

    @Override
    public Optional<BudgetScheduleEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    public BudgetSchedule createBudgetScheduleByEntity(BudgetScheduleEntity budgetScheduleEntity) {
        return null;
    }

    @Override
    public BudgetSchedule createBudgetSchedule(Long budgetId, LocalDate budgetStartDate, LocalDate budgetEndDate, DateRange budgetDateRange, String status) {
        return null;
    }

    @Override
    public Optional<BudgetScheduleEntity> findByBudgetId(Long budgetId) {
        return Optional.empty();
    }

    @Override
    public List<BudgetScheduleEntity> findByStatus(ScheduleStatus status) {
        return List.of();
    }

    @Override
    public List<BudgetScheduleEntity> findActiveSchedules(LocalDate date) {
        return List.of();
    }

    @Override
    public List<BudgetScheduleEntity> findByPeriodType(PeriodType periodType) {
        return List.of();
    }

    @Override
    public List<BudgetScheduleEntity> findSchedulesInDateRange(LocalDate startDate, LocalDate endDate)
    {
        try
        {
            return budgetScheduleRepository.findSchedulesInDateRange(startDate, endDate);

        }catch(DataAccessException e){
            log.error("There was a problem finding all the budget schedules between {} and {}", startDate, endDate, e);
            return Collections.emptyList();
        }
    }

    @Override
    public BudgetScheduleEntity createSchedule(BudgetEntity budget, LocalDate startDate, LocalDate endDate, String scheduleRange, Integer totalPeriodsInRange, PeriodType periodType) {
        return null;
    }

    @Override
    public void updateScheduleStatus(Long scheduleId, ScheduleStatus newStatus) {

    }

    @Override
    public void deleteSchedule(Long scheduleId)
    {

    }

    @Override
    public boolean isScheduleActive(Long scheduleId)
    {
        return false;
    }

    @Override
    public List<BudgetScheduleEntity> getUpcomingSchedules(LocalDate fromDate, int limit) {
        return List.of();
    }

    @Override
    public Optional<BudgetSchedule> getBudgetScheduleByDate(Long budgetId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            Optional<BudgetScheduleEntity> budgetScheduleEntity = budgetScheduleRepository.findByBudgetIdAndDates(startDate, endDate, budgetId);
            if(budgetScheduleEntity.isEmpty())
            {
                return Optional.empty();
            }
            BudgetSchedule convertedBudgetSchedule = convertBudgetScheduleEntity(budgetScheduleEntity.get());
            return Optional.of(convertedBudgetSchedule);

        }catch(DataAccessException e){
            log.error("There was a problem finding the budget schedule", e);
            return Optional.empty();
        }
    }

    private BudgetSchedule convertBudgetScheduleEntity(BudgetScheduleEntity budgetScheduleEntity)
    {
        BudgetEntity budgetEntity = budgetScheduleEntity.getBudget();
        return BudgetSchedule.builder()
                .budgetId(budgetEntity.getId())
                .endDate(budgetScheduleEntity.getEndDate())
                .startDate(budgetScheduleEntity.getStartDate())
                .scheduleRange(new DateRange(budgetScheduleEntity.getStartDate(), budgetScheduleEntity.getEndDate()))
                .period(budgetScheduleEntity.getPeriodType())
                .status(budgetScheduleEntity.getStatus().name())
                .totalPeriods(budgetScheduleEntity.getTotalPeriodsInRange())
                .createdDate(LocalDateTime.now())
                .build();
    }

    private Budget convertBudgetEntity(BudgetEntity budgetEntity){
        Budget budget = new Budget();
        budget.setId(budgetEntity.getId());
        budget.setBudgetName(budgetEntity.getBudgetName());
        budget.setBudgetDescription(budgetEntity.getBudgetDescription());
        budget.setUserId(budgetEntity.getUser().getId());
        budget.setBudgetAmount(budgetEntity.getBudgetAmount());
        budget.setActual(budgetEntity.getBudgetActualAmount());
        return budget;
    }
}
