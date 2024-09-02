package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.repositories.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Optional;

@Service
public class AccountServiceImpl implements AccountService
{
    private final AccountRepository accountRepository;

    @Autowired
    public AccountServiceImpl(AccountRepository accountRepository){
        this.accountRepository = accountRepository;
    }

    @Override
    public Collection<AccountEntity> findAll() {
        return accountRepository.findAll();
    }

    @Override
    public void save(AccountEntity accountEntity) {
        accountRepository.save(accountEntity);
    }

    @Override
    public void delete(AccountEntity accountEntity) {
        accountRepository.delete(accountEntity);
    }

    @Override
    public Optional<AccountEntity> findById(Long id) {
        return accountRepository.findById(id);
    }

    @Override
    public Optional<AccountEntity> findByAccountId(String accountId) {
        return accountRepository.findByAccountId(accountId);
    }
}
