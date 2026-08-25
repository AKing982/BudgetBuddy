package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.EnvelopeEntity;
import com.app.budgetbuddy.entities.LinkedEnvelopesEntity;
import com.app.budgetbuddy.exceptions.EnvelopeException;
import com.app.budgetbuddy.repositories.EnvelopeRepository;
import com.app.budgetbuddy.services.EnvelopeContributionsService;
import com.app.budgetbuddy.services.EnvelopeService;
import com.app.budgetbuddy.services.LinkedEnvelopesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class LinkedEnvelopeBuilderService
{
    private final LinkedEnvelopesService linkedEnvelopesService;
    private final EnvelopeService envelopeService;
    private final EnvelopeContributionsService envelopeContributionsService;

    @Autowired
    public LinkedEnvelopeBuilderService(LinkedEnvelopesService linkedEnvelopesService,
                                        EnvelopeService envelopeService,
                                        EnvelopeContributionsService envelopeContributionsService)
    {
        this.linkedEnvelopesService = linkedEnvelopesService;
        this.envelopeService = envelopeService;
        this.envelopeContributionsService = envelopeContributionsService;
    }

    public EnvelopeLink linkEnvelopes(List<EnvelopeContribution> envelopeContributions, List<Envelope> envelopes, BigDecimal sharedBudget, BigDecimal totalContributed)
    {
        if(envelopeContributions == null || envelopeContributions.isEmpty())
        {
            throw new EnvelopeException("Envelope contributions cannot be null or empty.");
        }
        if(sharedBudget == null || sharedBudget.compareTo(BigDecimal.ZERO) == 0)
        {
            throw new EnvelopeException("Shared budget cannot be null or zero.");
        }
        EnvelopeLink envelopeLink = EnvelopeLink.builder()
                .linkStatus("ACTIVE")
                .envelopes(envelopeContributions)
                .sharedBudget(sharedBudget)
                .totalContributionAmount(totalContributed)
                .build();

        LinkedEnvelopesEntity linkedEnvelopesEntity = buildLinkedEnvelopesEntity(envelopes, sharedBudget, totalContributed);
        linkedEnvelopesService.save(linkedEnvelopesEntity);
        envelopeLink.setId(linkedEnvelopesEntity.getId());
        envelopeContributionsService.saveContributions(envelopeContributions);
        return envelopeLink;
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
