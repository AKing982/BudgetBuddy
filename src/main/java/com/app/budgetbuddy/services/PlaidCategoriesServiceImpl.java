package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.PlaidCategoriesEntity;
import com.app.budgetbuddy.repositories.PlaidCategoriesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class PlaidCategoriesServiceImpl implements PlaidCategoriesService
{
    private final PlaidCategoriesRepository plaidCategoriesRepository;

    @Autowired
    public PlaidCategoriesServiceImpl(PlaidCategoriesRepository plaidCategoriesRepository)
    {
        this.plaidCategoriesRepository = plaidCategoriesRepository;
    }

    @Override
    public Collection<PlaidCategoriesEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(PlaidCategoriesEntity plaidCategoriesEntity) {

    }

    @Override
    public void delete(PlaidCategoriesEntity plaidCategoriesEntity) {

    }

    @Override
    public Optional<PlaidCategoriesEntity> findById(Long id) {
        return Optional.empty();
    }
}
