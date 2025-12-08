package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.AccountCSV;
import com.app.budgetbuddy.entities.CSVAccountEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.CSVAccountRepository;
import com.app.budgetbuddy.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@Slf4j
public class CSVAccountServiceImpl implements CSVAccountService
{
    private final CSVAccountRepository csvAccountRepository;
    private final UserRepository userRepository;

    @Autowired
    public CSVAccountServiceImpl(CSVAccountRepository csvAccountRepository,
                                 UserRepository userRepository)
    {
        this.csvAccountRepository = csvAccountRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Collection<CSVAccountEntity> findAll()
    {
        return csvAccountRepository.findAll();
    }

    @Override
    public void save(CSVAccountEntity csvAccountEntity) {
        csvAccountRepository.save(csvAccountEntity);
    }

    @Override
    public void delete(CSVAccountEntity csvAccountEntity) {
        csvAccountRepository.delete(csvAccountEntity);
    }

    @Override
    public Optional<CSVAccountEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    public List<CSVAccountEntity> createCSVAccountEntities(final List<AccountCSV> accountCSVList)
    {
        if(accountCSVList == null || accountCSVList.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            List<CSVAccountEntity> csvAccountEntityList = new ArrayList<>();
            for(AccountCSV accountCSV : accountCSVList)
            {
                CSVAccountEntity csvAccountEntity = new CSVAccountEntity();
                String accountNumber = accountCSV.getAccountNumber();
                int suffix = accountCSV.getSuffix();
                String accountName = accountCSV.getAccountName();
                BigDecimal balance = accountCSV.getBalance();
                Long userId = accountCSV.getUserId();
                UserEntity userEntity = findUserEntity(userId);
                csvAccountEntity.setAccountNumber(accountNumber);
                csvAccountEntity.setAccountName(accountName);
                csvAccountEntity.setBalance(balance.doubleValue());
                csvAccountEntity.setSuffix(suffix);
                csvAccountEntity.setActive(true);
                csvAccountEntity.setUser(userEntity);
                csvAccountEntityList.add(csvAccountEntity);
            }
            return csvAccountEntityList;
        }catch(DataAccessException e){
            log.error("There was an error creating the CSV account entities: ", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public void saveAllCSVAccountEntities(List<CSVAccountEntity> csvAccountEntities)
    {
        csvAccountRepository.saveAll(csvAccountEntities);
    }

    private UserEntity findUserEntity(Long userId)
    {
        return userRepository.findById(userId).orElse(null);
    }
}
