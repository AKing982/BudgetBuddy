package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.PreCalculationCategory;
import com.app.budgetbuddy.entities.PreCalculationCategoryEntity;
import com.app.budgetbuddy.repositories.PreCalculationCategoryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class PreCalculationCategoryServiceImpl implements PreCalculationCategoryService
{
    private final PreCalculationCategoryRepository preCalculationCategoryRepository;

    @Autowired
    public PreCalculationCategoryServiceImpl(PreCalculationCategoryRepository preCalculationCategoryRepository)
    {
        this.preCalculationCategoryRepository = preCalculationCategoryRepository;
    }

    @Override
    public Collection<PreCalculationCategoryEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(PreCalculationCategoryEntity preCalculationCategoryEntity) {

    }

    @Override
    public void delete(PreCalculationCategoryEntity preCalculationCategoryEntity) {

    }

    @Override
    public Optional<PreCalculationCategoryEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    public Optional<PreCalculationCategoryEntity> createPreCalculationCategoryEntity(PreCalculationCategory preCalculationCategory)
    {
        if(preCalculationCategory == null)
        {
            return Optional.empty();
        }
        try
        {
            PreCalculationCategoryEntity preCalculationCategoryEntity = new PreCalculationCategoryEntity();
            preCalculationCategoryEntity.setCategory(preCalculationCategory.category());
        }catch(Exception e){
            log.error("There was an error creating the pre calculation category entity: ", e);
            return Optional.empty();
        }
        return Optional.empty();
    }
}
