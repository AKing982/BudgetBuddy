package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.repositories.BudgetGoalsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class BudgetGoalsServiceImpl implements BudgetGoalsService
{
    private final BudgetGoalsRepository budgetGoalsRepository;

    @Autowired
    public BudgetGoalsServiceImpl(BudgetGoalsRepository budgetGoalsRepository){
        this.budgetGoalsRepository = budgetGoalsRepository;
    }

    @Override
    public Collection<BudgetGoalsEntity> findAll() {
        return budgetGoalsRepository.findAll();
    }

    @Override
    public void save(BudgetGoalsEntity budgetGoalsEntity) {
        budgetGoalsRepository.save(budgetGoalsEntity);
    }

    @Override
    public void delete(BudgetGoalsEntity budgetGoalsEntity) {
        budgetGoalsRepository.delete(budgetGoalsEntity);
    }

    @Override
    public Optional<BudgetGoalsEntity> findById(Long id) {
        return budgetGoalsRepository.findById(id);
    }
}
