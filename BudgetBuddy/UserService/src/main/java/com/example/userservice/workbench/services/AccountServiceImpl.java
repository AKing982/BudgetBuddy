package com.example.userservice.workbench.services;

import com.example.userservice.entities.AccountEntity;
import com.example.userservice.workbench.repositories.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
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
    public void save(AccountEntity accountEntity) {

    }

    @Override
    public void update(AccountEntity accountEntity) {

    }

    @Override
    public void delete(AccountEntity accountEntity) {

    }

    @Override
    public void deleteAll() {

    }

    @Override
    public Optional<AccountEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    public List<AccountEntity> findAll() {
        return List.of();
    }
}
