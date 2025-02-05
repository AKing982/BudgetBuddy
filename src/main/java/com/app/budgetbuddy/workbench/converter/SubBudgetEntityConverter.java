package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.BudgetSchedule;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.BudgetScheduleEntity;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.repositories.BudgetRepository;
import com.app.budgetbuddy.repositories.BudgetScheduleRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import static com.app.budgetbuddy.workbench.budget.BudgetScheduleUtil.convertBudgetScheduleEntities;

@Service
@Slf4j
public class SubBudgetEntityConverter implements Converter<SubBudgetEntity, SubBudget>
{
    private final BudgetRepository budgetRepository;
    private final BudgetScheduleRepository budgetScheduleRepository;

    @Autowired
    public SubBudgetEntityConverter(BudgetRepository budgetRepository, BudgetScheduleRepository budgetScheduleRepository)
    {
        this.budgetRepository = budgetRepository;
        this.budgetScheduleRepository = budgetScheduleRepository;
    }

    @Override
    public SubBudget convert(SubBudgetEntity subBudgetEntity)
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
        BudgetEntity budgetEntity = subBudgetEntity.getBudget();
        subBudget.setBudget(convertBudget(budgetEntity));
        Set<BudgetScheduleEntity> budgetScheduleEntities = subBudgetEntity.getBudgetSchedules();
        subBudget.setBudgetSchedule(convertBudgetScheduleEntities(budgetScheduleEntities));
        return subBudget;
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



}
