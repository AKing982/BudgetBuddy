package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BPCategoryDetailsEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BPCategoryDetailsRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.Optional;

@Service
@Slf4j
public class BPCategoryDetailsServiceImpl implements BPCategoryDetailsService
{
    private final BPCategoryDetailsRepository bpCategoryDetailsRepository;

    @Autowired
    public BPCategoryDetailsServiceImpl(BPCategoryDetailsRepository bpCategoryDetailsRepository)
    {
        this.bpCategoryDetailsRepository = bpCategoryDetailsRepository;
    }

    @Override
    public Collection<BPCategoryDetailsEntity> findAll()
    {
        try
        {
            return bpCategoryDetailsRepository.findAll();
        }catch(DataAccessException e)
        {
            log.error("There was an error retrieving all the budget category details.", e);
            return Collections.emptyList();
        }
    }

    @Override
    public void save(BPCategoryDetailsEntity bpCategoryDetailsEntity)
    {
        if(bpCategoryDetailsEntity == null)
        {
            return;
        }
        try
        {
            bpCategoryDetailsRepository.save(bpCategoryDetailsEntity);
        }catch(DataAccessException e)
        {
            log.error("There was an error saving the budget category detail: ", e);
            throw new DataAccessException("There was an error saving the budget category detail", e);
        }
    }

    @Override
    public void delete(BPCategoryDetailsEntity bpCategoryDetailsEntity)
    {
        if(bpCategoryDetailsEntity == null)
        {
            return;
        }
        try
        {
            bpCategoryDetailsRepository.delete(bpCategoryDetailsEntity);
        }catch(DataAccessException e)
        {
            log.error("There was an error deleting the budget category detail: ", e);
            throw new DataAccessException("There was an error deleting the budget category detail", e);
        }
    }

    @Override
    public Optional<BPCategoryDetailsEntity> findById(Long id)
    {
        if(id == null || id < 1)
        {
            log.error("The id provided is invalid: {}", id);
            return Optional.empty();
        }
        try
        {
            return bpCategoryDetailsRepository.findById(id);
        }catch(DataAccessException e)
        {
            log.error("There was an error retrieving the budget category detail with id {}: ", id, e);
            return Optional.empty();
        }
    }
}
