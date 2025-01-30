package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.BudgetScheduleEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BudgetRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class BudgetServiceImpl implements BudgetService
{
    private final BudgetRepository budgetRepository;

    @Autowired
    public BudgetServiceImpl(BudgetRepository budgetRepository)
    {
        this.budgetRepository = budgetRepository;
    }

    @Override
    public Collection<BudgetEntity> findAll() {
        return budgetRepository.findAll();
    }

    @Override
    public void save(BudgetEntity budgetEntity) {
        budgetRepository.save(budgetEntity);
    }

    @Override
    public void delete(BudgetEntity budgetEntity) {
        budgetRepository.delete(budgetEntity);
    }

    @Override
    public Optional<BudgetEntity> findById(Long id) {
        return budgetRepository.findById(id);
    }

    @Override
    public Budget loadUserBudget(Long userId) {
        Optional<BudgetEntity> budgetEntityOptional = budgetRepository.findById(userId);
        if (budgetEntityOptional.isEmpty()) {
            throw new RuntimeException("Budget not found");
        }
        BudgetEntity budgetEntity = budgetEntityOptional.get();
        return convertBudgetEntity(budgetEntity);
    }

    @Override
    public Budget loadUserBudgetForPeriod(Long userId, LocalDate startDate, LocalDate endDate) {
        try
        {
            Optional<BudgetEntity> budgetEntityOptional = budgetRepository.findBudgetByUserIdAndDates(startDate, endDate, userId);
            return budgetEntityOptional.map(this::convertBudgetEntity).orElseThrow(() -> new RuntimeException("Budget not found"));
        }catch(DataAccessException e){
            log.error("There was an error loading budget for period: {} - {}, {}", startDate, endDate, e.getMessage());
            return null;
        }
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

    private Optional<BudgetEntity> createBudgetEntity(final Budget budget)
    {
        try
        {
            BudgetEntity budgetEntity = new BudgetEntity();
            budgetEntity.setId(budget.getId());
            budgetEntity.setBudgetPeriod(budget.getBudgetPeriod());
            budgetEntity.setBudgetAmount(budget.getBudgetAmount());
            budgetEntity.setBudgetStartDate(budget.getStartDate());
            budgetEntity.setBudgetMode(budget.getBudgetMode());
            budgetEntity.setBudgetActualAmount(budget.getActual());
            budgetEntity.setSavingsProgress(budget.getSavingsProgress());
            budgetEntity.setBudgetName(budget.getBudgetName());
            budgetEntity.setBudgetDescription(budget.getBudgetDescription());
//
//            List<BudgetSchedule> budgetSchedules = budget.getBudgetSchedules();
//            if(budgetSchedules.isEmpty())
//            {
//                log.warn("Budget with Id: {} found with no budget schedules", budget.getId());
//                budgetEntity.setBudgetSchedules(Set.of());
//            }
//            List<BudgetScheduleEntity> budgetScheduleEntities = convertBudgetSchedulesToEntity(budgetSchedules);
//            Set<BudgetScheduleEntity> budgetScheduleEntitySet = new HashSet<>(budgetScheduleEntities);
//            budgetEntity.setSubBudgetEntities(budgetScheduleEntitySet);
//            return Optional.of(budgetEntity);
            return null;
        }catch(Exception e){
            log.error("There was an error creating the budget entity: ", e);
            return Optional.empty();
        }

    }

    private Budget convertBudget(BudgetEntity budgetEntity)
    {
        Budget budget = new Budget();
        budget.setId(budgetEntity.getId());
        budget.setBudgetName(budgetEntity.getBudgetName());
        budget.setBudgetDescription(budgetEntity.getBudgetDescription());
        budget.setUserId(budgetEntity.getUser().getId());
        budget.setBudgetAmount(budgetEntity.getBudgetAmount());
        budget.setActual(budgetEntity.getBudgetActualAmount());
        return budget;
    }

    private List<BudgetScheduleEntity> convertBudgetSchedulesToEntity(List<BudgetSchedule> budgetSchedules)
    {
        if(budgetSchedules.isEmpty())
        {
            return Collections.emptyList();
        }
        List<BudgetScheduleEntity> entities = new ArrayList<>();
        for (BudgetSchedule schedule : budgetSchedules)
        {
            BudgetScheduleEntity entity = new BudgetScheduleEntity();
            Long budgetId = schedule.getBudgetId();
            Optional<BudgetEntity> budgetEntity = findById(budgetId);
            BudgetEntity budget = budgetEntity.get();
            // Map basic fields
            entity.setId(schedule.getBudgetScheduleId());
            entity.setBudget(budget);  // if you need to associate it with a parent budget
            entity.setStartDate(schedule.getStartDate());
            entity.setEndDate(schedule.getEndDate());

            // Convert DateRange -> String
            if (schedule.getScheduleRange() != null) {
                entity.setScheduleRange(schedule.getScheduleRange().toString());
            }

            // totalPeriods -> totalPeriodsInRange
            entity.setTotalPeriodsInRange(schedule.getTotalPeriods());

            // period -> periodType
            entity.setPeriodType(schedule.getPeriod());

            /*
             * If your BudgetSchedule.status is just a String,
             * and your BudgetScheduleEntity expects an Enum (ScheduleStatus),
             * you need some logic to convert, e.g.:
             */
            if (schedule.getStatus() != null) {
                try {
                    entity.setStatus(ScheduleStatus.valueOf(schedule.getStatus().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    // Fallback or handle invalid enum string (optional)
                    entity.setStatus(ScheduleStatus.ACTIVE);
                }
            }

            // If you need a two-way relationship:
            // parentBudget.getBudgetSchedules().add(entity);

            entities.add(entity);
        }
        return entities;
    }

    private List<BudgetSchedule> convertBudgetScheduleEntities(Set<BudgetScheduleEntity> budgetScheduleEntitySet)
    {
        List<BudgetSchedule> budgetSchedules = new ArrayList<>();
        try
        {
            for(BudgetScheduleEntity budgetSchedule : budgetScheduleEntitySet)
            {
                BudgetEntity budgetEntity = budgetSchedule.getBudget();
                BudgetSchedule budgetSchedule1 = BudgetSchedule.builder()
                        .budgetId(budgetEntity.getId())
                        .endDate(budgetSchedule.getEndDate())
                        .startDate(budgetSchedule.getStartDate())
                        .period(budgetSchedule.getPeriodType())
                        .scheduleRange(new DateRange(budgetSchedule.getStartDate(), budgetSchedule.getEndDate()))
                        .totalPeriods(budgetSchedule.getTotalPeriodsInRange())
                        .status(budgetSchedule.getStatus().name())
                        .build();
                budgetSchedules.add(budgetSchedule1);
            }

        }catch(Exception e){
            log.error("There was an error converting the Budget Schedule Entities: ", e);
            return Collections.emptyList();
        }
        return budgetSchedules;
    }

    @Override
    public BudgetEntity createAndSaveBudget(BudgetCreateRequest createRequest) {
        BudgetEntity budgetEntity = new BudgetEntity();
        budgetEntity.setUser(UserEntity.builder().id(createRequest.userId()).build());
        budgetEntity.setBudgetAmount(createRequest.budgetAmount());
        budgetEntity.setBudgetDescription(createRequest.budgetDescription());
        budgetEntity.setBudgetName(createRequest.budgetName());
        budgetEntity.setCreatedDate(LocalDateTime.now());
        budgetEntity.setMonthlyIncome(createRequest.monthlyIncome());
        budgetEntity.setLastUpdatedDate(null);
        return budgetRepository.save(budgetEntity);
    }

    @Override
    public List<BudgetEntity> getBudgetByUserId(Long id) {
        return budgetRepository.findByUser(id);
    }

    @Override
    public BigDecimal calculateTotalSpent(Long budgetId) {
        return null;
    }

    @Override
    public BigDecimal calculateRemainingBudget(Long budgetId) {
        return null;
    }

    @Override
    public Optional<BudgetEntity> saveBudget(Budget budget)
    {
        if(budget == null)
        {
            return Optional.empty();
        }
        try
        {
            Optional<BudgetEntity> convertedBudget = createBudgetEntity(budget);
            if(convertedBudget.isEmpty())
            {
                return Optional.empty();
            }
            BudgetEntity convertedEntity = convertedBudget.get();
            BudgetEntity createdBudgetEntity = budgetRepository.save(convertedEntity);
            return Optional.of(createdBudgetEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the budget to the database: ", e);
            return Optional.empty();
        }
    }

    @Override
    public Optional<BudgetEntity> updateBudget(Long id, BudgetCreateRequest updateRequest) {
        return Optional.empty();
    }

}
