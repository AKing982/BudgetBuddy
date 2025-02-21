package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BudgetStatisticsEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BudgetStatisticsRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.Optional;

@Service
@Slf4j
public class BudgetStatisticsServiceImpl implements BudgetStatisticsService
{
    private final BudgetStatisticsRepository budgetStatisticsRepository;

    @Autowired
    public BudgetStatisticsServiceImpl(BudgetStatisticsRepository budgetStatisticsRepository)
    {
        this.budgetStatisticsRepository = budgetStatisticsRepository;
    }

    @Override
    public Collection<BudgetStatisticsEntity> findAll()
    {
        try
        {
            return budgetStatisticsRepository.findAll();
        }catch(DataAccessException e)
        {
            log.error("There was an error retrieving the data from the database", e);
            return Collections.emptyList();
        }
    }

    @Override
    public void save(BudgetStatisticsEntity budgetStatisticsEntity)
    {
        try
        {
            budgetStatisticsRepository.save(budgetStatisticsEntity);
        }catch(DataAccessException e)
        {
            log.error("There was an error saving the budget statistics to the database: ", e);
        }
    }

    @Override
    public void delete(BudgetStatisticsEntity budgetStatisticsEntity)
    {
        try
        {
            budgetStatisticsRepository.delete(budgetStatisticsEntity);
        }catch(DataAccessException e)
        {
            log.error("There was an error deleting the budget statistics from the database: ", e);
        }
    }

    @Override
    public Optional<BudgetStatisticsEntity> findById(Long id)
    {
        try
        {
            return budgetStatisticsRepository.findById(id);
        }catch(DataAccessException e)
        {
            log.error("There was an error retrieving the budget statistics from the database: ", e);
            return Optional.empty();
        }
    }
}
