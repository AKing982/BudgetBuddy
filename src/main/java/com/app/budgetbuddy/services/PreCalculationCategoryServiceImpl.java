package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.PreCalculationCategoryEntity;
import com.app.budgetbuddy.repositories.PreCalculationCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
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
}
