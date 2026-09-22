package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.InvestmentHoldings;
import com.app.budgetbuddy.entities.InvestmentHoldingsEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.InvestmentHoldingsRepository;
import com.app.budgetbuddy.workbench.converter.InvestmentHoldingsToEntityConverter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Slf4j
public class InvestmentHoldingsServiceImpl implements InvestmentHoldingsService
{
    private final InvestmentHoldingsRepository investmentRepository;
    private final InvestmentHoldingsToEntityConverter investmentHoldingsToEntityConverter;

    @Autowired
    public InvestmentHoldingsServiceImpl(InvestmentHoldingsRepository investmentRepository,
                                         InvestmentHoldingsToEntityConverter investmentHoldingsToEntityConverter)
    {
        this.investmentRepository = investmentRepository;
        this.investmentHoldingsToEntityConverter = investmentHoldingsToEntityConverter;
    }

    @Override
    public Collection<InvestmentHoldingsEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(InvestmentHoldingsEntity investmentEntity) {

    }

    @Override
    public void delete(InvestmentHoldingsEntity investmentEntity) {

    }

    @Override
    public Optional<InvestmentHoldingsEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    @Transactional
    public List<InvestmentHoldingsEntity> createAndSave(List<InvestmentHoldings> investmentHoldings)
    {
        if(investmentHoldings == null || investmentHoldings.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            Map<Long, InvestmentHoldings> uniqueIncoming = investmentHoldings.stream()
                    .filter(Objects::nonNull)
                    .collect(Collectors.toMap(InvestmentHoldings::getId,
                            Function.identity(),
                            (existing, duplicate) -> existing));
            Set<Long> incomingIds = uniqueIncoming.keySet();
            Set<Long> existingIds = investmentRepository.findAllByIdIn(incomingIds).stream()
                    .map(InvestmentHoldingsEntity::getId)
                    .collect(Collectors.toSet());
            List<InvestmentHoldingsEntity> uniqueNewEntities = uniqueIncoming.values().stream()
                    .filter(t -> !existingIds.contains(t.getId()))
                    .map(investmentHoldingsToEntityConverter::convert)
                    .toList();
            if(uniqueNewEntities.isEmpty())
            {
                return Collections.emptyList();
            }
            return investmentRepository.saveAll(uniqueNewEntities);
        }catch(DataAccessException ex){
            log.error("There was an error saving the investment holdings: ", ex);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public List<InvestmentHoldingsEntity> findByUserId(Long userId)
    {
        try
        {
            return investmentRepository.findAllByUser(userId);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the investment holdings: ", e);
            return Collections.emptyList();
        }
    }
}
