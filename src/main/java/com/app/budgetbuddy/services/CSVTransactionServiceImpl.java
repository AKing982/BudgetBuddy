package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.CSVTransactionsByCategory;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.entities.CSVAccountEntity;
import com.app.budgetbuddy.entities.CSVTransactionEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.CSVAccountRepository;
import com.app.budgetbuddy.repositories.CSVTransactionRepository;
import com.app.budgetbuddy.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class CSVTransactionServiceImpl implements CSVTransactionService
{
    private final CSVTransactionRepository csvTransactionRepository;
    private final UserRepository userRepository;

    @Autowired
    public CSVTransactionServiceImpl(CSVTransactionRepository csvTransactionRepository,
                                     UserRepository csvAccountRepository)
    {
        this.csvTransactionRepository = csvTransactionRepository;
        this.userRepository = csvAccountRepository;
    }

    @Override
    @Transactional
    public Collection<CSVTransactionEntity> findAll()
    {
        return csvTransactionRepository.findAll();
    }

    @Override
    @Transactional
    public void save(CSVTransactionEntity csvTransactionEntity)
    {
        csvTransactionRepository.save(csvTransactionEntity);
    }

    @Override
    public void delete(CSVTransactionEntity csvTransactionEntity)
    {
        csvTransactionRepository.delete(csvTransactionEntity);
    }

    @Override
    public Optional<CSVTransactionEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    @Transactional
    public boolean existsByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            log.info("Checking if transaction exists between {} and {}", startDate, endDate);
            boolean exists = csvTransactionRepository.existsByUserAndDateRange(userId, startDate, endDate);
            log.info("Transaction {} exists between {} and {}", userId, startDate, endDate);
            return exists;
        }catch(DataAccessException e){
            log.error("Failed to check CSV transaction existence for userId {}, startDate {}, endDate {}", userId, startDate, endDate);
            return false;
        }
    }

    @Override
    @Transactional
    public List<CSVTransactionEntity> createCSVTransactionEntities(final List<TransactionCSV> transactionCSVList, final Long userId)
    {
        if(transactionCSVList == null || transactionCSVList.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            List<CSVTransactionEntity> csvTransactionEntityList = new ArrayList<>();
            for(TransactionCSV transactionCSV : transactionCSVList)
            {
                CSVTransactionEntity csvTransactionEntity = new CSVTransactionEntity();
                int suffix = transactionCSV.getSuffix();
                LocalDate transactionDate = transactionCSV.getTransactionDate();
                BigDecimal transactionAmount = transactionCSV.getTransactionAmount();
                String description = transactionCSV.getDescription();
                String extendedDescription = transactionCSV.getExtendedDescription();
                LocalDate electronicTransactionDate = transactionCSV.getElectronicTransactionDate();
                csvTransactionEntity.setTransactionDate(transactionDate);
                csvTransactionEntity.setTransactionAmount(transactionAmount);
                csvTransactionEntity.setDescription(description);
                csvTransactionEntity.setMerchantName(transactionCSV.getMerchantName());
                csvTransactionEntity.setBalance(transactionCSV.getBalance());
                csvTransactionEntity.setExtendedDescription(extendedDescription);
                csvTransactionEntity.setInstitutionId(transactionCSV.getInstitution_id());
                csvTransactionEntity.setElectronicTransactionDate(electronicTransactionDate);
                csvTransactionEntity.setUser(userRepository.findById(userId).get());
                // Find a CSV Account with the suffix
                csvTransactionEntityList.add(csvTransactionEntity);
            }
            return csvTransactionEntityList;
        }catch(DataAccessException e){
            log.error("There was an error creating the CSV transaction entities: ", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public void saveAllCSVTransactionEntities(List<CSVTransactionEntity> csvTransactionEntities)
    {
        List<CSVTransactionEntity> uniqueCSVTransactionEntities = new ArrayList<>();
        try
        {
            for(CSVTransactionEntity csvTransactionEntity : csvTransactionEntities)
            {
                Long userId = csvTransactionEntity.getUser().getId();
                LocalDate transactionDate = csvTransactionEntity.getTransactionDate();
                String description = csvTransactionEntity.getDescription();
                String extendedDescription = csvTransactionEntity.getExtendedDescription();
                String merchant = csvTransactionEntity.getMerchantName();
                BigDecimal transactionAmount = csvTransactionEntity.getTransactionAmount();
                // Does the transaction already exist in the database?
                Optional<CSVTransactionEntity> existing = csvTransactionRepository.findCSVTransactionByUserIdAndParams(userId, transactionDate, merchant, extendedDescription, description, transactionAmount.doubleValue());
                if(existing.isPresent())
                {
                    log.info("CSVTransaction with id {} already exists", csvTransactionEntity.getId());
                    continue;
                }
                uniqueCSVTransactionEntities.add(csvTransactionEntity);
            }
            csvTransactionRepository.saveAll(uniqueCSVTransactionEntities);
        }catch(DataAccessException e){
            log.error("There was an error saving the CSV transaction entities: ", e);
            throw e;
        }
    }


    @Override
    @Transactional
    public Optional<TransactionCSV> findTransactionCSVById(Long transactionId)
    {
        try
        {
            return csvTransactionRepository.findById(transactionId)
                    .map(this::convertToTransactionCSV);
        }catch(DataAccessException e){
            log.error("There was an error finding the transaction CSV by id: ", e);
            return Optional.empty();
        }
    }

    @Override
    public List<TransactionCSV> findTransactionCSVByIds(List<Long> ids)
    {
        if (ids == null || ids.isEmpty()) return List.of();
        return csvTransactionRepository.findAllByIds(ids)
                .stream()
                .map(this::convertToTransactionCSV)
                .collect(Collectors.toList());
    }

    private TransactionCSV convertToTransactionCSV(CSVTransactionEntity entity)
    {
        TransactionCSV transactionCSV = new TransactionCSV();
        transactionCSV.setId(entity.getId());
        transactionCSV.setTransactionDate(entity.getTransactionDate());
        transactionCSV.setTransactionAmount(entity.getTransactionAmount());
        transactionCSV.setDescription(entity.getDescription());
        transactionCSV.setMerchantName(entity.getMerchantName());
        transactionCSV.setBalance(entity.getBalance());
        transactionCSV.setExtendedDescription(entity.getExtendedDescription());
        transactionCSV.setElectronicTransactionDate(entity.getElectronicTransactionDate());
        transactionCSV.setInstitution_id(entity.getInstitutionId());
        transactionCSV.setUserId(entity.getUser().getId());
        return transactionCSV;
    }

    @Override
    @Transactional
    public List<TransactionCSV> findTransactionCSVByUserIdAndDateRange(Long userId, LocalDate startDate, LocalDate endDate, int pageNum)
    {
        return findCSVTransactionEntitiesByUserAndDateRange(userId, startDate, endDate, pageNum)
                .stream()
                .map(this::convertToTransactionCSV)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Page<CSVTransactionEntity> findCSVTransactionEntitiesByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate, int pageNum)
    {
        if(userId == null || startDate == null || endDate == null)
        {
            return Page.empty();
        }
        try
        {

            Pageable pageable = PageRequest.of(0, pageNum);
            return csvTransactionRepository.findCSVTransactionEntitiesByUserIdAndStartDateAndEndDate(userId, startDate, endDate, pageable);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the CSV transaction entities: ", e);
            return Page.empty();
        }
    }
}
