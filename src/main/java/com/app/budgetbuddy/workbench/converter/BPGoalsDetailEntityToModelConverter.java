package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.BPGoalsDetail;
import com.app.budgetbuddy.entities.BPGoalsDetailEntity;
import org.springframework.stereotype.Component;

@Component
public class BPGoalsDetailEntityToModelConverter implements Converter<BPGoalsDetailEntity, BPGoalsDetail>
{

    @Override
    public BPGoalsDetail convert(BPGoalsDetailEntity entity)
    {
        if (entity == null) return null;
        return BPGoalsDetail.builder()
                .id(entity.getId())
                .bp_template_id(entity.getBpTemplate() != null ? entity.getBpTemplate().getId() : null)
                .totalAllocatedAmount(entity.getTotalPlanned())
                .totalSpent(entity.getTotalSpent())
                .monthGoalAmount(entity.getGoalAmount())
                .savingsPercent(entity.getSavingsPercent())
                .overBudgetPercentage(entity.getSpentOverBudgetPercent())
                .build();
    }
}
