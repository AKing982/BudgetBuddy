package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BPBudgetCategory;
import com.app.budgetbuddy.domain.BPCategory;
import com.app.budgetbuddy.entities.BPCategoryEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BPBudgetCategoryRepository;
import com.app.budgetbuddy.workbench.converter.BPCategoryToEntityConverter;
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
public class BPCategoryServiceImpl implements BPCategoryService
{
    private final BPBudgetCategoryRepository bpBudgetCategoryRepository;
    private final BPCategoryToEntityConverter bpBudgetCategoryToEntityConverter;

    @Autowired
    public BPCategoryServiceImpl(BPBudgetCategoryRepository bpBudgetCategoryRepository,
                                 BPCategoryToEntityConverter bpBudgetCategoryToEntityConverter)
    {
        this.bpBudgetCategoryRepository = bpBudgetCategoryRepository;
        this.bpBudgetCategoryToEntityConverter = bpBudgetCategoryToEntityConverter;
    }

    @Override
    @Transactional
    public Collection<BPCategoryEntity> findAll()
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
    public void save(BPCategoryEntity bpBudgetCategoryEntity)
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
    public void delete(BPCategoryEntity bpBudgetCategoryEntity)
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
    public Optional<BPCategoryEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    @Transactional
    public void saveModel(BPCategory budgetCategory)
    {
        try
        {
            BPCategoryEntity budgetCategoryEntity = bpBudgetCategoryToEntityConverter.convert(budgetCategory);
            bpBudgetCategoryRepository.save(budgetCategoryEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the budget category", e);
            throw new DataAccessException("There was an error saving the budget category", e);
        }
    }

    @Override
    @Transactional
    public void saveCategories(List<BPCategory> categories)
    {
        try
        {
            categories.forEach(category -> {
                BPCategoryEntity categoryEntity = bpBudgetCategoryToEntityConverter.convert(category);
                bpBudgetCategoryRepository.save(categoryEntity);
            });
        }catch(DataAccessException e){
            log.error("There was an error saving the budget categories", e);
            throw new DataAccessException("There was an error saving the budget categories", e);
        }
    }
}
