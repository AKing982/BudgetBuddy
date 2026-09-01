package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.AccountBalanceHistoryEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.AccountBalanceHistoryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collection;
import java.util.Collections;
import java.util.Optional;

@Service
@Slf4j
public class AccountBalanceHistoryServiceImpl implements AccountBalanceHistoryService
{
    private final AccountBalanceHistoryRepository accountBalanceHistoryRepository;

    @Autowired
    public AccountBalanceHistoryServiceImpl(AccountBalanceHistoryRepository accountBalanceHistoryRepository)
    {
        this.accountBalanceHistoryRepository = accountBalanceHistoryRepository;
    }

    @Override
    @Transactional
    public Collection<AccountBalanceHistoryEntity> findAll()
    {
        try
        {
            return accountBalanceHistoryRepository.findAll();
        }catch(DataAccessException e){
            log.error("There was an error retrieving all the account balance history", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public void save(AccountBalanceHistoryEntity accountBalanceHistoryEntity)
    {
        try
        {
            accountBalanceHistoryRepository.save(accountBalanceHistoryEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the account balance history", e);
            return;
        }
    }

    @Override
    @Transactional
    public void delete(AccountBalanceHistoryEntity accountBalanceHistoryEntity)
    {
        try
        {
            accountBalanceHistoryRepository.delete(accountBalanceHistoryEntity);
        }catch(DataAccessException e){
            log.error("There was an error deleting the account balance history", e);
            return;
        }
    }

    @Override
    public Optional<AccountBalanceHistoryEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    @Transactional
    public Optional<AccountBalanceHistoryEntity> findByAccountIdAndDateRange(String accountId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            return accountBalanceHistoryRepository.findByAccountIdAndDateBetween(accountId, startDate, endDate);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the account balance history", e);
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public Optional<AccountBalanceHistoryEntity> findByAccountId(String accountId)
    {
        try
        {

        }catch(DataAccessException e){
            log.error("There was an error retrieving the account balance history", e);
            return Optional.empty();
        }
        return Optional.empty();
    }
}
