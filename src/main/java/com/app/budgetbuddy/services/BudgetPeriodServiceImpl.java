package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BudgetPeriodEntity;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class BudgetPeriodServiceImpl implements BudgetPeriodService
{

    @Override
    public Collection<BudgetPeriodEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(BudgetPeriodEntity budgetPeriodEntity) {

    }

    @Override
    public void delete(BudgetPeriodEntity budgetPeriodEntity) {

    }

    @Override
    public Optional<BudgetPeriodEntity> findById(Long id) {
        return Optional.empty();
    }
}
