package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.EnvelopeEntity;
import com.app.budgetbuddy.entities.LinkedEnvelopesEntity;
import com.app.budgetbuddy.exceptions.EnvelopeException;
import com.app.budgetbuddy.services.EnvelopeContributionsService;
import com.app.budgetbuddy.services.EnvelopeService;
import com.app.budgetbuddy.services.LinkedEnvelopesService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static com.app.budgetbuddy.workbench.envelopes.EnvelopeCalculations.getTotalEnvelopeBudgeted;

@Service
@Slf4j
public class LinkedEnvelopeBuilder implements EnvelopeBuilder<List<NewEnvelopeCriteria>, EnvelopeLink>
{
    private final LinkedEnvelopeBuilderService linkedEnvelopeBuilderService;
    private final EnvelopeContributionsService envelopeContributionsService;
    private final LinkedEnvelopesService linkedEnvelopesService;
    private final EnvelopeService envelopeService;
    private final EnvelopeBuilderService envelopeBuilderService;

    @Autowired
    public LinkedEnvelopeBuilder(LinkedEnvelopeBuilderService linkedEnvelopeBuilderService,
                                 EnvelopeContributionsService envelopeContributionsService,
                                 LinkedEnvelopesService linkedEnvelopesService,
                                 EnvelopeService envelopeService,
                                 EnvelopeBuilderService envelopeBuilderService)
    {
        this.linkedEnvelopeBuilderService = linkedEnvelopeBuilderService;
        this.envelopeContributionsService = envelopeContributionsService;
        this.linkedEnvelopesService = linkedEnvelopesService;
        this.envelopeService = envelopeService;
        this.envelopeBuilderService = envelopeBuilderService;
    }

    @Override
    public Optional<EnvelopeLink> build(final List<NewEnvelopeCriteria> criteria, final BudgetCriteria budgetCriteria, List<SubBudget> subBudgets)
    {
        List<NewEnvelopeCriteria> feasibleCriteria = new ArrayList<>();
        try
        {
            if(criteria == null || criteria.isEmpty())
            {
                throw new EnvelopeException("Envelope criteria cannot be null.");
            }
            log.info("Criteria: {}", criteria);
            log.info("Budget Criteria: {}", budgetCriteria);
            List<NewEnvelopeCriteria> feasibleEnvelopes = EnvelopeCalculations.determineFeasibleEnvelopes(criteria, budgetCriteria);
            log.info("Feasible Envelopes: {}", feasibleEnvelopes);
            List<EnvelopeCriteriaAllocations> envelopeAllocations = EnvelopeCalculations.calculateEnvelopeAllocations(feasibleEnvelopes, budgetCriteria);
            log.info("Envelope Criteria Allocations: {}", envelopeAllocations);
            // Create the individual envelopes
            List<Envelope> baseEnvelopes = envelopeBuilderService.createEnvelopes(feasibleEnvelopes, budgetCriteria, subBudgets, true);
            log.info("Base Envelopes: {}", baseEnvelopes);

            // Save the base envelopes to the database
            List<Envelope> savedEnvelopes = baseEnvelopes.stream()
                    .peek(envelope -> {
                        Envelope entity = envelopeService.save(envelope);
                        envelope.setId(entity.getId());
                    })
                    .toList();
            // Determine the shared budget between all the feasible envelopes
            BigDecimal sharedBudget = getTotalEnvelopeBudgeted(baseEnvelopes);
            log.info("Shared Budget: {}", sharedBudget);

            // Create the Envelope Contributions for each of the feasible envelopes
            List<EnvelopeContribution> envelopeContributions = envelopeBuilderService.createEnvelopeContributions(baseEnvelopes, budgetCriteria);
            log.info("Envelope Contributions: {}", envelopeContributions);
            BigDecimal totalContributed = envelopeContributions.stream()
                    .flatMap(ec -> ec.getContributions().stream())
                    .map(c -> BigDecimal.valueOf(c.getAmount()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            envelopeContributionsService.saveContributions(envelopeContributions);
            log.info("Total Contributed: {}", totalContributed);

            // Create the Envelope Link
            EnvelopeLink envelopeLink = linkedEnvelopeBuilderService.linkEnvelopes(envelopeContributions, sharedBudget, totalContributed);
            log.info("Envelope Link: {}", envelopeLink);

            // Create the Linked Envelope
            LinkedEnvelopesEntity linkedEnvelopesEntity = buildLinkedEnvelopesEntity(savedEnvelopes, sharedBudget, totalContributed);
            linkedEnvelopesService.save(linkedEnvelopesEntity);
            log.info("Linked Envelope: {}", linkedEnvelopesEntity);
            envelopeLink.setId(linkedEnvelopesEntity.getId());
            // return the Envelope Link
            return Optional.of(envelopeLink);

        }catch(EnvelopeException e)
        {
            log.error("There was an error building the linked envelope: ", e);
            return Optional.empty();
        }
    }

    private LinkedEnvelopesEntity buildLinkedEnvelopesEntity(
            List<Envelope> savedEnvelopes,
            BigDecimal sharedBudget,
            BigDecimal totalContributed)
    {
        // Resolve the EnvelopeEntity references by ID for the ManyToMany join table
        Set<EnvelopeEntity> members = savedEnvelopes.stream()
                .map(e -> {
                    EnvelopeEntity entity = new EnvelopeEntity();
                    entity.setId(e.getId());
                    return entity;
                })
                .collect(java.util.stream.Collectors.toSet());

        LinkedEnvelopesEntity entity = new LinkedEnvelopesEntity();
        entity.setSharedBudget(sharedBudget);
        entity.setTotalAllocation(sharedBudget);
        entity.setTotalSpent(BigDecimal.ZERO);
        entity.setScore(0.0);
        entity.setLinkName(savedEnvelopes.stream()
                .map(Envelope::getEnvelopeName)
                .collect(java.util.stream.Collectors.joining(" + ")));
        entity.setLinkedEnvelopeMembers(members);
        return entity;
    }
}
