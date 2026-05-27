package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.EnvelopeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class EnvelopeBuilderImpl implements EnvelopeBuilder<NewEnvelopeCriteria, Envelope>
{
    private final EnvelopeBuilderService envelopeBuilderService;

    @Autowired
    public EnvelopeBuilderImpl(EnvelopeBuilderService envelopeBuilderService)
    {
        this.envelopeBuilderService = envelopeBuilderService;
    }

    @Override
    public Optional<Envelope> build(NewEnvelopeCriteria newEnvelopeCriteria, BudgetCriteria budgetCriteria)
    {
        // Step 1: Calculate the feasibility score

        // Step 2: Determine what the contribution amounts should be for the envelopes

        // Step 3: What are the scheduled contribution dates?

        // Step 4: Create the envelope

        // Step 5: Save the envelope
        return null;
    }
}
