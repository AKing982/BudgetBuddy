package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.InvestmentTransaction;
import com.app.budgetbuddy.domain.InvestmentTransactionToEntityConverter;
import com.app.budgetbuddy.entities.InvestmentTransactionEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.InvestmentTransactionRepository;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Slf4j
public class InvestmentTransactionServiceImpl implements InvestmentTransactionService
{
    private final InvestmentTransactionRepository investmentTransactionRepository;
    private final InvestmentTransactionToEntityConverter investmentTransactionToEntityConverter;

    @Autowired
    public InvestmentTransactionServiceImpl(InvestmentTransactionRepository investmentTransactionRepository,
                                            InvestmentTransactionToEntityConverter investmentTransactionToEntityConverter)
    {
        this.investmentTransactionRepository = investmentTransactionRepository;
        this.investmentTransactionToEntityConverter = investmentTransactionToEntityConverter;
    }

    @Override
    public Collection<InvestmentTransactionEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(InvestmentTransactionEntity investmentTransactionEntity) {

    }

    @Override
    public void delete(InvestmentTransactionEntity investmentTransactionEntity) {

    }

    @Override
    public Optional<InvestmentTransactionEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    @Transactional
    public List<InvestmentTransactionEntity> createAndSave(List<InvestmentTransaction> investmentTransactions)
    {
        if(investmentTransactions == null || investmentTransactions.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            Map<String, InvestmentTransaction> uniqueIncoming = investmentTransactions.stream()
                    .filter(Objects::nonNull)
                    .collect(Collectors.toMap(InvestmentTransaction::getInvestmentTransactionId,
                            Function.identity(),
                            (existing, duplicate) -> existing));
            Set<String> incomingIds = uniqueIncoming.keySet();
            Set<String> existingIds = investmentTransactionRepository.findAllByInvestmentTransactionIdIn(incomingIds)
                    .stream()
                    .map(InvestmentTransactionEntity::getInvestmentTransactionId)
                    .collect(Collectors.toSet());
            List<InvestmentTransactionEntity> uniqueNewEntities = uniqueIncoming.values().stream()
                    .filter(t -> !existingIds.contains(t.getInvestmentTransactionId()))
                    .map(investmentTransactionToEntityConverter::convert)
                    .toList();
            if(uniqueNewEntities.isEmpty())
            {
                return Collections.emptyList();
            }
            return investmentTransactionRepository.saveAll(uniqueNewEntities);
        }catch(DataAccessException ex){
            log.error("There was an error saving the investment transactions: ", ex);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public List<InvestmentTransactionEntity> findByUserId(Long userId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            List<InvestmentTransactionEntity> investmentTransactionEntities = investmentTransactionRepository.findAllByUserIdAndDateRange(userId, startDate, endDate);
            investmentTransactionEntities.forEach(investmentTransactionEntity -> {
                Hibernate.initialize(investmentTransactionEntity.getAccount());
            });
            return investmentTransactionEntities;
        }catch(DataAccessException e){
            log.error("There was an error retrieving the investment transactions", e);
            return Collections.emptyList();
        }

    }
}
