package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.Envelope;
import com.app.budgetbuddy.domain.EnvelopeEstimate;
import com.app.budgetbuddy.domain.EnvelopeEstimateCriteria;
import com.app.budgetbuddy.domain.NewEnvelopeCriteria;
import com.app.budgetbuddy.workbench.envelopes.EnvelopeBuilderService;
import com.app.budgetbuddy.workbench.envelopes.EnvelopeContributionEngine;
import com.app.budgetbuddy.workbench.envelopes.EnvelopeEstimatorEngine;
import com.app.budgetbuddy.workbench.envelopes.LinkedEnvelopeBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;


/**
 * This class will handle all logic related to Budget Envelopes,
 and the envelope creation process or data relating to the budget envelopes to the front end as
 well as the running the contribution engine that will handle contributions to the budget envelopes.
 */
@Service
public class BudgetEnvelopeRunner
{
    private final EnvelopeBuilderService envelopeBuilderService;
    private final LinkedEnvelopeBuilder linkedEnvelopeBuilderService;
    private final EnvelopeContributionEngine envelopeContributionEngine;
    private final EnvelopeEstimatorEngine envelopeEstimatorEngine;

    @Autowired
    public BudgetEnvelopeRunner(EnvelopeBuilderService envelopeBuilderService,
                                LinkedEnvelopeBuilder linkedEnvelopeBuilderService,
                                EnvelopeContributionEngine envelopeContributionEngine,
                                EnvelopeEstimatorEngine envelopeEstimatorEngine)
    {
        this.envelopeBuilderService = envelopeBuilderService;
        this.linkedEnvelopeBuilderService = linkedEnvelopeBuilderService;
        this.envelopeContributionEngine = envelopeContributionEngine;
        this.envelopeEstimatorEngine = envelopeEstimatorEngine;
    }

    public List<Envelope> createNewEnvelopes(Long userId, List<NewEnvelopeCriteria> envelopeCriteria)
    {
        return List.of();
    }

    public Optional<EnvelopeEstimate> runEnvelopeAffordabilityEstimator(EnvelopeEstimateCriteria envelopeEstimateCriteria)
    {
        return Optional.empty();
    }

    public List<EnvelopeEstimate> runMultiEnvelopeAffordabilityEstimator(List<EnvelopeEstimateCriteria> envelopeEstimateCriteria)
    {
        return List.of();
    }
}
