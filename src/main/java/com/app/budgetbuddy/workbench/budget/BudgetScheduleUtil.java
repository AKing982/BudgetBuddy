package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetSchedule;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.domain.ScheduleStatus;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.entities.BudgetScheduleEntity;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.repositories.SubBudgetRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

@Slf4j
@Component
public class BudgetScheduleUtil
{
    private static SubBudgetRepository subBudgetRepository;

    @Autowired
    public BudgetScheduleUtil(SubBudgetRepository subBudgetRepository)
    {
        BudgetScheduleUtil.subBudgetRepository = subBudgetRepository;
    }

    public static Set<BudgetScheduleEntity> convertBudgetSchedulesToEntities(final List<BudgetSchedule> budgetSchedules)
    {
        Set<BudgetScheduleEntity> budgetScheduleEntities = new HashSet<>();
        try
        {
            for(BudgetSchedule budgetSchedule : budgetSchedules)
            {
                BudgetScheduleEntity budgetScheduleEntity = new BudgetScheduleEntity();
                budgetScheduleEntity.setEndDate(budgetSchedule.getEndDate());
                budgetScheduleEntity.setStartDate(budgetSchedule.getStartDate());
                budgetScheduleEntity.setId(budgetSchedule.getBudgetScheduleId());
                budgetScheduleEntity.setPeriodType(budgetSchedule.getPeriod());
                budgetScheduleEntity.setStatus(ScheduleStatus.valueOf(budgetSchedule.getStatus()));
                budgetScheduleEntity.setScheduleRange(budgetSchedule.getScheduleRange().toString());
                Long subBudgetId = budgetSchedule.getSubBudgetId();
                Optional<SubBudgetEntity> subBudgetEntityOptional = subBudgetRepository.findById(subBudgetId);
                if(subBudgetEntityOptional.isEmpty())
                {
                    throw new RuntimeException("Sub budget with id " + subBudgetId + " not found");
                }
                SubBudgetEntity subBudgetEntity = subBudgetEntityOptional.get();
                budgetScheduleEntity.setSubBudget(subBudgetEntity);
                budgetScheduleEntities.add(budgetScheduleEntity);
            }
            return budgetScheduleEntities;
        }catch(Exception e)
        {
            log.error("There was an error converting the budget schedules: ", e);
            return budgetScheduleEntities;
        }
    }

    public static List<BudgetSchedule> convertBudgetScheduleEntities(Set<BudgetScheduleEntity> budgetScheduleEntitySet)
    {
        List<BudgetSchedule> budgetSchedules = new ArrayList<>();
        try
        {
            for(BudgetScheduleEntity budgetSchedule : budgetScheduleEntitySet)
            {
                SubBudgetEntity subBudgetEntity = budgetSchedule.getSubBudget();
                BudgetSchedule budgetSchedule1 = BudgetSchedule.builder()
                        .subBudgetId(subBudgetEntity.getId())
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
}
