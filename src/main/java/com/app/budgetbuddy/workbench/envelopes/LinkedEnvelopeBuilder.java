package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.EnvelopeException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.app.budgetbuddy.workbench.envelopes.EnvelopeCalculations.getTotalEnvelopeBudgeted;

@Service
@Slf4j
public class LinkedEnvelopeBuilder implements EnvelopeBuilder<List<NewEnvelopeCriteria>, EnvelopeLink>
{
    private final LinkedEnvelopeBuilderService linkedEnvelopeBuilderService;
    private final EnvelopeBuilderService envelopeBuilderService;

    @Autowired
    public LinkedEnvelopeBuilder(LinkedEnvelopeBuilderService linkedEnvelopeBuilderService,
                                 EnvelopeBuilderService envelopeBuilderService)
    {
        this.linkedEnvelopeBuilderService = linkedEnvelopeBuilderService;
        this.envelopeBuilderService = envelopeBuilderService;
    }

    @Override
    public Optional<EnvelopeLink> build(final List<NewEnvelopeCriteria> criteria, final BudgetCriteria budgetCriteria)
    {
        List<NewEnvelopeCriteria> feasibleCriteria = new ArrayList<>();
        try
        {
            if(criteria == null || criteria.isEmpty())
            {
                throw new EnvelopeException("Envelope criteria cannot be null.");
            }
            List<NewEnvelopeCriteria> feasibleEnvelopes = EnvelopeCalculations.determineFeasibleEnvelopes(criteria, budgetCriteria);
            List<EnvelopeCriteriaAllocations> envelopeAllocations = EnvelopeCalculations.calculateEnvelopeAllocations(feasibleEnvelopes, budgetCriteria);

            // Create the individual envelopes
            List<Envelope> baseEnvelopes = envelopeBuilderService.createEnvelopes(feasibleCriteria, envelopeAllocations);

            // Determine the shared budget between all the feasible envelopes
            BigDecimal sharedBudget = getTotalEnvelopeBudgeted(baseEnvelopes);

            // Create the Envelope Contributions for each of the feasible envelopes
            List<EnvelopeContribution> envelopeContributions = envelopeBuilderService.createEnvelopeContributions(baseEnvelopes, budgetCriteria);

            BigDecimal totalContributed = envelopeContributions.stream()
                    .flatMap(ec -> ec.getContributions().stream())
                    .map(c -> BigDecimal.valueOf(c.getAmount()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Create the Envelope Link
            EnvelopeLink envelopeLink = linkedEnvelopeBuilderService.linkEnvelopes(envelopeContributions, sharedBudget, totalContributed);

            // return the Envelope Link
            return Optional.of(envelopeLink);

        }catch(EnvelopeException e)
        {
            log.error("There was an error building the linked envelope: ", e);
            return Optional.empty();
        }
    }
}
