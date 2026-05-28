package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.Contributions;
import com.app.budgetbuddy.domain.Envelope;
import com.app.budgetbuddy.domain.EnvelopeContribution;
import com.app.budgetbuddy.entities.EnvelopeContributionsEntity;
import com.app.budgetbuddy.exceptions.EnvelopeException;
import com.app.budgetbuddy.services.EnvelopeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class EnvelopeContributionsEntityToModelConverter implements Converter<EnvelopeContributionsEntity, EnvelopeContribution>
{
    private final EnvelopeService envelopeService;

    @Autowired
    public EnvelopeContributionsEntityToModelConverter(EnvelopeService envelopeService)
    {
        this.envelopeService = envelopeService;
    }

    @Override
    public EnvelopeContribution convert(EnvelopeContributionsEntity entity)
    {
        if(entity == null)
        {
            throw new EnvelopeException("EnvelopeContribution cannot be null");
        }
        Long envelopeId = entity.getEnvelope().getId();
        Contributions contribution = Contributions.builder()
                .id(entity.getId())
                .amount(entity.getContributionAmount() != null ? entity.getContributionAmount() : 0.0)
                .contributionDate(entity.getContributionDate())
                .scheduledDate(entity.getScheduledDate())
                .frequency(entity.getFrequency())
                .status(entity.getStatus())
                .build();
        Envelope envelope = envelopeService.findByEnvelopeId(envelopeId).orElseThrow();
        return EnvelopeContribution.builder()
                .id(entity.getId())
                .envelope(envelope)
                .contributions(List.of(contribution))
                .build();
    }
}
