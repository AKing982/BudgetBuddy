package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.BudgetScheduleEntity;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BudgetRepository;
import com.app.budgetbuddy.repositories.SubBudgetRepository;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
public class SubBudgetServiceImpl implements SubBudgetService
{
    private final SubBudgetRepository subBudgetRepository;
    private final BudgetRepository budgetRepository;

    @Autowired
    public SubBudgetServiceImpl(SubBudgetRepository subBudgetRepository,
                                BudgetRepository budgetRepository)
    {
        this.subBudgetRepository = subBudgetRepository;
        this.budgetRepository = budgetRepository;
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

                Long budgetId = budgetSchedule.getBudgetId();
                budgetScheduleEntity.setBudget(getBudget(budgetId));
                budgetScheduleEntities.add(budgetScheduleEntity);
            }
            return budgetScheduleEntities;
        }catch(Exception e)
        {
            log.error("There was an error converting the budget schedules to entities: ", e);
            return Collections.emptySet();
        }
    }

    private List<SubBudget> convertSubBudgetEntitiesToSubBudget(List<SubBudgetEntity> subBudgetEntities)
    {
        List<SubBudget> subBudgets = new ArrayList<>();
        try
        {
            for(SubBudgetEntity subBudgetEntity : subBudgetEntities)
            {
                SubBudget subBudget = new SubBudget();
                subBudget.setId(subBudgetEntity.getId());
                subBudget.setActive(subBudgetEntity.isActive());
                subBudget.setAllocatedAmount(subBudgetEntity.getAllocatedAmount());
                subBudget.setSpentOnBudget(subBudgetEntity.getSpentOnBudget());
                subBudget.setSubBudgetName(subBudgetEntity.getSubBudgetName());
                subBudget.setStartDate(subBudgetEntity.getStartDate());
                subBudget.setEndDate(subBudgetEntity.getEndDate());
                subBudget.setSubSavingsTarget(subBudgetEntity.getSubSavingsTarget());
                subBudget.setSubSavingsAmount(subBudgetEntity.getSubSavingsAmount());
                subBudget.setBudget(convertBudgetEntity(subBudgetEntity.getBudget()));
                subBudget.setBudgetSchedule(convertBudgetScheduleSet(subBudgetEntity.getBudgetSchedules()));
                subBudget.setSpentOnBudget(subBudgetEntity.getSpentOnBudget());
                subBudgets.add(subBudget);
            }
        }catch(Exception e){
            log.error("There was an error converting the sub budget entities to sub budgets; ", e);
            return Collections.emptyList();
        }

        return subBudgets;
    }

    private List<BudgetSchedule> convertBudgetScheduleSet(Set<BudgetScheduleEntity> budgetScheduleEntities)
    {
        List<BudgetSchedule> budgetSchedules = new ArrayList<>();
        for(BudgetScheduleEntity budgetScheduleEntity : budgetScheduleEntities)
        {
            BudgetSchedule budgetSchedule = convertBudgetScheduleEntity(budgetScheduleEntity);
            budgetSchedules.add(budgetSchedule);
        }
        return budgetSchedules;
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

    private Budget convertBudgetEntity(BudgetEntity budgetEntity)
    {
        if(budgetEntity == null) {
            return null;
        }
        Budget budget = new Budget();
        budget.setId(budgetEntity.getId());
        budget.setUserId(budgetEntity.getUser().getId());
        budget.setActual(budgetEntity.getBudgetActualAmount());
        budget.setBudgetMode(budgetEntity.getBudgetMode());
        budget.setSavingsAmountAllocated(budgetEntity.getActualAllocationAmount());
        budget.setSavingsProgress(budgetEntity.getSavingsProgress());
        budget.setStartDate(budgetEntity.getBudgetStartDate());
        budget.setEndDate(budgetEntity.getBudgetEndDate());
        budget.setBudgetPeriod(budgetEntity.getBudgetPeriod());
        budget.setBudgetAmount(budgetEntity.getBudgetAmount());
        budget.setTotalMonthsToSave(budgetEntity.getTotalMonthsToSave());
        budget.setBudgetName(budgetEntity.getBudgetName());
        budget.setBudgetDescription(budgetEntity.getBudgetDescription());
//        budget.setSubBudgets(convertBudgetScheduleEntities(budgetEntity.getBudgetSchedules()));
        return budget;
    }
}
