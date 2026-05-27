package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.EnvelopeException;
import com.app.budgetbuddy.services.EnvelopeContributionHistoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
    private final EnvelopeContributionHistoryService envelopeContributionService;
    private final SingleEnvelopeContributionEngine singleEnvelopeContributionService;
    private final LinkedEnvelopeContributionEngine linkedEnvelopeContributionService;
    private final EnvelopeNotificationService envelopeNotificationService;

    @Autowired
    public EnvelopeContributionEngine(EnvelopeContributionHistoryService envelopeContributionService,
                                      SingleEnvelopeContributionEngine singleEnvelopeContributionService,
                                      LinkedEnvelopeContributionEngine linkedEnvelopeContributionService,
                                      EnvelopeNotificationService envelopeNotificationService)
    {
        this.envelopeContributionService = envelopeContributionService;
        this.singleEnvelopeContributionService = singleEnvelopeContributionService;
        this.linkedEnvelopeContributionService = linkedEnvelopeContributionService;
        this.envelopeNotificationService = envelopeNotificationService;
    }

    public List<EnvelopeNotification> sendNotifications(final List<EnvelopeContribution> contributions)
    {
        return null;
    }

    public Optional<Envelope> processSingleEnvelope(final Envelope envelope)
    {
        if(envelope == null)
        {
            throw new EnvelopeException("Envelope found null.... Unable to process contributions.");
        }
        try
        {

        }catch(EnvelopeException e)
        {
            log.error("There was an error processing the envelope: ", e);
            return Optional.empty();
        }
        return null;
    }

    public Optional<EnvelopeLink> processLinkedEnvelope(final EnvelopeLink envelopeLink)
    {
        return null;
    }

}
