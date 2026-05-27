package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.EnvelopeContributionHistoryEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.EnvelopeContributionHistoryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Optional;

@Service
@Slf4j
public class EnvelopeContributionHistoryServiceImpl implements EnvelopeContributionHistoryService
{
    private final EnvelopeContributionHistoryRepository envelopeContributionRepository;

    @Autowired
    public EnvelopeContributionHistoryServiceImpl(EnvelopeContributionHistoryRepository envelopeContributionRepository)
    {
        this.envelopeContributionRepository = envelopeContributionRepository;
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
}
