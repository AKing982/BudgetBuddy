package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BPWeekDetailEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BPWeekDetailsRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.Optional;

@Service
@Slf4j
public class BPWeekDetailServiceImpl implements BPWeekDetailService
{
    private final BPWeekDetailsRepository bpWeekDetailsRepository;

    @Autowired
    public BPWeekDetailServiceImpl(BPWeekDetailsRepository bpWeekDetailsRepository)
    {
        this.bpWeekDetailsRepository = bpWeekDetailsRepository;
    }

    @Override
    public Collection<BPWeekDetailEntity> findAll()
    {
        try
        {
            return bpWeekDetailsRepository.findAll();
        }catch(DataAccessException e)
        {
            log.error("There was an error retrieving all the budget week details.", e);
            return Collections.emptyList();
        }
    }

    @Override
    public void save(BPWeekDetailEntity bpWeekDetailEntity)
    {
        if(bpWeekDetailEntity == null)
        {
            return;
        }
        try
        {
            bpWeekDetailsRepository.save(bpWeekDetailEntity);
        }catch(DataAccessException e)
        {
            log.error("There was an error saving the budget week detail: ", e);
            throw new DataAccessException("There was an error saving the budget week detail", e);
        }
    }

    @Override
    public void delete(BPWeekDetailEntity bpWeekDetailEntity)
    {
        if(bpWeekDetailEntity == null)
        {
            return;
        }
        try
        {
            bpWeekDetailsRepository.delete(bpWeekDetailEntity);
        }catch(DataAccessException e)
        {
            log.error("There was an error deleting the budget week detail: ", e);
            throw new DataAccessException("There was an error deleting the budget week detail", e);
        }
    }

    @Override
    public Optional<BPWeekDetailEntity> findById(Long id)
    {
        if(id == null || id < 1)
        {
            log.error("The id provided is invalid: {}", id);
            return Optional.empty();
        }
        try
        {
            return bpWeekDetailsRepository.findById(id);
        }catch(DataAccessException e)
        {
            log.error("There was an error retrieving the budget week detail with id {}: ", id, e);
            return Optional.empty();
        }
    }
}
