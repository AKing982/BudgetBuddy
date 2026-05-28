package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.EnvelopeContributionsEntity;
import com.app.budgetbuddy.exceptions.EnvelopeException;
import com.app.budgetbuddy.services.EnvelopeContributionHistoryService;
import com.app.budgetbuddy.services.EnvelopeContributionsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;


/**
 * This class will handle all logic related to Envelope Contributions,
 * Either manually or automatically.
 * For manual contributions, it will handle the logic created/stored by the user on
 * what they want to contribute to the envelope by date.
 * For automatic contributions, will handle the logic done by the system by
 * grabbing all single or linked envelopes and processing those envelopes with the contribution logic.
 *
 */

@Service
@Slf4j
public class EnvelopeContributionEngine
{
    private final EnvelopeContributionHistoryService envelopeContributionHistoryService;
    private final EnvelopeNotificationBuilder envelopeNotificationService;
    private final EnvelopeContributionScheduler envelopeContributionScheduler;
    private final EnvelopeContributionsService envelopeContributionsService;

    @Autowired
    public EnvelopeContributionEngine(EnvelopeContributionHistoryService envelopeContributionHistoryService,
                                      EnvelopeContributionScheduler envelopeContributionScheduler,
                                      EnvelopeNotificationBuilder envelopeNotificationService,
                                      EnvelopeContributionsService envelopeContributionsService)
    {
        this.envelopeContributionHistoryService = envelopeContributionHistoryService;
        this.envelopeNotificationService = envelopeNotificationService;
        this.envelopeContributionScheduler = envelopeContributionScheduler;
        this.envelopeContributionsService = envelopeContributionsService;
    }

    public Optional<EnvelopeDetails> processManualSingleEnvelope(final EnvelopeManualEntry manualEntry)
    {
        if(manualEntry == null)
        {
            return Optional.empty();
        }
        try
        {
            Long envelopeId = manualEntry.envelopeId();
            BigDecimal entryAmount = manualEntry.amount();
            LocalDate entryDate = manualEntry.date();
            // Look up to see if entry date conflicts with an existing contribution date in the envelope contributions table
            // If no records exists for that date, then add the contribution to the database.
            Optional<EnvelopeContribution> envelopeContributionsEntityOptional = envelopeContributionsService.getEnvelopeContributionsByEnvelopeIdAndScheduledDate(envelopeId, entryDate);
            if(envelopeContributionsEntityOptional.isEmpty())
            {
                EnvelopeContribution envelopeContributions = envelopeContributionsService.createAndSaveEntry(entryAmount, entryDate, envelopeId).get();
                List<Contributions> contributions = envelopeContributions.getContributions();
                Envelope envelope = envelopeContributions.getEnvelope();
                EnvelopeNotification envelopeNotification = envelopeNotificationService.createEnvelopeNotification(envelope, contributions).get();
                return Optional.of(new EnvelopeDetails(envelope, contributions, envelopeNotification));
            }
            else
            {
                EnvelopeContribution envelopeContributions = envelopeContributionsEntityOptional.get();
                Long contributionId = envelopeContributions.getId();

                // Update the existing record amount and date
                Optional<EnvelopeContribution> updatedContributionOptional = envelopeContributionsService.updateAmountAndDate(contributionId, entryAmount, entryDate);
                if(updatedContributionOptional.isPresent())
                {
                    EnvelopeContribution updatedContribution = updatedContributionOptional.get();
                    List<Contributions> contributions = updatedContribution.getContributions();
                    Envelope envelope = updatedContribution.getEnvelope();
                    EnvelopeNotification envelopeNotification = envelopeNotificationService.createEnvelopeNotification(envelope, contributions).get();
                    return Optional.of(new EnvelopeDetails(envelope, contributions, envelopeNotification));
                }
            }
            // If a record is found that conflicts with the entry date, then override the existing entry with the user defined details
        }catch(EnvelopeException e){
            log.error("There was an error processing the manual envelope contribution: ", e);
            return Optional.empty();
        }
        return Optional.empty();
    }

    public Optional<EnvelopeDetails> processAutoSingleEnvelope(final Envelope envelope)
    {
        if(envelope == null)
        {
            log.warn("There was an error processing the auto envelope contribution: ", new EnvelopeException("Envelope is null"));
            return Optional.empty();
        }
        try
        {
            LocalDate today = LocalDate.now();
            Long envelopeId = envelope.getId();
            String frequency = envelope.getFrequency();
            EnvelopeDetails envelopeDetails = new EnvelopeDetails();
            // Is there an existing contribution for today?
            Optional<EnvelopeContribution> envelopeContributionOptional = envelopeContributionsService.getEnvelopeContributionsByEnvelopeIdAndScheduledDate(envelopeId, today);
            if(envelopeContributionOptional.isPresent())
            {
                // Get the existing contribution
                EnvelopeContribution envelopeContribution = envelopeContributionOptional.get();
                Long envelopeContributionId = envelopeContribution.getId();
                // Schedule the contribution for today
                envelopeContributionScheduler.scheduleEnvelopeContribution(envelopeContributionId, today, frequency);

                // Create the notification for the envelope
                EnvelopeNotification envelopeNotification = envelopeNotificationService.createEnvelopeNotification(envelope, envelopeContribution.getContributions()).get();

                // Create a EnvelopeContributionHistory record for the contribution
                envelopeContributionHistoryService.createAndSaveContribution(envelopeContribution, today);

                // Update the envelope status from Pending to Paid
                envelope.setEnvelopeStatus(EnvelopeStatus.PAID);
                BigDecimal envelopeTargetAmount = envelope.getTargetAmount();
                BigDecimal currentSaved = envelope.getCurrentSaved();
                if(currentSaved.compareTo(envelopeTargetAmount) > 0)
                {
                    envelope.setEnvelopeStatus(EnvelopeStatus.COMPLETED);
                }
                // Create the Envelope Details object
                envelopeDetails = new EnvelopeDetails(envelope, envelopeContribution.getContributions(), envelopeNotification);
            }
            return Optional.of(envelopeDetails);
        }catch(EnvelopeException e){
            log.error("There was an error processing the auto envelope contribution: ", e);
            return Optional.empty();
        }
    }

    public Optional<LinkEnvelopeDetails> processAutoLinkedEnvelope(final EnvelopeLink envelopeLink)
    {
        if(envelopeLink == null)
        {
            log.warn("There was an error processing the auto linked envelope contribution: ", new EnvelopeException("EnvelopeLink is null"));
            return Optional.empty();
        }
        try
        {
            LocalDate today = LocalDate.now();
            List<EnvelopeContribution> envelopeContributions = envelopeLink.getEnvelopes();
            List<EnvelopeContribution> envelopeContributionsToday = envelopeContributions.stream()
                    .filter(e -> e.getContributions().stream()
                            .filter(a -> a.getScheduledDate().isEqual(today)).isParallel())
                    .toList();
            if(!envelopeContributionsToday.isEmpty())
            {
                envelopeContributionsToday.forEach(envelopeContribution -> {
                    Long envelopeId = envelopeContribution.getEnvelope().getId();
                    envelopeContributionScheduler.unscheduleEnvelopeContribution(envelopeId);
                });
            }

        }catch(EnvelopeException e){
            log.error("There was an error processing the auto linked envelope contribution: ", e);
            return Optional.empty();
        }
        return null;
    }

    public Optional<LinkEnvelopeDetails> processManualLinkedEnvelope(final LinkedEnvelopeManualEntry linkedEnvelopeManualEntry)
    {
        return null;
    }
}
