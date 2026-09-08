package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.workbench.EnvelopeNotificationAsyncService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Service
@Slf4j
public class EnvelopeNotificationRunner
{
    private final EnvelopeNotificationAsyncService envelopeNotificationAsyncService;

    @Autowired
    public EnvelopeNotificationRunner(EnvelopeNotificationAsyncService envelopeNotificationAsyncService)
    {
        this.envelopeNotificationAsyncService = envelopeNotificationAsyncService;
    }

    public Optional<EnvelopeNotificationStatus> sendEnvelopeNotificationAccept(Long notificationId)
    {
        try
        {
            EnvelopeNotificationStatus envelopeNotificationStatus = envelopeNotificationAsyncService.sendAsyncEnvelopeNotificationAccept(notificationId)
                    .get();
            return Optional.of(envelopeNotificationStatus);
        }catch(InterruptedException | ExecutionException ex){
            log.error("There was an error sending the envelope notification accept: ", ex);
            return Optional.empty();
        }
    }

    public List<EnvelopeNotification> createEnvelopeNotifications(Long envelopeId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            return envelopeNotificationAsyncService.createAsyncEnvelopeNotifications(envelopeId, startDate, endDate).get();
        }catch(Exception e){
            log.error("There was an error creating envelope notifications: ", e);
            return Collections.emptyList();
        }
    }

}
