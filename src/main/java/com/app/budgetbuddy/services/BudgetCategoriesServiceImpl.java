package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BudgetCategoriesEntity;
import com.app.budgetbuddy.repositories.BudgetCategoriesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class BudgetCategoriesServiceImpl implements BudgetCategoriesService
{
    private final BudgetCategoriesRepository budgetCategoriesRepository;

    @Autowired
    public BudgetCategoriesServiceImpl(BudgetCategoriesRepository budgetCategoriesRepository){
        this.budgetCategoriesRepository = budgetCategoriesRepository;
    }

    @Override
    public Collection<BudgetCategoriesEntity> findAll() {
        return budgetCategoriesRepository.findAll();
    }

    @Override
    public void save(BudgetCategoriesEntity budgetCategoriesEntity) {
        budgetCategoriesRepository.save(budgetCategoriesEntity);
    }

    @Override
    public void delete(BudgetCategoriesEntity budgetCategoriesEntity) {
        budgetCategoriesRepository.delete(budgetCategoriesEntity);
    }

    @Override
    public Optional<BudgetCategoriesEntity> findById(Long id) {
        return budgetCategoriesRepository.findById(id);
    }
}
