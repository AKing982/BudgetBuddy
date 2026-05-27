package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.Envelope;
import com.app.budgetbuddy.entities.EnvelopeEntity;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class EnvelopeModelConverter implements Converter<EnvelopeEntity, Envelope>
{
    @Override
    public Envelope convert(EnvelopeEntity envelopeEntity)
    {
        return Envelope.builder()
                .id(envelopeEntity.getId())
                .goal(envelopeEntity.getGoal())
                .currentSaved(BigDecimal.valueOf(envelopeEntity.getCurrentlySaved()))
                .budgeted(BigDecimal.valueOf(envelopeEntity.getBudgeted()))
                .duration(envelopeEntity.getDuration())
                .envelopeName(envelopeEntity.getName())
                .envelopeType(envelopeEntity.getType())
                .isActive(envelopeEntity.isActive())
                .startDate(envelopeEntity.getStartDate())
                .targetAmount(BigDecimal.valueOf(envelopeEntity.getTargetAmount()))
                .targetDate(envelopeEntity.getTargetDate())
                .userId(envelopeEntity.getUser().getId())
                .status(envelopeEntity.getStatus())
                .build();
    }
}
