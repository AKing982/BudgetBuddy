package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.LinkedEnvelopesEntity;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.exceptions.EnvelopeException;
import com.app.budgetbuddy.repositories.EnvelopeRepository;
import com.app.budgetbuddy.services.EnvelopeService;
import com.app.budgetbuddy.services.LinkedEnvelopesService;
import com.app.budgetbuddy.workbench.envelopes.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.couchbase.CouchbaseProperties;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;


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
    private final LinkedEnvelopesService linkedEnvelopesService;
    private final EnvelopeContributionEngine envelopeContributionEngine;
    private final EnvelopeEstimatorEngine envelopeEstimatorEngine;

    @Autowired
    public BudgetEnvelopeRunner(EnvelopeBuilderService envelopeBuilderService,
                                LinkedEnvelopeBuilder linkedEnvelopeBuilderService,
                                LinkedEnvelopesService linkedEnvelopesService,
                                EnvelopeContributionEngine envelopeContributionEngine,
                                EnvelopeEstimatorEngine envelopeEstimatorEngine)
    {
        this.envelopeBuilderService = envelopeBuilderService;
        this.linkedEnvelopeBuilderService = linkedEnvelopeBuilderService;
        this.linkedEnvelopesService = linkedEnvelopesService;
        this.envelopeContributionEngine = envelopeContributionEngine;
        this.envelopeEstimatorEngine = envelopeEstimatorEngine;
    }

    public Optional<EnvelopeBuildDetails> runLinkedEnvelopeUpdate(final List<Envelope> envelopes, final Long linkedEnvelopeId, final EnvelopeUpdateMode updateMode)
    {
        if(envelopes == null || linkedEnvelopeId == null)
        {
            return Optional.empty();
        }
        EnvelopeBuildDetails envelopeBuildDetails = new EnvelopeBuildDetails();
        Optional<EnvelopeLink> envelopeLinkOptional = linkedEnvelopesService.findByLinkedEnvelopeId(linkedEnvelopeId);
        if(envelopeLinkOptional.isEmpty())
        {
            envelopeBuildDetails.setErrorMessage("Linked envelope with id: " + linkedEnvelopeId + " not found");
            return Optional.of(envelopeBuildDetails);
        }
        else
        {
            EnvelopeLink envelopeLink = envelopeLinkOptional.get();
            List<EnvelopeContribution> envelopeContributions = envelopeLink.getEnvelopes();
            List<Envelope> linkedEnvelopes = envelopeContributions.stream()
                    .map(EnvelopeContribution::getEnvelope)
                    .toList();
            switch(updateMode)
            {
                case ADD:
                    List<Envelope> toAdd = new ArrayList<>();
                    envelopes.forEach(envelope -> {
                        Long envelopeId = envelope.getId();
                        boolean isLinked = linkedEnvelopesService.isEnvelopeLinked(linkedEnvelopeId, envelopeId);

                        // Check to see if the envelopes are linked
                        if(!isLinked)
                        {
                            toAdd.add(envelope);
                        }

                        // Verify that the envelopes criteria does not exceed
                    });

            }
            List<Envelope> matchingEnvelopes = envelopes.stream()
                    .filter(envA -> linkedEnvelopes.stream()
                            .anyMatch(envB -> envA.getId().equals(envB.getId()) && envA.isLinked() && envB.isLinked()))
                    .toList();
            if(!matchingEnvelopes.isEmpty())
            {
                String matchingIds = matchingEnvelopes.stream()
                                .map(env -> String.valueOf(env.getId()))
                                        .collect(Collectors.joining(","));
                envelopeBuildDetails.setErrorMessage("Envelopes with ids: " + matchingIds + " already attached to linked envelope with id: " + linkedEnvelopeId);
            }
        }
        return Optional.of(envelopeBuildDetails);
    }

    public EnvelopeBuildDetails runEnvelopeCreation(final EnvelopeCreateRequest envelopeCreateRequest, final BudgetCriteria budgetCriteria, final List<SubBudget> subBudgets)
    {
        Objects.requireNonNull(envelopeCreateRequest, "Envelope Create Request was found null...Unable to create envelope");
        Objects.requireNonNull(budgetCriteria, "BudgetCriteria was found null...Unable to create envelope");
        Objects.requireNonNull(subBudgets, "SubBudgets was found null...Unable to create envelope");
        EnvelopeBuildDetails envelopeBuildDetails = new EnvelopeBuildDetails();
        List<NewEnvelopeCriteria> newEnvelopeCriteria = envelopeCreateRequest.criteria();
        boolean isLinked = envelopeCreateRequest.isLinked();
        if(isLinked)
        {
            Optional<EnvelopeLink> envelopeLinkOptional = linkedEnvelopeBuilderService.build(newEnvelopeCriteria, budgetCriteria, subBudgets);
            if(envelopeLinkOptional.isPresent())
            {
                EnvelopeLink envelopeLink = envelopeLinkOptional.get();
                envelopeBuildDetails.setLinkedEnvelope(envelopeLink);
                List<EnvelopeContribution> contributions = envelopeLink.getEnvelopes();
                Envelope envelope = contributions.get(0).getEnvelope();
                envelopeBuildDetails.setEnvelopes(List.of(envelope));
            }
            else
            {
                envelopeBuildDetails.setErrorMessage("Failed to build linked envelope for criteria: " + newEnvelopeCriteria.get(0).getGoalName() + " with status: FAILED");
            }
        }
        else
        {
            // if isLinked is false, then there will be a single element in the list
            NewEnvelopeCriteria envelopeCriteria = newEnvelopeCriteria.get(0);
            Envelope envelopeDetails = envelopeBuilderService.createSingleEnvelope(envelopeCriteria, budgetCriteria, subBudgets);
            List<Envelope> envelopes = newEnvelopeCriteria.stream()
                            .map(criteria -> envelopeBuilderService.createSingleEnvelope(criteria, budgetCriteria, subBudgets))
                            .peek(env -> log.info("Created Envelope: {}", env))
                            .toList();
            log.info("Created envelope: {}", envelopeDetails);
            envelopeBuildDetails.setEnvelopes(envelopes);
        }
        return envelopeBuildDetails;
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
