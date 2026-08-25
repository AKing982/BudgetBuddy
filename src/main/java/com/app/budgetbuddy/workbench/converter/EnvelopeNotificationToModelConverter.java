package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.EnvelopeNotification;
import com.app.budgetbuddy.entities.EnvelopeNotificationsEntity;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class EnvelopeNotificationToModelConverter implements Converter<EnvelopeNotificationsEntity, EnvelopeNotification>
{

    @Override
    public EnvelopeNotification convert(EnvelopeNotificationsEntity entity)
    {
        if(entity == null)
        {
            throw new IllegalArgumentException("EnvelopeNotification cannot be null");
        }
        EnvelopeNotification notification = new EnvelopeNotification();
        notification.setTitle(entity.getTitle());
        notification.setMessage(entity.getMessage());
        notification.setEnvelopeStatus(entity.getStatus());
        notification.setRead(entity.isRead());
        notification.setAmount(BigDecimal.valueOf(entity.getAmount()));
        notification.setDateToContribute(entity.getContributionDate());
        notification.setId(entity.getId());
        if(entity.getEnvelope() != null)
        {
            notification.setEnvelopeId(entity.getEnvelope().getId());
            notification.setEnvelopeName(entity.getEnvelope().getName());
        }
        return notification;
    }
}
