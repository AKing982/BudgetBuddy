package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.Envelope;
import com.app.budgetbuddy.domain.EnvelopeLink;
import com.app.budgetbuddy.workbench.envelopes.EnvelopeOptimizationEngine;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * This class will handle logic relating to optimizing and dynamically updating
 * envelopes (linked or single) based on changing factors such as how much the user has left on their monthly budget,
 * current spending, future spending patterns, etc and make the necessary changes to the envelope.
 */
@Component
public class EnvelopeOptimizerRunner
{
    private EnvelopeOptimizationEngine envelopeOptimizationEngine;

    @Autowired
    public EnvelopeOptimizerRunner(EnvelopeOptimizationEngine envelopeOptimizationEngine)
    {
        this.envelopeOptimizationEngine = envelopeOptimizationEngine;
    }

    public void optimizeLinkedEnvelopes(EnvelopeLink envelopeLink)
    {

    }

    public void optimizeEnvelope(Envelope envelope)
    {

    }
}
