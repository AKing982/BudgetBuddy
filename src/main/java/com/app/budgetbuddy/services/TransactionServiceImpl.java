package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.exceptions.InvalidDataException;
import com.app.budgetbuddy.repositories.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class TransactionServiceImpl implements TransactionService
{
    private final TransactionRepository transactionRepository;
    private final Logger LOGGER = LoggerFactory.getLogger(TransactionServiceImpl.class);

    @Autowired
    public TransactionServiceImpl(TransactionRepository transactionRepository){
        this.transactionRepository = transactionRepository;
    }

    @Override
    public List<TransactionsEntity> findAll()
    {
        try
        {
            return transactionRepository.findAll();

        }catch(Exception e)
        {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void save(TransactionsEntity transactionsEntity) {
        if(transactionsEntity == null){
            throw new NullPointerException("transactionsEntity is null");
        }
        transactionRepository.save(transactionsEntity);
    }


    @Override
    public void delete(TransactionsEntity transactionsEntity) {
        if(transactionsEntity == null){
            throw new NullPointerException("transactionsEntity is null");
        }
        transactionRepository.delete(transactionsEntity);
    }

    @Override
    public Optional<TransactionsEntity> findById(Long id) {
        return transactionRepository.findById(id);
    }


    @Override
    public List<TransactionsEntity> getTransactionsByAmountBetween(BigDecimal startAmount, BigDecimal endAmount) {
        if(startAmount == null || endAmount == null){
            throw new IllegalArgumentException("startAmount is null");
        }

        if(startAmount.compareTo(endAmount) == 0){
            throw new InvalidDataException("Date amounts are identical");
        }
        try
        {
            return transactionRepository.findByAmountBetween(startAmount, endAmount);

        }catch(Exception e) {
            LOGGER.error("There was an error fetching transactions from the database: {}", e.getMessage());
            throw new InvalidDataException("There was an error fetching transactions from the database");
        }
    }

    @Override
    public List<TransactionsEntity> getTransactionsByAmount(BigDecimal amount)
    {
        validateTransactionAmount(amount);
        try
        {
            return transactionRepository.findByAmount(amount);
        }catch(Exception e) {
            LOGGER.error("There was an error fetching transactions from the database: {}", e.getMessage());
            throw new InvalidDataException("There was an error fetching transactions from the database");
        }
    }

    @Override
    public List<TransactionsEntity> getTransactionsByAmountGreaterThan(BigDecimal amount) {
        validateTransactionAmount(amount);
        return transactionRepository.findByAmountGreaterThan(amount);
    }

    @Override
    public List<TransactionsEntity> getTransactionsByAmountLessThan(BigDecimal amount) {
        validateTransactionAmount(amount);
        return transactionRepository.findByAmountLessThan(amount);
    }

    @Override
    public Collection<TransactionsEntity> loadTransactionsForUser(Long userId) {
        return transactionRepository.findTransactionsByUser(userId);
    }

    @Override
    public List<TransactionsEntity> getTransactionsForUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        if(startDate == null || endDate == null){
            throw new NullPointerException("StartDate is null");
        }
        return transactionRepository.findTransactionsByUserIdAndDateRange(userId, startDate, endDate);
    }

    @Override
    public List<TransactionsEntity> getTransactionsByPendingTrue() {
        return transactionRepository.findByPendingTrue();
    }

    @Override
    public List<TransactionsEntity> getTransactionsByAuthorizedDate(LocalDate date) {
        if(date == null){
            throw new NullPointerException("date is null");
        }
        return transactionRepository.findByAuthorizedDate(date);
    }

    @Override
    public List<TransactionsEntity> getTransactionsByAccountId(String accountId) {
        if(accountId.isEmpty()){
            throw new IllegalArgumentException("accountId is empty");
        }
        return transactionRepository.findByAccountReferenceNumber(accountId);
    }

    @Override
    public List<TransactionsEntity> getTransactionsByDescription(String description) {
        if(description == null){
            throw new NullPointerException("description is null");
        }
        return transactionRepository.findTransactionByDescription(description);
    }

    @Override
    public Optional<TransactionsEntity> getTransactionByTransactionId(String transactionId) {
        if(transactionId == null){
            throw new NullPointerException("TransactionId is null");
        }
        return Optional.empty();

        
    }

    @Override
    public Collection<TransactionsEntity> getTransactionsByMerchantName(String merchantName) {
        return List.of();
    }

    private void validateTransactionAmount(BigDecimal amount) {
        if(amount.compareTo(BigDecimal.ZERO) == 0){
            throw new NullPointerException("Null Amount found");
        }
    }
}
