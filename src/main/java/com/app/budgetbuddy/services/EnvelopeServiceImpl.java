package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.Envelope;
import com.app.budgetbuddy.entities.EnvelopeEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.EnvelopeRepository;
import com.app.budgetbuddy.workbench.converter.EnvelopeModelConverter;
import com.app.budgetbuddy.workbench.converter.EnvelopeToEntityConverter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class EnvelopeServiceImpl implements EnvelopeService
{
    private final EnvelopeRepository envelopeRepository;
    private final EnvelopeModelConverter envelopeModelConverter;
    private final EnvelopeToEntityConverter envelopeToEntityConverter;

    @Autowired
    public EnvelopeServiceImpl(EnvelopeRepository envelopeRepository,
                               EnvelopeToEntityConverter envelopeToEntityConverter,
                               EnvelopeModelConverter envelopeModelConverter)
    {
        this.envelopeRepository = envelopeRepository;
        this.envelopeToEntityConverter = envelopeToEntityConverter;
        this.envelopeModelConverter = envelopeModelConverter;
    }

    @Override
    @Transactional
    public Collection<EnvelopeEntity> findAll()
    {
        try
        {
            return envelopeRepository.findAll();
        }catch(DataAccessException e){
            log.error("There was an error retrieving all the envelopes", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public void save(EnvelopeEntity envelopeEntity)
    {
        try
        {
            envelopeRepository.save(envelopeEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the envelope", e);
        }
    }

    @Override
    @Transactional
    public void delete(EnvelopeEntity envelopeEntity)
    {
        try
        {
            envelopeRepository.delete(envelopeEntity);
        }catch(DataAccessException e){
            log.error("There was an error deleting the envelope", e);
        }
    }

    @Override
    @Transactional
    public Optional<EnvelopeEntity> findById(Long id)
    {
        try
        {
            return envelopeRepository.findById(id);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the envelope with id: {}", id, e);
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public List<EnvelopeEntity> findByUserId(Long userId)
    {
        try
        {
            return envelopeRepository.findAllByUserId(userId);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the envelopes for the user", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public Envelope save(Envelope envelope)
    {
        try
        {
            EnvelopeEntity envelopeEntity = envelopeToEntityConverter.convert(envelope);
            EnvelopeEntity savedEntity = envelopeRepository.save(envelopeEntity);
            envelope.setId(savedEntity.getId());
            return envelope;
        }catch(DataAccessException e){
            log.error("There was an error saving the envelope", e);
            return null;
        }
    }

    @Override
    @Transactional
    public Optional<Envelope> findByEnvelopeId(Long envelopeId)
    {
        try
        {
            Optional<EnvelopeEntity> envelopeEntityOptional = envelopeRepository.findById(envelopeId);
            return envelopeEntityOptional.map(envelopeModelConverter::convert);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the envelope with id: {}", envelopeId, e);
            return Optional.empty();
        }
    }
}
