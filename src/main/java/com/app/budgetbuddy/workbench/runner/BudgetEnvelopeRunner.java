package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.repositories.EnvelopeRepository;
import com.app.budgetbuddy.workbench.envelopes.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.couchbase.CouchbaseProperties;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;


/**
 * This class will handle all logic related to Budget Envelopes,
 and the envelope creation process or data relating to the budget envelopes to the front end as
 well as the running the contribution engine that will handle contributions to the budget envelopes.
 */
@Service
@Slf4j
public class BudgetEnvelopeRunner
{
    private final EnvelopeBuilderService envelopeBuilderService;
    private final LinkedEnvelopeBuilder linkedEnvelopeBuilderService;
    private final EnvelopeContributionEngine envelopeContributionEngine;
    private final EnvelopeEstimatorEngine envelopeEstimatorEngine;
    private final SubBudgetEntityRepository subBudgetEntityRepository;

    @Autowired
    public BudgetEnvelopeRunner(EnvelopeBuilderService envelopeBuilderService,
                                LinkedEnvelopeBuilder linkedEnvelopeBuilderService,
                                EnvelopeContributionEngine envelopeContributionEngine,
                                EnvelopeEstimatorEngine envelopeEstimatorEngine, SubBudgetEntityRepository subBudgetEntityRepository)
    {
        this.envelopeBuilderService = envelopeBuilderService;
        this.linkedEnvelopeBuilderService = linkedEnvelopeBuilderService;
        this.envelopeContributionEngine = envelopeContributionEngine;
        this.envelopeEstimatorEngine = envelopeEstimatorEngine;
        this.subBudgetEntityRepository = subBudgetEntityRepository;
    }

    public EnvelopeBuildDetails runEnvelopeCreation(final EnvelopeCreateRequest envelopeCreateRequest, final BudgetCriteria budgetCriteria, final List<SubBudget> subBudgets)
    {
        if(envelopeCreateRequest == null || budgetCriteria == null)
        {
            throw new IllegalArgumentException("EnvelopeCreateRequest and BudgetCriteria cannot be null");
        }
        try
        {
            EnvelopeBuildDetails envelopeBuildDetails = new EnvelopeBuildDetails();
            List<NewEnvelopeCriteria> newEnvelopeCriteria = envelopeCreateRequest.criteria();
            boolean isLinked = envelopeCreateRequest.isLinked();
            if(isLinked)
            {
                Optional<EnvelopeLink> envelopeLinkOptional = linkedEnvelopeBuilderService.build(newEnvelopeCriteria, budgetCriteria, subBudgets);
                envelopeLinkOptional.ifPresent(envelopeBuildDetails::setLinkedEnvelope);
            }
            else
            {
                // if isLinked is false, then there will be a single element in the list
                NewEnvelopeCriteria envelopeCriteria = newEnvelopeCriteria.get(0);
                Envelope envelopeDetails = envelopeBuilderService.createSingleEnvelope(envelopeCriteria, budgetCriteria, subBudgets);
                log.info("Created envelope: {}", envelopeDetails);
                envelopeBuildDetails.setEnvelope(envelopeDetails);
            }
            return envelopeBuildDetails;
        }catch(DataException e){
            log.error("There was an error running the envelope creation process: ", e);
            throw e;
        }
    }

    public Optional<LinkEnvelopeDetails> runLinkedEnvelopeContributions()
    {
        return Optional.empty();
    }

    public List<EnvelopeDetails> runEnvelopeContributions(final List<Envelope> envelopes, final BudgetCriteria budgetCriteria)
    {
        return List.of();
    }
}
