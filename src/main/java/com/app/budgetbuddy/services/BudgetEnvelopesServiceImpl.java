package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BudgetEnvelopesEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BudgetEnvelopesRepository;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.Optional;

@Service
@Slf4j
public class BudgetEnvelopesServiceImpl implements BudgetEnvelopesService
{
    private final BudgetEnvelopesRepository budgetEnvelopesRepository;

    @Autowired
    public BudgetEnvelopesServiceImpl(BudgetEnvelopesRepository budgetEnvelopesRepository)
    {
        this.budgetEnvelopesRepository = budgetEnvelopesRepository;
    }

    @Override
    @Transactional
    public Collection<BudgetEnvelopesEntity> findAll()
    {
        try
        {
            return budgetEnvelopesRepository.findAll();
        }catch(DataAccessException e){
            log.error("There was an error retrieving all the budget envelopes", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public void save(BudgetEnvelopesEntity budgetEnvelopesEntity)
    {
        try
        {
            budgetEnvelopesRepository.save(budgetEnvelopesEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the budget envelope", e);
            return;
        }
    }

    @Override
    @Transactional
    public void delete(BudgetEnvelopesEntity budgetEnvelopesEntity)
    {
        try
        {
            budgetEnvelopesRepository.delete(budgetEnvelopesEntity);
        }catch(DataAccessException e){
            log.error("There was an error deleting the budget envelope", e);
            return;
        }
    }

    @Override
    public Optional<BudgetEnvelopesEntity> findById(Long id) {
        return Optional.empty();
    }
}
