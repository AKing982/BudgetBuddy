package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BudgetScheduleRangeEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BudgetScheduleRangeRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.config.annotation.web.oauth2.login.OAuth2LoginSecurityMarker;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class BudgetScheduleRangeServiceImpl implements BudgetScheduleRangeService
{
    private final BudgetScheduleRangeRepository budgetScheduleRangeRepository;

    @Autowired
    public BudgetScheduleRangeServiceImpl(BudgetScheduleRangeRepository budgetScheduleRangeRepository)
    {
        this.budgetScheduleRangeRepository = budgetScheduleRangeRepository;
    }

    @Override
    public Collection<BudgetScheduleRangeEntity> findAll()
    {
        try
        {
            return budgetScheduleRangeRepository.findAll();
        }catch(DataAccessException e)
        {
            log.error("There was an error fetching the budget schedule ranges: ", e);
            return Collections.emptyList();
        }
    }

    @Override
    public void save(BudgetScheduleRangeEntity budgetScheduleRangeEntity)
    {
        try
        {
            budgetScheduleRangeRepository.save(budgetScheduleRangeEntity);

        }catch(DataAccessException e){
            log.error("There was an error saving the budget schedule ranges: ", e);
        }
    }

    @Override
    public void delete(BudgetScheduleRangeEntity budgetScheduleRangeEntity)
    {
        try
        {
            budgetScheduleRangeRepository.delete(budgetScheduleRangeEntity);

        }catch(DataAccessException e){
            log.error("There was an error deleting the budget schedule ranges: ", e);
        }
    }

    @Override
    public Optional<BudgetScheduleRangeEntity> findById(Long id) {
        return Optional.empty();
    }
}
