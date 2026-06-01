package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.Contributions;
import com.app.budgetbuddy.domain.EnvelopeContribution;
import com.app.budgetbuddy.entities.EnvelopeContributionsEntity;
import com.app.budgetbuddy.services.EnvelopeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EnvelopeContributionsToEntityConverter implements Converter<EnvelopeContribution, EnvelopeContributionsEntity>
{
    private final EnvelopeService envelopeService;

    @Autowired
    public EnvelopeContributionsToEntityConverter(EnvelopeService envelopeService)
    {
        this.envelopeService = envelopeService;
    }

    @Override
    public EnvelopeContributionsEntity convert(EnvelopeContribution envelopeContribution)
    {
        if(envelopeContribution == null)
        {
            throw new IllegalArgumentException("EnvelopeContribution cannot be null");
        }
        EnvelopeContributionsEntity entity = new EnvelopeContributionsEntity();
        if(envelopeContribution.getEnvelope() != null)
        {
            envelopeService.findById(envelopeContribution.getEnvelope().getId())
                    .ifPresent(entity::setEnvelope);
        }
        if(envelopeContribution.getContributions() != null)
        {
            Contributions contribution = envelopeContribution.getContributions().get(0);
            entity.setContributionAmount(contribution.getAmount());
            entity.setContributionDate(contribution.getContributionDate());
            entity.setScheduledDate(contribution.getScheduledDate());
            entity.setFrequency(contribution.getFrequency());
            entity.setStatus(contribution.getStatus());
            entity.setMinimumContributionAmount(contribution.getMinAmount());
            entity.setMaximumContributionAmount(contribution.getMaxAmount());
        }
        return entity;
    }
}
