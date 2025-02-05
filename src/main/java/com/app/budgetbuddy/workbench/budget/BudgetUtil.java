package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.BudgetSchedule;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.BudgetScheduleEntity;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.repositories.BudgetRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

import static com.app.budgetbuddy.workbench.budget.BudgetScheduleUtil.convertBudgetSchedulesToEntities;

@Slf4j
@Component
public class BudgetUtil
{
    private static BudgetRepository budgetRepository;

    @Autowired
    public BudgetUtil(BudgetRepository budgetRepository)
    {
        this.budgetRepository = budgetRepository;
    }

    public static BudgetEntity convertBudgetToEntity(Budget budget)
    {
        BudgetEntity budgetEntity = new BudgetEntity();
        budgetEntity.setId(budget.getId());
        budgetEntity.setActualAllocationAmount(budget.getSavingsAmountAllocated());
        budgetEntity.setBudgetActualAmount(budget.getBudgetAmount());
        budgetEntity.setBudgetAmount(budget.getBudgetAmount());
        budgetEntity.setBudgetDescription(budget.getBudgetDescription());
        budgetEntity.setBudgetName(budget.getBudgetName());
        budgetEntity.setBudgetStartDate(budget.getStartDate());
        budgetEntity.setBudgetEndDate(budget.getEndDate());
        budgetEntity.setBudgetMode(budget.getBudgetMode());
        budgetEntity.setSavingsProgress(budget.getSavingsProgress());
        budgetEntity.setMonthlyIncome(budget.getIncome());
        budgetEntity.setTotalMonthsToSave(budget.getTotalMonthsToSave());
        budgetEntity.setBudgetPeriod(budget.getBudgetPeriod());
        List<SubBudget> subBudgets = budget.getSubBudgets();
        budgetEntity.setSubBudgetEntities(convertSubBudgetsToEntities(subBudgets));
        return budgetEntity;
    }

    public static Set<SubBudgetEntity> convertSubBudgetsToEntities(final List<SubBudget> subBudgets)
    {
        Set<SubBudgetEntity> subBudgetEntities = new HashSet<>();
        for(SubBudget subBudget : subBudgets)
        {
            SubBudgetEntity subBudgetEntity = new SubBudgetEntity();
            subBudgetEntity.setId(subBudget.getId());
            subBudgetEntity.setActive(subBudget.isActive());
            subBudgetEntity.setAllocatedAmount(subBudget.getAllocatedAmount());

            Budget budget = subBudget.getBudget();
            Long budgetId = budget.getId();
            Optional<BudgetEntity> budgetEntityOptional = budgetRepository.findById(budgetId);
            if(budgetEntityOptional.isEmpty())
            {
                throw new RuntimeException("Could not find budget with id " + budgetId);
            }
            BudgetEntity budgetEntity = budgetEntityOptional.get();
            subBudgetEntity.setBudget(budgetEntity);
            subBudgetEntity.setEndDate(subBudget.getEndDate());
            subBudgetEntity.setSpentOnBudget(subBudget.getSpentOnBudget());
            subBudgetEntity.setStartDate(subBudget.getStartDate());
            subBudgetEntity.setSubBudgetName(subBudget.getSubBudgetName());
            subBudgetEntity.setSubSavingsAmount(subBudget.getSubSavingsAmount());
            subBudgetEntity.setSubSavingsTarget(subBudget.getSubSavingsTarget());
            subBudgetEntity.setId(subBudget.getId());
            List<BudgetSchedule> budgetSchedules = subBudget.getBudgetSchedule();
            subBudgetEntity.setBudgetSchedules(convertBudgetSchedulesToEntities(budgetSchedules));
            subBudgetEntities.add(subBudgetEntity);
        }
        return subBudgetEntities;
    }


    public static List<SubBudget> convertSubBudgetEntitiesToSubBudget(List<SubBudgetEntity> subBudgetEntities)
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

    public static BudgetSchedule convertBudgetScheduleEntity(BudgetScheduleEntity budgetScheduleEntity)
    {
        SubBudgetEntity subBudgetEntity = budgetScheduleEntity.getSubBudget();
        return BudgetSchedule.builder()
                .subBudgetId(subBudgetEntity.getId())
                .endDate(budgetScheduleEntity.getEndDate())
                .startDate(budgetScheduleEntity.getStartDate())
                .scheduleRange(new DateRange(budgetScheduleEntity.getStartDate(), budgetScheduleEntity.getEndDate()))
                .period(budgetScheduleEntity.getPeriodType())
                .status(budgetScheduleEntity.getStatus().name())
                .totalPeriods(budgetScheduleEntity.getTotalPeriodsInRange())
                .createdDate(LocalDateTime.now())
                .build();
    }

    public static List<BudgetSchedule> convertBudgetScheduleSet(Set<BudgetScheduleEntity> budgetScheduleEntities)
    {
        List<BudgetSchedule> budgetSchedules = new ArrayList<>();
        for(BudgetScheduleEntity budgetScheduleEntity : budgetScheduleEntities)
        {
            BudgetSchedule budgetSchedule = convertBudgetScheduleEntity(budgetScheduleEntity);
            budgetSchedules.add(budgetSchedule);
        }
        return budgetSchedules;
    }

    public static Budget convertBudgetEntity(BudgetEntity budgetEntity)
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
