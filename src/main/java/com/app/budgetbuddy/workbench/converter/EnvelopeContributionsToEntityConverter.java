package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.Contributions;
import com.app.budgetbuddy.domain.EnvelopeContribution;
import com.app.budgetbuddy.entities.EnvelopeContributionsEntity;
import com.app.budgetbuddy.entities.EnvelopeEntity;
import com.app.budgetbuddy.repositories.EnvelopeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EnvelopeContributionsToEntityConverter implements Converter<EnvelopeContribution, EnvelopeContributionsEntity>
{
    private final EnvelopeRepository envelopeRepository;

    @Autowired
    public EnvelopeContributionsToEntityConverter(EnvelopeRepository envelopeService)
    {
        this.envelopeRepository = envelopeService;
    }

    @Override
    public EnvelopeContributionsEntity convert(EnvelopeContribution envelopeContribution)
    {
        if(envelopeContribution == null)
        {
            throw new IllegalArgumentException("EnvelopeContribution cannot be null");
        }
        EnvelopeContributionsEntity entity = new EnvelopeContributionsEntity();
        if(envelopeContribution.getEnvelope() == null || envelopeContribution.getEnvelope().getId() == null)
        {
            throw new IllegalArgumentException("EnvelopeContribution must have a persisted envelope with a non-null ID");
        }
        EnvelopeEntity envelopeEntity = envelopeRepository.findById(envelopeContribution.getEnvelope().getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Envelope with ID " + envelopeContribution.getEnvelope().getId() + " does not exist in the database"));
        if(envelopeContribution.getContributions() == null || envelopeContribution.getContributions().isEmpty())
        {
            throw new IllegalArgumentException("EnvelopeContribution must have at least one contribution");
        }
        Contributions contribution = envelopeContribution.getContributions().get(0);
        entity.setEnvelope(envelopeEntity);
        entity.setContributionAmount(contribution.getAmount());
        entity.setContributionDate(contribution.getContributionDate());
        entity.setScheduledDate(contribution.getScheduledDate());
        entity.setFrequency(contribution.getFrequency());
        entity.setStatus(contribution.getStatus());
        entity.setMinimumContributionAmount(contribution.getMinAmount());
        entity.setMaximumContributionAmount(contribution.getMaxAmount());
        return entity;
    }
}
