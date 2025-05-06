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
    public Optional<SubBudgetEntity> findById(Long id)
    {
        try
        {
            return subBudgetRepository.findById(id);
        }catch(DataAccessException e)
        {
            log.error("There was an error retrieving the sub-budget with id: {}", id, e);
            return Optional.empty();
        }
    }

    @Override
    public Optional<SubBudget> getSubBudgetsByUserIdAndDate(Long userId, LocalDate startDate, LocalDate endDate)
    {
        try
        {

            Optional<SubBudgetEntity> subBudgetEntities = subBudgetRepository.findSubBudgetEntityByIdAndDate(userId, startDate, endDate);
            if(subBudgetEntities.isEmpty())
            {
                return Optional.empty();
            }
            SubBudgetEntity subBudgetEntity = subBudgetEntities.get();
            SubBudget subBudget = subBudgetEntityConverter.convert(subBudgetEntity);
            return Optional.of(subBudget);
        }catch(DataAccessException e)
        {
            log.error("There was an error getting the subBudgets from the database: ", e);
            return Optional.empty();
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
            SubBudgetEntity subBudgetEntity = convertSubBudgetToEntity(subBudget);
            log.debug("Saving SubBudgetEntity: budgetId={}, id={}", subBudgetEntity.getBudget().getId(), subBudgetEntity.getId());
            SubBudgetEntity savedEntity = subBudgetRepository.save(subBudgetEntity);
            log.debug("Saved SubBudgetEntity with ID: {}", savedEntity.getId());

            // Fetch the entity post-save to ensure we get the generated ID
            Optional<SubBudgetEntity> fetchedEntity = subBudgetRepository.findById(savedEntity.getId());
            if (fetchedEntity.isEmpty()) {
                log.error("Failed to fetch SubBudgetEntity after save with ID: {}", savedEntity.getId());
                return Optional.of(savedEntity); // Fallback to saved entity if fetch fails
            }

            log.debug("Saved and fetched SubBudgetEntity with ID: {}", fetchedEntity.get().getId());
            return fetchedEntity;

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

    @Override
    public Optional<SubBudgetEntity> updateSubBudget(SubBudget subBudget)
    {
        return Optional.empty();
    }


    private SubBudgetEntity convertSubBudgetToEntity(SubBudget subBudget)
    {
        SubBudgetEntity subBudgetEntity = new SubBudgetEntity();
        subBudgetEntity.setActive(subBudget.isActive());
        subBudgetEntity.setAllocatedAmount(subBudget.getAllocatedAmount());
        subBudgetEntity.setSubBudgetName(subBudget.getSubBudgetName());
        subBudgetEntity.setSpentOnBudget(subBudget.getSpentOnBudget());
        subBudgetEntity.setStartDate(subBudget.getStartDate());
        subBudgetEntity.setYear(subBudget.getYear());
        subBudgetEntity.setEndDate(subBudget.getEndDate());
        subBudgetEntity.setSubSavingsAmount(subBudget.getSubSavingsAmount());
        subBudgetEntity.setSubSavingsTarget(subBudget.getSubSavingsTarget());
        Long budgetId = subBudget.getBudget().getId();
        BudgetEntity budgetEntity = getBudget(budgetId);
        List<BudgetSchedule> budgetSchedules = subBudget.getBudgetSchedule();
        subBudgetEntity.setBudget(budgetEntity);
        subBudgetEntity.setBudgetSchedules(convertBudgetSchedulesToEntities(budgetSchedules));
        return subBudgetEntity;
    }


    private @NotNull BudgetEntity getBudget(Long budgetId) {
        log.info("Getting budget with id: {}", budgetId);
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
