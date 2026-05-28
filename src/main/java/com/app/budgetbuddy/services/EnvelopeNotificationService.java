package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.EnvelopeLinkNotification;
import com.app.budgetbuddy.domain.EnvelopeNotification;
import com.app.budgetbuddy.entities.EnvelopeNotificationsEntity;

import java.util.List;
import java.util.Optional;

public interface EnvelopeNotificationService extends ServiceModel<EnvelopeNotificationsEntity>
{
    Optional<EnvelopeNotification> createAndSave(EnvelopeNotification envelopeNotification);
    List<EnvelopeNotification> createAndSave(List<EnvelopeNotification> envelopeNotifications);
}
