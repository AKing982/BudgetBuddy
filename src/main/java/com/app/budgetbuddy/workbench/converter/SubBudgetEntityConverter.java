package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.repositories.BudgetRepository;
import com.app.budgetbuddy.repositories.BudgetScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
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
        return null;
    }


}
