package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.Envelope;
import com.app.budgetbuddy.services.EnvelopeContributionsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Service
public class SingleEnvelopeContributionEngine
{
    private final EnvelopeContributionsService envelopeContributionsService;

    @Autowired
    public SingleEnvelopeContributionEngine(EnvelopeContributionsService envelopeContributionsService)
    {
        this.envelopeContributionsService = envelopeContributionsService;
    }

    public Optional<Envelope> contributeManual(Envelope envelope, BigDecimal amount, LocalDate scheduledDate)
    {
        return Optional.empty();
    }

    public Optional<Envelope> contributeAuto(Envelope envelope)
    {
        return null;
    }
}
