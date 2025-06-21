package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BPTemplateDetailEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BPTemplateDetailsRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.Optional;

@Service
@Slf4j
public class BPTemplateDetailsServiceImpl implements BPTemplateDetailsService
{
    private final BPTemplateDetailsRepository bpTemplateDetailsRepository;

    @Autowired
    public BPTemplateDetailsServiceImpl(BPTemplateDetailsRepository bpTemplateDetailsRepository)
    {
        this.bpTemplateDetailsRepository = bpTemplateDetailsRepository;
    }

    @Override
    public Collection<BPTemplateDetailEntity> findAll()
    {
        try
        {
            return bpTemplateDetailsRepository.findAll();
        }catch(DataAccessException e)
        {
            log.error("There was an error retrieving all the budget template details.", e);
            return Collections.emptyList();
        }
    }

    @Override
    public void save(BPTemplateDetailEntity bpTemplateDetailEntity)
    {
        if(bpTemplateDetailEntity == null)
        {
            return;
        }
        try
        {
            bpTemplateDetailsRepository.save(bpTemplateDetailEntity);
        }catch(DataAccessException e)
        {
            log.error("There was an error saving the budget template detail: ", e);
            throw new DataAccessException("There was an error saving the budget template detail", e);
        }
    }

    @Override
    public void delete(BPTemplateDetailEntity bpTemplateDetailEntity)
    {
        if(bpTemplateDetailEntity == null)
        {
            return;
        }
        try
        {
            bpTemplateDetailsRepository.delete(bpTemplateDetailEntity);
        }catch(DataAccessException e)
        {
            log.error("There was an error deleting the budget template detail: ", e);
            throw new DataAccessException("There was an error deleting the budget template detail", e);
        }
    }

    @Override
    public Optional<BPTemplateDetailEntity> findById(Long id)
    {
        if(id == null || id < 1)
        {
            log.error("The id provided is invalid: {}", id);
            return Optional.empty();
        }
        try
        {
            return bpTemplateDetailsRepository.findById(id);
        }catch(DataAccessException e)
        {
            log.error("There was an error retrieving the budget template detail with id {}: ", id, e);
            return Optional.empty();
        }
    }
}
