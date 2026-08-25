package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.Envelope;
import com.app.budgetbuddy.domain.EnvelopeNotification;
import com.app.budgetbuddy.domain.EnvelopeStatus;
import com.app.budgetbuddy.entities.EnvelopeEntity;
import com.app.budgetbuddy.entities.EnvelopeNotificationsEntity;
import com.app.budgetbuddy.repositories.EnvelopeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class EnvelopeNotificationToEntityConverter implements Converter<EnvelopeNotification, EnvelopeNotificationsEntity>
{
    private final EnvelopeRepository envelopeRepository;

    @Autowired
    public EnvelopeNotificationToEntityConverter(EnvelopeRepository envelopeRepository)
    {
        this.envelopeRepository = envelopeRepository;
    }

    @Override
    public EnvelopeNotificationsEntity convert(EnvelopeNotification envelopeNotification)
    {
        if(envelopeNotification == null)
        {
            throw new IllegalArgumentException("EnvelopeNotification cannot be null");
        }
        EnvelopeNotificationsEntity entity = new EnvelopeNotificationsEntity();
        entity.setTitle(envelopeNotification.getTitle());
        entity.setMessage(envelopeNotification.getMessage());
        entity.setStatus(envelopeNotification.getEnvelopeStatus());
        entity.setRead(envelopeNotification.isRead());
        entity.setAmount(envelopeNotification.getAmount().doubleValue());
        entity.setContributionDate(envelopeNotification.getDateToContribute());
        EnvelopeEntity envelope = envelopeRepository.findById(envelopeNotification.getEnvelopeId()).orElse(null);
        entity.setEnvelope(envelope);
        EnvelopeStatus status = envelopeNotification.getEnvelopeStatus() != null ? envelopeNotification.getEnvelopeStatus(): EnvelopeStatus.ACTIVE;
        entity.setStatus(status);
        envelopeRepository.findById(envelopeNotification.getEnvelopeId())
                .ifPresent(entity::setEnvelope);

        return entity;
    }
}
