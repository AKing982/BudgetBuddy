package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.repositories.BudgetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Optional;

@Service
public class BudgetServiceImpl implements BudgetService
{
    private final BudgetRepository budgetRepository;

    @Autowired
    public BudgetServiceImpl(BudgetRepository budgetRepository){
        this.budgetRepository = budgetRepository;
    }

    @Override
    public Collection<BudgetEntity> findAll() {
        return budgetRepository.findAll();
    }

    @Override
    public void save(BudgetEntity budgetEntity) {
        budgetRepository.save(budgetEntity);
    }

    @Override
    public void delete(BudgetEntity budgetEntity) {
        budgetRepository.delete(budgetEntity);
    }

    @Override
    public Optional<BudgetEntity> findById(Long id) {
        return budgetRepository.findById(id);
    }
}
