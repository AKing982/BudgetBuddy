package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.EnvelopeLink;
import com.app.budgetbuddy.entities.LinkedEnvelopesEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.LinkedEnvelopesRepository;
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
public class LinkedEnvelopesServiceImpl implements LinkedEnvelopesService
{
    private final LinkedEnvelopesRepository linkedEnvelopesRepository;

    @Autowired
    public LinkedEnvelopesServiceImpl(LinkedEnvelopesRepository linkedEnvelopesRepository)
    {
        this.linkedEnvelopesRepository = linkedEnvelopesRepository;
    }

    @Override
    public Collection<LinkedEnvelopesEntity> findAll() {
        return List.of();
    }

    @Override
    @Transactional
    public void save(LinkedEnvelopesEntity linkedEnvelopesEntity)
    {
        try
        {
            linkedEnvelopesRepository.save(linkedEnvelopesEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the linked envelope: ", e);
            return;
        }
    }

    @Override
    @Transactional
    public void delete(LinkedEnvelopesEntity linkedEnvelopesEntity)
    {
        try
        {
            linkedEnvelopesRepository.delete(linkedEnvelopesEntity);
        }catch(DataAccessException e){
            log.error("There was an error deleting the linked envelope: ");
            return;
        }
    }

    @Override
    public Optional<LinkedEnvelopesEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    @Transactional
    public Optional<EnvelopeLink> findByLinkedEnvelopeId(Long linkedEnvelopeId)
    {
        try
        {
            Optional<LinkedEnvelopesEntity> envelopeLinkOptional = linkedEnvelopesRepository.findById(linkedEnvelopeId);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the envelope with id: {}", linkedEnvelopeId, e);
            return Optional.empty();
        }
        return Optional.empty();
    }

    @Override
    @Transactional
    public List<LinkedEnvelopesEntity> findByUserId(Long userId)
    {
        try
        {
            return linkedEnvelopesRepository.findByUserId(userId);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the linked envelopes for the user", e);
            return Collections.emptyList();
        }
    }
}
