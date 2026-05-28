package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.EnvelopeContribution;
import com.app.budgetbuddy.entities.EnvelopeContributionsEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.EnvelopeContributionsRepository;
import com.app.budgetbuddy.repositories.EnvelopeRepository;
import com.app.budgetbuddy.workbench.converter.EnvelopeContributionsEntityToModelConverter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class EnvelopeContributionsServiceImpl implements EnvelopeContributionsService
{
    private final EnvelopeContributionsRepository envelopeContributionsRepository;
    private final EnvelopeContributionsEntityToModelConverter envelopeContributionsEntityToModelConverter;
    private final EnvelopeRepository envelopeService;

    @Autowired
    public EnvelopeContributionsServiceImpl(EnvelopeContributionsRepository envelopeContributionsRepository,
                                            EnvelopeContributionsEntityToModelConverter envelopeContributionsEntityToModelConverter,
                                            EnvelopeRepository envelopeService)
    {
        this.envelopeContributionsRepository = envelopeContributionsRepository;
        this.envelopeService = envelopeService;
        this.envelopeContributionsEntityToModelConverter = envelopeContributionsEntityToModelConverter;
    }

    @Override
    public Collection<EnvelopeContributionsEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(EnvelopeContributionsEntity envelopeContributionsEntity) {

    }

    @Override
    public void delete(EnvelopeContributionsEntity envelopeContributionsEntity) {

    }

    @Override
    public Optional<EnvelopeContributionsEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    @Transactional
    public List<EnvelopeContributionsEntity> getEnvelopeContributionsByEnvelopeId(Long envelopeId)
    {
        try
        {
            return envelopeContributionsRepository.findByEnvelopeId(envelopeId);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the envelope contributions", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public Optional<EnvelopeContribution> findByContributionId(Long contributionId)
    {
        try
        {
            Optional<EnvelopeContributionsEntity> envelopeContributionsEntityOptional = envelopeContributionsRepository.findById(contributionId);
            return envelopeContributionsEntityOptional.map(envelopeContributionsEntityToModelConverter::convert);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the envelope contribution", e);
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public Optional<EnvelopeContribution> createAndSaveEntry(final BigDecimal amount, final LocalDate entryDate, final Long envelopeId)
    {
        try
        {
            EnvelopeContributionsEntity envelopeContributionsEntity = new EnvelopeContributionsEntity();
            envelopeContributionsEntity.setEnvelope(envelopeService.findById(envelopeId).orElseThrow());
            envelopeContributionsEntity.setContributionDate(entryDate);
            envelopeContributionsEntity.setContributionAmount(amount.doubleValue());
            envelopeContributionsEntity.setScheduledDate(entryDate);
            envelopeContributionsEntity.setLinkedContribution(null);
            envelopeContributionsEntity.setFrequency("Manual");
            envelopeContributionsEntity.setStatus("Submitted");

            //TODO: Add logic to determine whether the input amount is the minimum or maximum contribution amount
            envelopeContributionsEntity.setMinimumContributionAmount(amount.doubleValue());
            envelopeContributionsEntity.setMaximumContributionAmount(amount.doubleValue());
            envelopeContributionsRepository.save(envelopeContributionsEntity);
            return Optional.of(envelopeContributionsEntity);
        }catch(DataAccessException e){
            log.error("There was an error creating and saving the envelope contribution", e);
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public Optional<EnvelopeContribution> updateAmountAndDate(Long contributionId, BigDecimal amount, LocalDate entryDate)
    {
        try
        {
            envelopeContributionsRepository.updateContributionAmount(contributionId, amount.doubleValue(), entryDate);

        }catch(DataAccessException e){
            log.error("There was an error updating the envelope contribution", e);
            return Optional.empty();
        }
        return Optional.empty();
    }

    @Override
    @Transactional
    public Optional<EnvelopeContribution> getEnvelopeContributionsByEnvelopeIdAndScheduledDate(Long envelopeId, LocalDate scheduledDate)
    {
        try
        {
            List<EnvelopeContributionsEntity> envelopeContributions = envelopeContributionsRepository.findByEnvelopeId(envelopeId);

            return envelopeContributionsRepository.findByEnvelopeIdAndScheduledDate(envelopeId, scheduledDate);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the envelope contributions", e);
            return Optional.empty();
        }
    }
}
