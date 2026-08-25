package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.Contributions;
import com.app.budgetbuddy.domain.Envelope;
import com.app.budgetbuddy.entities.EnvelopeContributionsEntity;
import com.app.budgetbuddy.entities.EnvelopeEntity;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

@Component
public class EnvelopeModelConverter implements Converter<EnvelopeEntity, Envelope>
{
    @Override
    public Envelope convert(EnvelopeEntity envelopeEntity)
    {
        return Envelope.builder()
                .id(envelopeEntity.getId())
//                .goal(envelopeEntity.getGoal())
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
                .contributions(convertContributions(envelopeEntity.getContributions()))
                .status(envelopeEntity.getStatus())
                .build();
    }

    private List<Contributions> convertContributions(List<EnvelopeContributionsEntity> entities)
    {
        if(entities == null)
        {
            return Collections.emptyList();
        }
        return entities.stream()
                .map(e -> Contributions.builder()
                        .id(e.getId())
                        .amount(e.getContributionAmount() != null ? e.getContributionAmount() : 0.0)
                        .contributionDate(e.getContributionDate())
                        .scheduledDate(e.getScheduledDate())
                        .status(e.getStatus())
                        .frequency(e.getFrequency())
                        .build())
                .toList();
    }
}
