package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.EnvelopeException;
import com.app.budgetbuddy.services.EnvelopeNotificationService;
import com.app.budgetbuddy.services.EnvelopeService;
import com.app.budgetbuddy.workbench.envelopes.EnvelopeContributionValidator;
import com.app.budgetbuddy.workbench.envelopes.EnvelopeNotificationBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Component
@Slf4j
public class EnvelopeNotificationAsyncService
{
    private EnvelopeNotificationBuilder envelopeNotificationBuilder;
    private EnvelopeNotificationService envelopeNotificationService;
    private EnvelopeContributionValidator envelopeContributionValidator;
    private EnvelopeService envelopeService;

    @Autowired
    public EnvelopeNotificationAsyncService(EnvelopeNotificationBuilder envelopeNotificationBuilder,
                                            EnvelopeNotificationService envelopeNotificationService,
                                            EnvelopeContributionValidator envelopeContributionValidator,
                                            EnvelopeService envelopeService)
    {
        this.envelopeNotificationBuilder = envelopeNotificationBuilder;
        this.envelopeNotificationService = envelopeNotificationService;
        this.envelopeContributionValidator = envelopeContributionValidator;
        this.envelopeService = envelopeService;
    }

    @Async("taskExecutor")
    public CompletableFuture<EnvelopeNotificationStatus> sendAsyncEnvelopeNotificationAccept(Long notificationId)
    {
        EnvelopeNotification envelopeNotification = envelopeNotificationService.findEnvelopeNotificationById(notificationId)
                .orElseThrow(() -> new EnvelopeException("Envelope notification with id: " + notificationId + " not found"));
        Long envelopeId = envelopeNotification.getEnvelopeId();
        Envelope envelope = envelopeService.findByEnvelopeId(envelopeId)
                .orElseThrow(() -> new EnvelopeException("Envelope with id: " + envelopeId + " not found"));
        LocalDate scheduledContributionDate = envelopeNotification.getDateToContribute();
        Contributions contributionsForNotification = envelope.getContributions().stream()
                .filter(e -> e.getContributionDate().equals(scheduledContributionDate))
                .findFirst()
                .get();
        ContributionValidationResult validationResult = envelopeContributionValidator.runValidationCheck(envelopeNotification, contributionsForNotification).get();
        if(checkIsValidated(validationResult))
        {
            EnvelopeNotificationStatus status = envelopeNotificationService.sendEnvelopeAcceptedNotification(notificationId).get();
            return CompletableFuture.completedFuture(status);
        }
        final String failedValidationMessage = "Envelope contribution: " + contributionsForNotification.toString() + " failed validation check for notification Id: " + notificationId;
        return CompletableFuture.completedFuture(EnvelopeNotificationStatus.builder()
                .isAccepted(true)
                .notificationId(notificationId)
                .status(failedValidationMessage)
                .build());

    }

    @Async("taskExecutor")
    public CompletableFuture<List<EnvelopeNotification>> createAsyncEnvelopeNotifications(final Long envelopeId, final LocalDate startDate, final LocalDate endDate)
    {
        Envelope envelope = envelopeService.findByEnvelopeId(envelopeId)
                .orElseThrow(() -> new EnvelopeException("Envelope with id: " + envelopeId + " not found"));
        List<EnvelopeNotification> envelopeNotifications = envelopeNotificationBuilder.createEnvelopeNotificationsForPeriod(envelope, startDate, endDate);
        if(envelopeNotifications.isEmpty())
        {
            return CompletableFuture.failedFuture(new EnvelopeException("No envelope notifications were created for the period"));
        }
        return CompletableFuture.completedFuture(envelopeNotifications);
    }

    private boolean checkIsValidated(ContributionValidationResult validationResult)
    {
        return validationResult.isValidated()
                && (!validationResult.matchedAccountId().isEmpty() || !validationResult.matchedTransactionId().isEmpty());
    }
}
