package com.example.budgetservice.workbench.services;

import com.example.budgetservice.entities.BudgetEntity;
import com.example.budgetservice.workbench.repositories.BudgetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
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
    public void save(BudgetEntity entity) {

    }

    @Override
    public void delete(BudgetEntity entity) {

    }

    @Override
    public Optional<BudgetEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    public List<BudgetEntity> findAll() {
        return List.of();
    }
}
