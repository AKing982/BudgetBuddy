package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.SubBudgetGoalsEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.SubBudgetGoalsRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class SubBudgetGoalsServiceImpl implements SubBudgetGoalsService
{
    private final SubBudgetGoalsRepository subBudgetGoalsRepository;

    @Autowired
    public SubBudgetGoalsServiceImpl(SubBudgetGoalsRepository subBudgetGoalsRepository)
    {
        this.subBudgetGoalsRepository = subBudgetGoalsRepository;
    }

    @Override
    public Collection<SubBudgetGoalsEntity> findAll()
    {
        try
        {
            return subBudgetGoalsRepository.findAll();
        }catch(DataAccessException e)
        {
            log.error("There was an error while trying to find all the sub budget goals.", e);
            return Collections.emptyList();
        }
    }

    @Override
    public void save(SubBudgetGoalsEntity subBudgetGoalsEntity)
    {
        try
        {
            subBudgetGoalsRepository.save(subBudgetGoalsEntity);
        }catch(DataAccessException e)
        {
            log.error("There was an error saving the sub budget goals: ", e);
        }

    }

    @Override
    public void delete(SubBudgetGoalsEntity subBudgetGoalsEntity)
    {
        try
        {
            subBudgetGoalsRepository.delete(subBudgetGoalsEntity);
        }catch(DataAccessException e)
        {
            log.error("There was an error deleting the sub budget goals: ", e);
        }
    }

    @Override
    public Optional<SubBudgetGoalsEntity> findById(Long id)
    {
        try
        {
            return subBudgetGoalsRepository.findById(id);
        }catch(DataAccessException e)
        {
            log.error("There was an error finding the sub budget goals with id {}: ", id, e);
            return Optional.empty();
        }
    }
}
