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
import java.util.*;

import static com.app.budgetbuddy.workbench.envelopes.EnvelopeCalculations.getTotalEnvelopeBudgeted;

@Service
@Slf4j
public class LinkedEnvelopeBuilder implements EnvelopeBuilder<List<NewEnvelopeCriteria>, EnvelopeLink>
{
    private final LinkedEnvelopeBuilderService linkedEnvelopeBuilderService;
    private final LinkedEnvelopesService linkedEnvelopesService;
    private final EnvelopeBuilderService envelopeBuilderService;

    @Autowired
    public LinkedEnvelopeBuilder(LinkedEnvelopeBuilderService linkedEnvelopeBuilderService,
                                 LinkedEnvelopesService linkedEnvelopesService,
                                 EnvelopeBuilderService envelopeBuilderService) {
        this.linkedEnvelopeBuilderService = linkedEnvelopeBuilderService;
        this.linkedEnvelopesService = linkedEnvelopesService;
        this.envelopeBuilderService = envelopeBuilderService;
    }

    @Override
    public Optional<EnvelopeLink> build(final List<NewEnvelopeCriteria> criteria, final BudgetCriteria budgetCriteria, final List<SubBudget> subBudgets)
    {
        Objects.requireNonNull(criteria, "Criteria cannot be null");
        Objects.requireNonNull(budgetCriteria, "Budget Criteria cannot be null");
        Objects.requireNonNull(subBudgets, "SubBudgets cannot be null");
        if(criteria.isEmpty() || subBudgets.isEmpty())
        {
            return Optional.empty();
        }
        List<NewEnvelopeCriteria> feasibleEnvelopes = EnvelopeCalculations.determineFeasibleEnvelopes(criteria, budgetCriteria);
        List<Envelope> baseEnvelopes = envelopeBuilderService.createAndSaveEnvelopes(feasibleEnvelopes, budgetCriteria, subBudgets, true);
        // Determine the shared budget between all the feasible envelopes
        BigDecimal sharedBudget = getTotalEnvelopeBudgeted(baseEnvelopes);

        // Create the Envelope Contributions for each of the feasible envelopes
        List<EnvelopeContribution> envelopeContributions = envelopeBuilderService.createEnvelopeContributions(baseEnvelopes, budgetCriteria);
        BigDecimal totalContributed = getTotalContributed(envelopeContributions);

        // Create the Envelope Link
        EnvelopeLink envelopeLink = linkedEnvelopeBuilderService.linkEnvelopes(envelopeContributions, baseEnvelopes, sharedBudget, totalContributed);
        // return the Envelope Link
        return Optional.of(envelopeLink);
    }

    private BigDecimal getTotalContributed(List<EnvelopeContribution> envelopeContributions)
    {
        return envelopeContributions.stream()
                .flatMap(ec -> ec.getContributions().stream())
                .map(c -> BigDecimal.valueOf(c.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }


}
