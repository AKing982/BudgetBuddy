package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BudgetScheduleRange;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.entities.BudgetScheduleEntity;
import com.app.budgetbuddy.entities.BudgetScheduleRangeEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BudgetScheduleRangeRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.config.annotation.web.oauth2.login.OAuth2LoginSecurityMarker;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

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

    @Override
    public List<BudgetScheduleRange> getBudgetScheduleRangesByRangeAndScheduleId(LocalDate startDate, LocalDate endDate, Long scheduleId)
    {
        try
        {
            List<BudgetScheduleRangeEntity> budgetScheduleRangeEntities = budgetScheduleRangeRepository.findBudgetScheduleRangeEntitiesByRangeAndScheduleId(startDate, endDate, scheduleId);
            return convertBudgetScheduleRangeEntities(budgetScheduleRangeEntities);
        }catch(DataAccessException e)
        {
            log.error("There was an error retrieving the budget schedule ranges: ", e);
            log.error("For the date range: startRange={}, endRange={}, scheduleId={}", startDate, endDate, scheduleId);
            return Collections.emptyList();
        }
    }

    private List<BudgetScheduleRange> convertBudgetScheduleRangeEntities(final List<BudgetScheduleRangeEntity> budgetScheduleEntities)
    {
        List<BudgetScheduleRange> budgetScheduleRangeList = new ArrayList<>();
        try
        {
            for(BudgetScheduleRangeEntity budgetScheduleRangeEntity : budgetScheduleEntities)
            {
                BudgetScheduleRange budgetScheduleRange = new BudgetScheduleRange();
                budgetScheduleRange.setRangeType(budgetScheduleRangeEntity.getRangeType());
                budgetScheduleRange.setStartRange(budgetScheduleRangeEntity.getRangeStart());
                budgetScheduleRange.setEndRange(budgetScheduleRangeEntity.getRangeEnd());
                budgetScheduleRange.setSingleDate(false);
                budgetScheduleRange.setSpentOnRange(budgetScheduleRangeEntity.getSpentOnRange());
                budgetScheduleRange.setBudgetedAmount(budgetScheduleRangeEntity.getBudgetedAmount());
                budgetScheduleRange.setBudgetScheduleId(budgetScheduleRange.getBudgetScheduleId());
                budgetScheduleRange.setBudgetDateRange(new DateRange(budgetScheduleRangeEntity.getRangeStart(), budgetScheduleRangeEntity.getRangeEnd()));
                budgetScheduleRangeList.add(budgetScheduleRange);
            }
        }catch(Exception e)
        {
            log.error("There was an error converting the budget schedule ranges: ", e);
            return Collections.emptyList();
        }
        return budgetScheduleRangeList;
    }
}
