package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.EnvelopeNotification;
import com.app.budgetbuddy.domain.EnvelopeNotificationStatus;
import com.app.budgetbuddy.entities.EnvelopeNotificationsEntity;

import java.util.List;
import java.util.Optional;

public interface EnvelopeNotificationService extends ServiceModel<EnvelopeNotificationsEntity>
{
    Optional<EnvelopeNotification> createAndSave(EnvelopeNotification envelopeNotification);
    List<EnvelopeNotification> createAndSave(List<EnvelopeNotification> envelopeNotifications);

    List<EnvelopeNotification> getEnvelopeNotificationsByEnvelopeId(Long envelopeId);

    Optional<EnvelopeNotificationStatus> sendEnvelopeAcceptedNotification(Long notificationId);
    void updateNotificationReadStatus(boolean readStatus, Long notificationId);
}
