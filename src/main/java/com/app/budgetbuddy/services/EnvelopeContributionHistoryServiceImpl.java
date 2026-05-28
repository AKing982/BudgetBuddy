package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.Contributions;
import com.app.budgetbuddy.domain.EnvelopeContribution;
import com.app.budgetbuddy.entities.EnvelopeContributionHistoryEntity;
import com.app.budgetbuddy.entities.EnvelopeEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.EnvelopeException;
import com.app.budgetbuddy.repositories.EnvelopeContributionHistoryRepository;
import com.app.budgetbuddy.repositories.EnvelopeRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class EnvelopeContributionHistoryServiceImpl implements EnvelopeContributionHistoryService
{
    private final EnvelopeContributionHistoryRepository envelopeContributionRepository;
    private final EnvelopeRepository envelopeRepository;

    @Autowired
    public EnvelopeContributionHistoryServiceImpl(EnvelopeContributionHistoryRepository envelopeContributionRepository,
                                                  EnvelopeRepository envelopeRepository)
    {
        this.envelopeContributionRepository = envelopeContributionRepository;
        this.envelopeRepository = envelopeRepository;
    }

    @Override
    @Transactional
    public Collection<EnvelopeContributionHistoryEntity> findAll()
    {
        try
        {
            return envelopeContributionRepository.findAll();
        }catch(DataAccessException e)
        {
            log.error("There was an error retrieving all the envelope contribution history", e);
            throw new DataAccessException("There was an error retrieving all the envelope contribution history", e);
        }
    }

    @Override
    @Transactional
    public void save(EnvelopeContributionHistoryEntity envelopeContributionHistoryEntity)
    {
        try
        {
            envelopeContributionRepository.save(envelopeContributionHistoryEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the envelope contribution history", e);
            throw new DataAccessException("There was an error saving the envelope contribution history", e);
        }
    }

    @Override
    @Transactional
    public void delete(EnvelopeContributionHistoryEntity envelopeContributionHistoryEntity)
    {
        try
        {
            envelopeContributionRepository.delete(envelopeContributionHistoryEntity);
        }catch(DataAccessException e){
            log.error("There was an error deleting the envelope contribution history", e);
            throw new DataAccessException("There was an error deleting the envelope contribution history", e);
        }
    }

    @Override
    public Optional<EnvelopeContributionHistoryEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    @Transactional
    public void createAndSaveContribution(final EnvelopeContribution envelopeContribution, final LocalDate dateOfContribution)
    {
        try
        {
            Long envelopeId = envelopeContribution.getEnvelope().getId();
            List<Contributions> contributions = envelopeContribution.getContributions();
            Contributions contribution = contributions.stream()
                    .filter(e -> e.getContributionDate().isEqual(dateOfContribution))
                    .findFirst()
                    .orElseThrow(() -> new EnvelopeException("Contribution not found"));
            String frequency = contribution.getFrequency();
            double contributionAmount = contribution.getAmount();
            LocalDate scheduledDate = contribution.getScheduledDate();
            EnvelopeEntity envelopeEntity = envelopeRepository.findById(envelopeId).orElseThrow(() -> new EnvelopeException("Envelope not found"));
            EnvelopeContributionHistoryEntity envelopeContributionHistoryEntity = new EnvelopeContributionHistoryEntity();
            envelopeContributionHistoryEntity.setEnvelope(envelopeEntity);
            envelopeContributionHistoryEntity.setStatus("Paid");
            envelopeContributionHistoryEntity.setAmount(contributionAmount);
            envelopeContributionHistoryEntity.setFrequency(frequency);
            envelopeContributionHistoryEntity.setScheduledDate(scheduledDate);
            envelopeContributionHistoryEntity.setDate(dateOfContribution);
            envelopeContributionRepository.save(envelopeContributionHistoryEntity);
        }catch(DataAccessException e){
            log.error("There was an error creating and saving the envelope contribution", e);
            return;
        }
    }
}
