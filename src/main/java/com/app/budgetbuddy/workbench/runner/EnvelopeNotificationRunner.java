package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.EnvelopeNotification;
import com.app.budgetbuddy.domain.EnvelopeNotificationStatus;
import com.app.budgetbuddy.services.EnvelopeNotificationService;
import com.app.budgetbuddy.services.EnvelopeService;
import com.app.budgetbuddy.workbench.envelopes.EnvelopeNotificationBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
public class EnvelopeNotificationRunner
{
    private final EnvelopeNotificationBuilder envelopeNotificationBuilder;
    private final EnvelopeNotificationService envelopeNotificationService;
    private final EnvelopeService envelopeService;

    @Autowired
    public EnvelopeNotificationRunner(EnvelopeNotificationBuilder envelopeNotificationBuilder,
                                      EnvelopeNotificationService envelopeNotificationService,
                                      EnvelopeService envelopeService)
    {
        this.envelopeNotificationBuilder = envelopeNotificationBuilder;
        this.envelopeNotificationService = envelopeNotificationService;
        this.envelopeService = envelopeService;
    }

    public EnvelopeNotificationStatus sendEnvelopeNotificationAccept(Long notificationId)
    {
        return null;
    }

    public List<EnvelopeNotification> createEnvelopeNotifications(Long envelopeId)
    {
        return null;
    }

    public void updateEnvelopeNotificationReadStatus(boolean readStatus, Long notificationId)
    {

    }

    public void getEnvelopeNotifications(Long envelopeId)
    {

    }
}
