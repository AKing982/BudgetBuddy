package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.EnvelopeLink;
import com.app.budgetbuddy.services.LinkedEnvelopesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Service
public class LinkedEnvelopeContributionEngine
{
    private final LinkedEnvelopesService linkedEnvelopesService;

    @Autowired
    public LinkedEnvelopeContributionEngine(LinkedEnvelopesService linkedEnvelopesService)
    {
        this.linkedEnvelopesService = linkedEnvelopesService;
    }

    /**
     * Contributes to linked envelopes manually.
     * Contributes manually by taking the linked envelopes, the amount specified by the user, and date specified by the user.
     * If the date specified is the current date, then the contribution will be made immediately.
     * If the date specified in the future, then the contribution will be scheduled to occur on that date.
     * @param linkedEnvelopes
     * @param date
     * @return
     */
    public Optional<EnvelopeLink> contributeManual(final EnvelopeLink linkedEnvelopes, final BigDecimal amount, final LocalDate date)
    {
        return null;
    }

    /**
     * Contributes to linked envelopes automatically.
     * Automatically contributes to linked envelopes by taking the linked envelopes
     * @param envelopeLink
     * @return
     */
    public Optional<EnvelopeLink> contributeAuto(final EnvelopeLink envelopeLink)
    {
        return null;
    }
}
