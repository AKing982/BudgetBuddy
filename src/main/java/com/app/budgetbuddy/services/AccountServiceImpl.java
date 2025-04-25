package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.repositories.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class AccountServiceImpl implements AccountService
{
    private final AccountRepository accountRepository;

    @Autowired
    public AccountServiceImpl(AccountRepository accountRepository)
    {
        this.accountRepository = accountRepository;
    }

    @Override
    @Transactional
    public Collection<AccountEntity> findAll()
    {
        return accountRepository.findAll();
    }

    @Override
    @Transactional
    public void save(AccountEntity accountEntity)
    {
        accountRepository.save(accountEntity);
    }

    @Override
    @Transactional
    public void delete(AccountEntity accountEntity)
    {
        accountRepository.delete(accountEntity);
    }

    @Override
    @Transactional
    public Optional<AccountEntity> findById(Long id) {
        return accountRepository.findById(id);
    }

    @Override
    @Transactional
    public Optional<AccountEntity> findByAccountId(String accountId)
    {
        return accountRepository.findByAccountId(accountId);
    }

    @Override
    @Transactional
    public List<AccountEntity> findByUser(Long userId) {
        return accountRepository.findByUserId(userId);
    }
}
