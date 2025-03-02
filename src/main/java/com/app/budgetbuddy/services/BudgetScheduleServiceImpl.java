package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.BudgetScheduleEntity;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.exceptions.BudgetScheduleException;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.repositories.BudgetScheduleRepository;
import com.app.budgetbuddy.repositories.SubBudgetRepository;
import com.app.budgetbuddy.workbench.budget.BudgetUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
public class BudgetScheduleServiceImpl implements BudgetScheduleService
{
    private final BudgetScheduleRepository budgetScheduleRepository;
    private final BudgetService budgetService;
    private final SubBudgetRepository subBudgetRepository;

    @Autowired
    public BudgetScheduleServiceImpl(BudgetScheduleRepository budgetScheduleRepository,
                                     BudgetService budgetService,
                                     SubBudgetRepository subBudgetRepository)
    {
        this.budgetScheduleRepository = budgetScheduleRepository;
        this.budgetService = budgetService;
        this.subBudgetRepository = subBudgetRepository;
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
    @Transactional
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
    public Optional<BudgetSchedule> findBudgetScheduleById(Long budgetScheduleId)
    {
        try
        {
            Optional<BudgetScheduleEntity> budgetScheduleEntityOptional = budgetScheduleRepository.findById(budgetScheduleId);
            if(budgetScheduleEntityOptional.isEmpty())
            {
                return Optional.empty();
            }
            BudgetScheduleEntity budgetScheduleEntity = budgetScheduleEntityOptional.get();
            return Optional.of(convertBudgetScheduleEntity(budgetScheduleEntity));
        }catch(DataAccessException e){
            log.error("There was a problem finding the budget schedule", e);
            return Optional.empty();
        }
    }

    @Override
    public void updateBudgetSchedule(BudgetSchedule budgetSchedule)
    {
        if(budgetSchedule == null)
        {
            return;
        }
        try
        {
            Optional<BudgetScheduleEntity> budgetScheduleEntityOptional = buildBudgetScheduleEntity(budgetSchedule);
            if(budgetScheduleEntityOptional.isEmpty())
            {
                throw new RuntimeException("Budget Schedule with id: " + budgetScheduleEntityOptional.get().getId() + " not found");
            }
            BudgetScheduleEntity budgetScheduleEntity = budgetScheduleEntityOptional.get();
            Long budgetScheduleId = budgetScheduleEntity.getId();
            LocalDate startDate = budgetScheduleEntity.getStartDate();
            LocalDate endDate = budgetScheduleEntity.getEndDate();
            String scheduleRange = budgetScheduleEntity.getScheduleRange();
            int totalPeriods = budgetScheduleEntity.getTotalPeriodsInRange();
            Period period = budgetScheduleEntity.getPeriodType();
            ScheduleStatus status = budgetScheduleEntity.getStatus();
            budgetScheduleRepository.updateBudgetSchedule(budgetScheduleId, startDate, endDate, scheduleRange, totalPeriods, period, status);

        }catch(DataAccessException e){
            log.error("There was a problem updating the budget schedule", e);
            return;
        }
    }

    @Override
    @Transactional
    public Optional<BudgetScheduleEntity> saveBudgetSchedule(BudgetSchedule budgetSchedule)
    {
         try
         {
             log.info("Processing Budget Schedule: {}", budgetSchedule.toString());
             Optional<BudgetScheduleEntity> budgetScheduleEntityOptional = buildBudgetScheduleEntity(budgetSchedule);
             if(budgetScheduleEntityOptional.isEmpty())
             {
                 return Optional.empty();
             }
             BudgetScheduleEntity budgetScheduleEntity = budgetScheduleEntityOptional.get();
             log.info("Saving newly created budgetScheduleEntity: {}", budgetScheduleEntity.toString());
             return Optional.of(budgetScheduleRepository.save(budgetScheduleEntity));
         }catch(DataAccessException e){
             log.error("There was a problem saving the budget schedule", e);
             return Optional.empty();
         }
    }

    @Override
    public Optional<BudgetScheduleEntity> saveBudgetScheduleEntity(BudgetScheduleEntity budgetScheduleEntity)
    {
        if(budgetScheduleEntity == null)
        {
            return Optional.empty();
        }
        try
        {
            return Optional.of(budgetScheduleRepository.save(budgetScheduleEntity));
        }catch(DataAccessException e)
        {
            log.error("There was a problem saving the budget schedule", e);
            return Optional.empty();
        }
    }

    public Optional<BudgetScheduleEntity> buildBudgetScheduleEntity(final BudgetSchedule budgetSchedule)
    {
        log.info("Budget Schedule: {}", budgetSchedule.toString());
        Long subBudgetId = budgetSchedule.getSubBudgetId();
        Optional<SubBudgetEntity> subBudgetEntityOptional = subBudgetRepository.findById(subBudgetId);
        if(subBudgetEntityOptional.isEmpty())
        {
            return Optional.empty();
        }
        SubBudgetEntity subBudgetEntity = subBudgetEntityOptional.get();
        // Check for existing schedule
        try
        {
            Optional<BudgetScheduleEntity> existingSchedule = budgetScheduleRepository.findByBudgetId(subBudgetId);
            if (existingSchedule.isPresent())
            {
                log.info("BudgetSchedule already exists for subBudgetId={}", subBudgetId);
                return Optional.of(existingSchedule.get());
            }
            BudgetScheduleEntity budgetScheduleEntity = new BudgetScheduleEntity();
            budgetScheduleEntity.setScheduleRange(budgetSchedule.getScheduleRange().toString());
            budgetScheduleEntity.setEndDate(budgetSchedule.getEndDate());
            budgetScheduleEntity.setStartDate(budgetSchedule.getStartDate());
            // Make sure periodType isn't null before using it
            if (budgetSchedule.getPeriodType() != null) {
                budgetScheduleEntity.setPeriodType(budgetSchedule.getPeriodType());
            } else {
                // Set a default or throw an appropriate error
                budgetScheduleEntity.setPeriodType(Period.MONTHLY); // Assuming MONTHLY is your default
            }
            budgetScheduleEntity.setStatus(ScheduleStatus.valueOf(budgetSchedule.getStatus()));
            budgetScheduleEntity.setTotalPeriodsInRange(budgetSchedule.getTotalPeriods());
            budgetScheduleEntity.setSubBudget(subBudgetEntity);
            return Optional.of(budgetScheduleEntity);

        }catch(BudgetScheduleException e){
            log.error("There was a problem building the budget schedule entity: ", e);
            return Optional.empty();
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
        return BudgetUtil.convertBudgetScheduleEntity(budgetScheduleEntity);
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
