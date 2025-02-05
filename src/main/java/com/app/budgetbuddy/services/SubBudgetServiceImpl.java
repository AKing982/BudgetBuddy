package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.BudgetScheduleEntity;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BudgetRepository;
import com.app.budgetbuddy.repositories.SubBudgetRepository;
import com.app.budgetbuddy.workbench.converter.SubBudgetEntityConverter;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static com.app.budgetbuddy.workbench.budget.BudgetUtil.*;

@Service
@Slf4j
public class SubBudgetServiceImpl implements SubBudgetService
{
    private final SubBudgetRepository subBudgetRepository;
    private final BudgetRepository budgetRepository;
    private final SubBudgetEntityConverter subBudgetEntityConverter;

    @Autowired
    public SubBudgetServiceImpl(SubBudgetRepository subBudgetRepository,
                                BudgetRepository budgetRepository,
                                SubBudgetEntityConverter subBudgetEntityConverter)
    {
        this.subBudgetRepository = subBudgetRepository;
        this.budgetRepository = budgetRepository;
        this.subBudgetEntityConverter = subBudgetEntityConverter;
    }

    @Override
    public Collection<SubBudgetEntity> findAll()
    {
        try
        {
            return subBudgetRepository.findAll();

        }catch(DataAccessException e)
        {
            log.error("There was an error fetching all the subBudgets from the database: ", e);
            return Collections.emptyList();
        }
    }

    @Override
    public void save(SubBudgetEntity subBudgetEntity)
    {
        try
        {
            subBudgetRepository.save(subBudgetEntity);

        }catch(DataAccessException e)
        {
            log.error("There was an error saving the subBudget entity: ", e);
        }
    }

    @Override
    public void delete(SubBudgetEntity subBudgetEntity)
    {
        try
        {
            subBudgetRepository.delete(subBudgetEntity);
        }catch(DataAccessException e)
        {
            log.error("There was an error deleting the subBudget entity: ", e);
        }
    }

    @Override
    public Optional<SubBudgetEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    public List<SubBudget> getSubBudgetsByUserIdAndDate(Long userId, LocalDate startDate, LocalDate endDate)
    {
        try
        {

            List<SubBudgetEntity> subBudgetEntities = subBudgetRepository.findSubBudgetEntityByIdAndDate(userId, startDate, endDate);
            return convertSubBudgetEntitiesToSubBudget(subBudgetEntities);
        }catch(DataAccessException e)
        {
            log.error("There was an error getting the subBudgets from the database: ", e);
            return Collections.emptyList();
        }
    }

    @Override
    public Optional<SubBudgetEntity> saveSubBudget(SubBudget subBudget)
    {
        if(subBudget == null)
        {
            return Optional.empty();
        }
        try
        {
            SubBudgetEntity convertSubBudget = convertSubBudgetToEntity(subBudget);
            subBudgetRepository.save(convertSubBudget);
            return Optional.of(convertSubBudget);

        }catch(DataAccessException e)
        {
           log.error("There was an error saving the sub budget: ", e);
           return Optional.empty();
        }
    }

    @Override
    public Optional<SubBudget> findSubBudgetById(Long id)
    {
        if(id == null || id <= 0)
        {
            return Optional.empty();
        }
        try
        {
            Optional<SubBudgetEntity> subBudgetEntityOptional = subBudgetRepository.findById(id);
            if(subBudgetEntityOptional.isEmpty())
            {
                return Optional.empty();
            }
            SubBudgetEntity subBudgetEntity = subBudgetEntityOptional.get();
            SubBudget subBudget = subBudgetEntityConverter.convert(subBudgetEntity);
            return Optional.of(subBudget);
        }catch(DataAccessException e){
            log.error("There was an error getting the sub budget from the database: ", e);
            return Optional.empty();
        }
    }


    private SubBudgetEntity convertSubBudgetToEntity(SubBudget subBudget)
    {
        SubBudgetEntity subBudgetEntity = new SubBudgetEntity();
        subBudgetEntity.setId(subBudget.getId());
        subBudgetEntity.setActive(subBudget.isActive());
        subBudgetEntity.setAllocatedAmount(subBudget.getAllocatedAmount());
        subBudgetEntity.setSubBudgetName(subBudget.getSubBudgetName());
        subBudgetEntity.setSpentOnBudget(subBudget.getSpentOnBudget());
        subBudgetEntity.setStartDate(subBudget.getStartDate());
        subBudgetEntity.setEndDate(subBudget.getEndDate());
        subBudgetEntity.setSubSavingsAmount(subBudget.getSubSavingsAmount());
        subBudgetEntity.setSubSavingsTarget(subBudget.getSubSavingsTarget());
        Long budgetId = subBudget.getId();
        BudgetEntity budgetEntity = getBudget(budgetId);
        List<BudgetSchedule> budgetSchedules = subBudget.getBudgetSchedule();
        subBudgetEntity.setBudget(budgetEntity);
        subBudgetEntity.setBudgetSchedules(convertBudgetSchedulesToEntities(budgetSchedules));
        return subBudgetEntity;
    }


    private @NotNull BudgetEntity getBudget(Long budgetId) {
        Optional<BudgetEntity> budgetEntityOptional = budgetRepository.findById(budgetId);
        if(budgetEntityOptional.isEmpty()){
            throw new RuntimeException("No Budget found with id: " + budgetId);
        }
        return budgetEntityOptional.get();
    }


    private Set<BudgetScheduleEntity> convertBudgetSchedulesToEntities(final List<BudgetSchedule> budgetSchedules)
    {
        Set<BudgetScheduleEntity> budgetScheduleEntities = new HashSet<>();
        try
        {
            for(BudgetSchedule budgetSchedule : budgetSchedules)
            {
                BudgetScheduleEntity budgetScheduleEntity = new BudgetScheduleEntity();
                budgetScheduleEntity.setEndDate(budgetSchedule.getEndDate());
                budgetScheduleEntity.setStartDate(budgetSchedule.getStartDate());
                budgetScheduleEntity.setStatus(ScheduleStatus.ACTIVE);
                budgetScheduleEntity.setTotalPeriodsInRange(budgetSchedule.getTotalPeriods());
                budgetScheduleEntity.setScheduleRange(budgetSchedule.getScheduleRange().toString());

                Long subBudgetId = budgetSchedule.getSubBudgetId();
                Optional<SubBudgetEntity> subBudgetEntityOptional = subBudgetRepository.findById(subBudgetId);
                if(subBudgetEntityOptional.isEmpty()){
                    throw new RuntimeException("No SubBudget found with id: " + subBudgetId);
                }
                SubBudgetEntity subBudgetEntity = subBudgetEntityOptional.get();
                budgetScheduleEntity.setSubBudget(subBudgetEntity);
                budgetScheduleEntities.add(budgetScheduleEntity);
            }
            return budgetScheduleEntities;
        }catch(Exception e)
        {
            log.error("There was an error converting the budget schedules to entities: ", e);
            return Collections.emptySet();
        }
    }



}
