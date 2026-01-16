package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.CSVTransactionsByCategory;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.entities.CSVAccountEntity;
import com.app.budgetbuddy.entities.CSVTransactionEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.CSVAccountRepository;
import com.app.budgetbuddy.repositories.CSVTransactionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@Slf4j
public class CSVTransactionServiceImpl implements CSVTransactionService
{
    private final CSVTransactionRepository csvTransactionRepository;
    private final CSVAccountRepository csvAccountRepository;

    @Autowired
    public CSVTransactionServiceImpl(CSVTransactionRepository csvTransactionRepository,
                                     CSVAccountRepository csvAccountRepository)
    {
        this.csvTransactionRepository = csvTransactionRepository;
        this.csvAccountRepository = csvAccountRepository;
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
                // Find a CSV Account with the suffix
                Optional<CSVAccountEntity> csvAccountEntityOptional = csvAccountRepository.findBySuffixAndUserId(suffix, userId);
                if(csvAccountEntityOptional.isEmpty())
                {
                    log.error("There was an error finding a CSV account with the suffix: {}", suffix);
                    continue;
                }
                CSVAccountEntity csvAccountEntity = csvAccountEntityOptional.get();
                LocalDate transactionDate = transactionCSV.getTransactionDate();
                BigDecimal transactionAmount = transactionCSV.getTransactionAmount();
                String description = transactionCSV.getDescription();
                String extendedDescription = transactionCSV.getExtendedDescription();
                LocalDate electronicTransactionDate = transactionCSV.getElectronicTransactionDate();
                csvTransactionEntity.setCsvAccount(csvAccountEntity);
                csvTransactionEntity.setTransactionDate(transactionDate);
                csvTransactionEntity.setTransactionAmount(transactionAmount);
                csvTransactionEntity.setDescription(description);
                csvTransactionEntity.setMerchantName(transactionCSV.getMerchantName());
                csvTransactionEntity.setBalance(transactionCSV.getBalance());
                csvTransactionEntity.setExtendedDescription(extendedDescription);
                csvTransactionEntity.setElectronicTransactionDate(electronicTransactionDate);
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
        try
        {
            csvTransactionRepository.saveAll(csvTransactionEntities);
        }catch(DataAccessException e){
            log.error("There was an error saving the CSV transaction entities: ", e);
            throw e;
        }
    }

    @Override
    @Transactional
    public Optional<TransactionCSV> updateTransactionCSVByCategory(Long transactionId, String category)

    {
        if(transactionId == null || category == null)
        {
            return Optional.empty();
        }
        try
        {
            csvTransactionRepository.updateCSVTransactionEntityCategory(category, transactionId);
            return findTransactionCSVById(transactionId);
        }catch(DataAccessException e){
            log.error("There was an error updating the transaction CSV by category: ", e);
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public Optional<TransactionCSV> findTransactionCSVById(Long transactionId)
    {
        try
        {
            Optional<CSVTransactionEntity> csvTransactionEntityOptional = csvTransactionRepository.findById(transactionId);
            if(csvTransactionEntityOptional.isEmpty())
            {
                return Optional.empty();
            }
            CSVTransactionEntity csvTransactionEntity = csvTransactionEntityOptional.get();
            TransactionCSV transactionCSV = new TransactionCSV();
            transactionCSV.setId(csvTransactionEntity.getId());
            transactionCSV.setCategory(csvTransactionEntity.getCategory());
            transactionCSV.setAccount(csvTransactionEntity.getCsvAccount().getAccountNumber());
            transactionCSV.setSuffix(csvTransactionEntity.getCsvAccount().getSuffix());
            transactionCSV.setTransactionDate(csvTransactionEntity.getTransactionDate());
            transactionCSV.setTransactionAmount(csvTransactionEntity.getTransactionAmount());
            transactionCSV.setDescription(csvTransactionEntity.getDescription());
            transactionCSV.setMerchantName(csvTransactionEntity.getMerchantName());
            return Optional.of(transactionCSV);
        }catch(DataAccessException e){
            log.error("There was an error finding the transaction CSV by id: ", e);
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public Optional<TransactionCSV> updateTransactionCSVCategoryAndMerchantName(Long transactionId, String merchantName, String category)
    {
        try
        {
            // Update the Transaction with the category
            csvTransactionRepository.updateCSVTransactionEntityCategoryAndMerchantName(category, merchantName, transactionId);

            // Fetch the same CSV Transaction
            Optional<CSVTransactionEntity> updateCSVTransactionWithCategory = csvTransactionRepository.findById(transactionId);
            if(updateCSVTransactionWithCategory.isEmpty())
            {
                log.error("There was an error updating the transaction CSV category: No CSV Transaction Entity was found with the transaction id: {}", transactionId);
                return Optional.empty();
            }
            CSVTransactionEntity csvTransactionEntity = updateCSVTransactionWithCategory.get();
            TransactionCSV transactionCSV = new TransactionCSV();
            transactionCSV.setId(csvTransactionEntity.getId());
            transactionCSV.setCategory(csvTransactionEntity.getCategory());
            transactionCSV.setAccount(csvTransactionEntity.getCsvAccount().getAccountNumber());
            transactionCSV.setSuffix(csvTransactionEntity.getCsvAccount().getSuffix());
            transactionCSV.setTransactionDate(csvTransactionEntity.getTransactionDate());
            transactionCSV.setTransactionAmount(csvTransactionEntity.getTransactionAmount());
            transactionCSV.setDescription(csvTransactionEntity.getDescription());
            transactionCSV.setMerchantName(csvTransactionEntity.getMerchantName());
            transactionCSV.setBalance(csvTransactionEntity.getBalance());

            transactionCSV.setExtendedDescription(csvTransactionEntity.getExtendedDescription());
            transactionCSV.setElectronicTransactionDate(csvTransactionEntity.getElectronicTransactionDate());
            return Optional.of(transactionCSV);
        }catch(DataAccessException e){
            log.error("There was an error updating the transaction CSV category: ", e);
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public List<TransactionCSV> findTransactionCSVByUserIdAndDateRange(Long userId, LocalDate startDate, LocalDate endDate)
    {
        List<CSVTransactionEntity> csvTransactionEntities = findCSVTransactionEntitiesByUserAndDateRange(userId, startDate, endDate);
        List<TransactionCSV> transactionCSVList = new ArrayList<>();
        for(CSVTransactionEntity csvTransactionEntity : csvTransactionEntities)
        {
            TransactionCSV transactionCSV = new TransactionCSV();
            transactionCSV.setSuffix(csvTransactionEntity.getCsvAccount().getSuffix());
            transactionCSV.setId(csvTransactionEntity.getId());
            transactionCSV.setAccount(csvTransactionEntity.getCsvAccount().getAccountNumber());
            transactionCSV.setTransactionDate(csvTransactionEntity.getTransactionDate());
            transactionCSV.setTransactionAmount(csvTransactionEntity.getTransactionAmount());
            transactionCSV.setDescription(csvTransactionEntity.getDescription());
            transactionCSV.setMerchantName(csvTransactionEntity.getMerchantName());
            transactionCSV.setCategory(csvTransactionEntity.getCategory());
            transactionCSV.setBalance(csvTransactionEntity.getBalance());
            transactionCSV.setExtendedDescription(csvTransactionEntity.getExtendedDescription());
            transactionCSV.setElectronicTransactionDate(csvTransactionEntity.getElectronicTransactionDate());
            transactionCSVList.add(transactionCSV);
        }
        return transactionCSVList;
    }

    @Override
    @Transactional
    public List<CSVTransactionEntity> findCSVTransactionEntitiesByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate)
    {
        if(userId == null || startDate == null || endDate == null)
        {
            return Collections.emptyList();
        }
        try
        {
            Optional<CSVAccountEntity> csvAccountEntityOptional = csvAccountRepository.findByUserId(userId);
            if(csvAccountEntityOptional.isEmpty())
            {
                log.error("There was an error finding a CSV account for the user id: {}", userId);
                return Collections.emptyList();
            }
            CSVAccountEntity csvAccountEntity = csvAccountEntityOptional.get();
            Long csvAccountId = csvAccountEntity.getId();
            return csvTransactionRepository.findCSVTransactionEntitiesByAcctIdAndStartDateAndEndDate(csvAccountId, startDate, endDate);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the CSV transaction entities: ", e);
            return Collections.emptyList();
        }
    }
}
