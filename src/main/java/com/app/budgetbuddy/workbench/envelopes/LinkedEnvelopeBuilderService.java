package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.EnvelopeException;
import com.app.budgetbuddy.services.EnvelopeContributionsService;
import com.app.budgetbuddy.services.LinkedEnvelopesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class LinkedEnvelopeBuilderService
{
    private final LinkedEnvelopesService linkedEnvelopesService;
    private final EnvelopeContributionsService envelopeContributionsService;
    private List<NewEnvelopeCriteria> nonfeasibleCriteria = new ArrayList<>();

    @Autowired
    public LinkedEnvelopeBuilderService(LinkedEnvelopesService linkedEnvelopesService,
                                        EnvelopeContributionsService envelopeContributionsService)
    {
        this.linkedEnvelopesService = linkedEnvelopesService;
        this.envelopeContributionsService = envelopeContributionsService;
    }

    public EnvelopeLink linkEnvelopes(List<EnvelopeContribution> envelopeContributions, BigDecimal sharedBudget, BigDecimal totalContributed)
    {
        if(envelopeContributions == null || envelopeContributions.isEmpty())
        {
            throw new EnvelopeException("Envelope contributions cannot be null or empty.");
        }
        if(sharedBudget == null || sharedBudget.compareTo(BigDecimal.ZERO) == 0)
        {
            throw new EnvelopeException("Shared budget cannot be null or zero.");
        }
        return EnvelopeLink.builder()
                .linkStatus("ACTIVE")
                .envelopes(envelopeContributions)
                .sharedBudget(sharedBudget)
                .totalContributionAmount(totalContributed)
                .build();
    }
}
