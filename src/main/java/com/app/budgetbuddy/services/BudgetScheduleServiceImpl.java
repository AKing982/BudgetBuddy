package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BudgetScheduleEntity;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class BudgetScheduleServiceImpl implements BudgetScheduleService
{

    @Override
    public Collection<BudgetScheduleEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(BudgetScheduleEntity budgetPeriodEntity) {

    }

    @Override
    public void delete(BudgetScheduleEntity budgetPeriodEntity) {

    }

    @Override
    public Optional<BudgetScheduleEntity> findById(Long id) {
        return Optional.empty();
    }
}
