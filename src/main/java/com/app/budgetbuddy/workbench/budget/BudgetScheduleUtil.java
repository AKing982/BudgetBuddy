package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetScheduleEntity;
import com.app.budgetbuddy.entities.BudgetScheduleRangeEntity;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.repositories.BudgetScheduleRepository;
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
    private static BudgetScheduleRepository budgetScheduleRepository;

    @Autowired
    public BudgetScheduleUtil(SubBudgetRepository subBudgetRepository,
                              BudgetScheduleRepository budgetScheduleRepository)
    {
        BudgetScheduleUtil.subBudgetRepository = subBudgetRepository;
        BudgetScheduleUtil.budgetScheduleRepository = budgetScheduleRepository;
    }


    public static List<BudgetScheduleRange> convertBudgetScheduleRangeEntities(Set<BudgetScheduleRangeEntity> budgetScheduleRangeEntities)
    {
        if(budgetScheduleRangeEntities == null)
        {
            return new ArrayList<>();
        }
        Set<BudgetScheduleRange> budgetScheduleRanges = new HashSet<>();
        for(BudgetScheduleRangeEntity budgetScheduleRangeEntity : budgetScheduleRangeEntities)
        {
            BudgetScheduleRange budgetScheduleRange = new BudgetScheduleRange();
            budgetScheduleRange.setBudgetDateRange(new DateRange(budgetScheduleRangeEntity.getRangeStart(), budgetScheduleRangeEntity.getRangeEnd()));
            budgetScheduleRange.setBudgetedAmount(budgetScheduleRangeEntity.getBudgetedAmount());
            budgetScheduleRange.setBudgetScheduleId(budgetScheduleRangeEntity.getId());
            budgetScheduleRange.setStartRange(budgetScheduleRangeEntity.getRangeStart());
            budgetScheduleRange.setEndRange(budgetScheduleRangeEntity.getRangeEnd());
            budgetScheduleRange.setRangeType(budgetScheduleRangeEntity.getRangeType());
            budgetScheduleRange.setSpentOnRange(budgetScheduleRangeEntity.getSpentOnRange());
            budgetScheduleRanges.add(budgetScheduleRange);
        }
        return new ArrayList<>(budgetScheduleRanges);
    }

    public static Set<BudgetScheduleEntity> convertBudgetSchedulesToEntities(final List<BudgetSchedule> budgetSchedules)
    {
        List<BudgetScheduleEntity> budgetScheduleEntitiesList = new ArrayList<>();
        Set<BudgetScheduleEntity> budgetScheduleEntities = new HashSet<>();
        try
        {
            for(BudgetSchedule budgetSchedule : budgetSchedules)
            {
                BudgetScheduleEntity budgetScheduleEntity = new BudgetScheduleEntity();
                budgetScheduleEntity.setEndDate(budgetSchedule.getEndDate());
                budgetScheduleEntity.setStartDate(budgetSchedule.getStartDate());
                budgetScheduleEntity.setId(budgetSchedule.getBudgetScheduleId());
                budgetScheduleEntity.setPeriodType(budgetSchedule.getPeriodType());
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
            return Collections.emptySet();
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
                Set<BudgetScheduleEntity> budgetScheduleEntities = subBudgetEntity.getBudgetSchedules();
                Set<BudgetScheduleRangeEntity> budgetScheduleRangeEntities = budgetSchedule.getDateRanges();
                log.info("Retrieving Budget Schedule Ranges: {}, size: {}", budgetScheduleRangeEntities, budgetScheduleRangeEntities.size());
                BudgetSchedule budgetSchedule1 = BudgetSchedule.builder()
                        .subBudgetId(subBudgetEntity.getId())
                        .endDate(budgetSchedule.getEndDate())
                        .startDate(budgetSchedule.getStartDate())
                        .periodType(budgetSchedule.getPeriodType())
                        .budgetScheduleRanges(convertBudgetScheduleRangeEntities(budgetScheduleRangeEntities))
                        .budgetScheduleId(budgetSchedule.getId())
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
