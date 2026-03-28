package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BPBudgetCategoryEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BPBudgetCategoryRepository;
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
public class BPBudgetCategoryServiceImpl implements BPBudgetCategoryService
{
    private final BPBudgetCategoryRepository bpBudgetCategoryRepository;

    @Autowired
    public BPBudgetCategoryServiceImpl(BPBudgetCategoryRepository bpBudgetCategoryRepository)
    {
        this.bpBudgetCategoryRepository = bpBudgetCategoryRepository;
    }

    @Override
    @Transactional
    public Collection<BPBudgetCategoryEntity> findAll()
    {
        try
        {
            return bpBudgetCategoryRepository.findAll();
        }catch(DataAccessException e){
            log.error("There was an error retrieving all the budget categories", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public void save(BPBudgetCategoryEntity bpBudgetCategoryEntity)
    {
        try
        {
            bpBudgetCategoryRepository.save(bpBudgetCategoryEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the budget category", e);
            throw new DataAccessException("There was an error saving the budget category", e);
        }
    }

    @Override
    @Transactional
    public void delete(BPBudgetCategoryEntity bpBudgetCategoryEntity)
    {
        try
        {
            bpBudgetCategoryRepository.delete(bpBudgetCategoryEntity);
        }catch(DataAccessException e){
            log.error("There was an error deleting the budget category", e);
            throw new DataAccessException("There was an error deleting the budget category", e);
        }
    }

    @Override
    public Optional<BPBudgetCategoryEntity> findById(Long id) {
        return Optional.empty();
    }
}
