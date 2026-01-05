package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.AccountCSV;
import com.app.budgetbuddy.entities.CSVAccountEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.CSVAccountRepository;
import com.app.budgetbuddy.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

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
    public List<CSVAccountEntity> createCSVAccountEntities(final Set<AccountCSV> accountCSVList)
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
                Long userId = accountCSV.getUserId();
                UserEntity userEntity = findUserEntity(userId);
                csvAccountEntity.setAccountNumber(accountNumber);
                csvAccountEntity.setAccountName(accountName);
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
        List<CSVAccountEntity> entitiesToSave = csvAccountEntities.stream()
                        .peek(entity -> entity.setId(null))
                        .filter(entity -> {
                            boolean exists = csvAccountRepository.existsBySuffixAccountNumberAndUserId(entity.getSuffix(), entity.getAccountNumber(), entity.getUser().getId());
                            if(exists){
                                log.info("CSV Account with suffix: {} and account number: {} already exists for user id: {}", entity.getSuffix(), entity.getAccountNumber(), entity.getUser().getId());
                            }
                            return !exists;
                        })
                .toList();
        if(!entitiesToSave.isEmpty()){
            csvAccountRepository.saveAll(entitiesToSave);
            log.info("Successfully saved {} CSV Account Entities", entitiesToSave.size());
        }else{
            log.info("No CSV Account Entities to save");
        }
    }

    private UserEntity findUserEntity(Long userId)
    {
        return userRepository.findById(userId).orElse(null);
    }
}
