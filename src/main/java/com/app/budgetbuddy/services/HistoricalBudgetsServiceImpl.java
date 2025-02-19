package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.HistoricalBudgetsEntity;
import com.app.budgetbuddy.repositories.HistoricalBudgetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;


@Service
public class HistoricalBudgetsServiceImpl implements HistoricalBudgetsService
{
    private final HistoricalBudgetRepository historicalBudgetRepository;

    @Autowired
    public HistoricalBudgetsServiceImpl(HistoricalBudgetRepository historicalBudgetRepository)
    {
        this.historicalBudgetRepository = historicalBudgetRepository;
    }

    @Override
    public Collection<HistoricalBudgetsEntity> findAll()
    {
        return List.of();
    }

    @Override
    public void save(HistoricalBudgetsEntity historicalBudgetsEntity) {

    }

    @Override
    public void delete(HistoricalBudgetsEntity historicalBudgetsEntity) {

    }

    @Override
    public Optional<HistoricalBudgetsEntity> findById(Long id) {
        return Optional.empty();
    }
}
