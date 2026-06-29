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
import java.util.ArrayList;
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
            log.warn("There was an error processing the manual envelope contribution: ", new EnvelopeException("ManualEntry is null"));
            return Optional.empty();
        }
        try
        {
            LocalDate today = LocalDate.now();
            Long envelopeId = manualEntry.envelopeId();
            BigDecimal entryAmount = manualEntry.amount();
            LocalDate entryDate = manualEntry.date();
            // Look up to see if entry date conflicts with an existing contribution date in the envelope contributions table
            // If no records exists for that date, then add the contribution to the database.
            Optional<EnvelopeContribution> envelopeContributionsEntityOptional = envelopeContributionsService.getEnvelopeContributionsByEnvelopeIdAndScheduledDate(envelopeId, entryDate);
            if(envelopeContributionsEntityOptional.isEmpty())
            {
                EnvelopeContribution envelopeContributions = envelopeContributionsService.createAndSaveEntry(entryAmount, entryDate, envelopeId);
                log.info("Created new envelope contribution: " + envelopeContributions);
                List<Contributions> contributions = envelopeContributions.getContributions();
                Contributions contributionsForDate = envelopeContributions.findContributionsForDate(entryDate);
                BigDecimal amount = BigDecimal.valueOf(contributionsForDate.getAmount());
                Envelope envelope = envelopeContributions.getEnvelope();
                if(entryDate.isAfter(today))
                {
                    envelopeContributionScheduler.scheduleEnvelopeContribution(envelopeId, entryDate, amount, envelope.getFrequency());
                }
                EnvelopeNotification envelopeNotification = envelopeNotificationService.createEnvelopeNotification(envelope, contributions).get();
                return Optional.of(new EnvelopeDetails(envelope, contributions, envelopeNotification, ""));
            }
            else
            {
                EnvelopeContribution envelopeContributions = envelopeContributionsEntityOptional.get();
                Envelope envelope = envelopeContributions.getEnvelope();
                List<Contributions> contributions = envelopeContributions.getContributions();
                Contributions contributionsForDate = envelopeContributions.findContributionsForDate(entryDate);
                double minAmount = contributionsForDate.getMinAmount();
                double maxAmount = contributionsForDate.getMaxAmount();
                if(entryAmount.doubleValue() < minAmount || entryAmount.doubleValue() > maxAmount)
                {
                    String errorMessage = entryAmount.doubleValue() < minAmount
                            ? String.format("Entry amount of $%.2f is less than the minimum contribution amount of $%.2f required for this envelope", entryAmount.doubleValue(), minAmount)
                            : String.format("Entry amount of $%.2f is greater than the maximum contribution amount of $%.2f required for this envelope", entryAmount.doubleValue(), maxAmount);
                    return Optional.of(new EnvelopeDetails(envelope, contributions, null, errorMessage));
                }
                else if(entryAmount.doubleValue() == minAmount)
                {
                    return Optional.of(new EnvelopeDetails(envelope, contributions, null,
                            String.format("A contribution of $%.2f is already scheduled for today. The system will process this contribution automatically.", entryAmount.doubleValue())));
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
            Long envelopeId = envelope.getId();
            LocalDate today = LocalDate.now();
            Optional<EnvelopeContribution> contributionsForTodayOptional = envelopeContributionsService.getEnvelopeContributionsByEnvelopeIdAndScheduledDate(envelopeId, LocalDate.now());
            if(contributionsForTodayOptional.isEmpty())
            {
                throw new EnvelopeException("No contributions found for today");
            }
            EnvelopeContribution envelopeContribution = contributionsForTodayOptional.get();
            Long contributionId = envelopeContribution.getId();
            List<Contributions> contributions = envelopeContribution.getContributions();
            Contributions contributionsForDate = envelopeContribution.findContributionsForDate(LocalDate.now());
            BigDecimal amount = BigDecimal.valueOf(contributionsForDate.getAmount());
            if(!envelopeContributionScheduler.isScheduled(envelopeId))
            {
                envelopeContributionScheduler.scheduleEnvelopeContribution(contributionId, today, amount, envelope.getFrequency());
            }
            EnvelopeNotification envelopeNotification = envelopeNotificationService.createEnvelopeNotification(envelope, contributions).get();
            envelopeContributionHistoryService.createAndSaveContribution(envelopeContribution, today);
            envelope.setEnvelopeStatus(EnvelopeStatus.PAID);
            BigDecimal envelopeTargetAmount = envelope.getTargetAmount();
            BigDecimal currentSaved = envelope.getCurrentSaved();
            if(currentSaved.compareTo(envelopeTargetAmount) > 0)
            {
                envelope.setEnvelopeStatus(EnvelopeStatus.COMPLETED);
            }
            return Optional.of(new EnvelopeDetails(envelope, contributions, envelopeNotification, ""));
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
            LinkEnvelopeDetails linkEnvelopeDetails = new LinkEnvelopeDetails();
            List<EnvelopeContribution> envelopeContributions = envelopeLink.getEnvelopes();
            if(envelopeContributions == null || envelopeContributions.isEmpty())
            {
                throw new EnvelopeException("No contributions found for today. No Envelope Contributions were created for this linked envelope.");
            }
            List<EnvelopeContribution> envelopeContributionsForToday = envelopeContributions.stream()
                    .filter(e -> e.getContributions().stream()
                            .anyMatch(a -> a.getScheduledDate().isEqual(today)))
                    .toList();
            List<Contributions> contributionsForToday = new ArrayList<>();
            if(!envelopeContributionsForToday.isEmpty())
            {
                List<EnvelopeNotification> envelopeNotifications = new ArrayList<>();
                envelopeContributionsForToday.forEach(envelopeContribution -> {
                    Long envelopeId = envelopeContribution.getEnvelope().getId();
                    Long envelopeContributionId = envelopeContribution.getId();
                    Contributions contributionsForDate = envelopeContribution.findContributionsForDate(today);
                    BigDecimal amount = BigDecimal.valueOf(contributionsForDate.getAmount());
                    boolean isScheduled = envelopeContributionScheduler.isScheduled(envelopeId);
                    if(!isScheduled)
                    {
                        envelopeContributionScheduler.scheduleEnvelopeContribution(envelopeContributionId, today, amount, envelopeContribution.getEnvelope().getFrequency());
                    }
                    EnvelopeNotification envelopeNotification = envelopeNotificationService.createEnvelopeNotification(envelopeContribution.getEnvelope(), envelopeContribution.getContributions()).get();
                    envelopeNotifications.add(envelopeNotification);
                    contributionsForToday.addAll(envelopeContribution.getContributions());
                    envelopeContributionHistoryService.createAndSaveContribution(envelopeContribution, today);
                });
                linkEnvelopeDetails = LinkEnvelopeDetails.builder()
                        .envelopeLink(envelopeLink)
                        .contributions(contributionsForToday)
                        .envelopeLinkNotification(envelopeNotifications)
                        .errorMessage("")
                        .build();
            }
            return Optional.of(linkEnvelopeDetails);
        }catch(EnvelopeException e){
            log.error("There was an error processing the auto linked envelope contribution: ", e);
            return Optional.empty();
        }
    }

    public Optional<LinkEnvelopeDetails> processManualLinkedEnvelope(final LinkedEnvelopeManualEntry linkedEnvelopeManualEntry)
    {
        return null;
    }
}
