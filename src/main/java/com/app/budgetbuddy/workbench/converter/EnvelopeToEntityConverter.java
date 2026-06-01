package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.Envelope;
import com.app.budgetbuddy.entities.EnvelopeEntity;
import org.springframework.stereotype.Component;

@Component
public class EnvelopeToEntityConverter implements Converter<Envelope, EnvelopeEntity>
{
    @Override
    public EnvelopeEntity convert(Envelope envelope)
    {
        if(envelope == null)
        {
            return null;
        }
        EnvelopeEntity entity = new EnvelopeEntity();
        entity.setId(envelope.getId());
        entity.setName(envelope.getEnvelopeName());
        entity.setGoal(envelope.getGoal());
        entity.setType(envelope.getEnvelopeType());
        entity.setDuration(envelope.getDuration());
        entity.setTargetDate(envelope.getTargetDate());
        entity.setStartDate(envelope.getStartDate());
        entity.setBudgeted(envelope.getBudgeted().doubleValue());
        entity.setCurrentlySaved(envelope.getCurrentSaved().doubleValue());
        entity.setTargetAmount(envelope.getTargetAmount().doubleValue());
        entity.setFrequencyAmount(envelope.getFrequency());
//        entity.setContributionMode(envelope.getContributionMode());
        entity.setActive(envelope.isActive());
        entity.setStatus(envelope.getStatus());
        entity.setPriority(envelope.getPriority());
        return entity;
    }
}
