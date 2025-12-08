package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.AccountRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
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
    public String findAccountIdByAccountName(String accountName)
    {
        if(accountName.isEmpty())
        {
            return "";
        }
        try
        {
            Optional<String> accountEntityOptional = accountRepository.findAccountIdByName(accountName);
            if(accountEntityOptional.isEmpty())
            {
                log.info("No Account Id was found with the following account name: {}", accountName);
                return "";
            }
            return accountEntityOptional.get();
        }catch(DataAccessException e){
            log.error("There was an error retrieving the account id for the account name: ", e);
            throw e;
        }
    }

    @Override
    @Transactional
    public List<AccountEntity> findByUser(Long userId) {
        return accountRepository.findByUserId(userId);
    }
}
