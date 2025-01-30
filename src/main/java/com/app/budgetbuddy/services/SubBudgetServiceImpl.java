package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.SubBudgetRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.Optional;

@Service
@Slf4j
public class SubBudgetServiceImpl implements SubBudgetService
{
    private final SubBudgetRepository subBudgetRepository;

    @Autowired
    public SubBudgetServiceImpl(SubBudgetRepository subBudgetRepository)
    {
        this.subBudgetRepository = subBudgetRepository;
    }

    @Override
    public Collection<SubBudgetEntity> findAll()
    {
        try
        {
            return subBudgetRepository.findAll();

        }catch(DataAccessException e)
        {
            log.error("There was an error fetching all the subBudgets from the database: ", e);
            return Collections.emptyList();
        }
    }

    @Override
    public void save(SubBudgetEntity subBudgetEntity)
    {
        try
        {
            subBudgetRepository.save(subBudgetEntity);

        }catch(DataAccessException e)
        {
            log.error("There was an error saving the subBudget entity: ", e);
        }
    }

    @Override
    public void delete(SubBudgetEntity subBudgetEntity)
    {
        try
        {
            subBudgetRepository.delete(subBudgetEntity);
        }catch(DataAccessException e)
        {
            log.error("There was an error deleting the subBudget entity: ", e);
        }
    }

    @Override
    public Optional<SubBudgetEntity> findById(Long id) {
        return Optional.empty();
    }
}
