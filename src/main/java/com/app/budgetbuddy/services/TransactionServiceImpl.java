package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.PlaidTransaction;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.repositories.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class TransactionServiceImpl implements TransactionService
{
    private final TransactionRepository transactionRepository;

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
    public Collection<TransactionsEntity> getTransactionsByAmountBetween(BigDecimal startAmount, BigDecimal endAmount) {
        return List.of();
    }

    @Override
    public Collection<TransactionsEntity> getTransactionsByAmount(BigDecimal amount) {
        return List.of();
    }

    @Override
    public Collection<TransactionsEntity> getTransactionsByAmountGreaterThan(BigDecimal amount) {
        return List.of();
    }

    @Override
    public Collection<TransactionsEntity> getTransactionsByAmountLessThan(BigDecimal amount) {
        return List.of();
    }

    @Override
    public Collection<TransactionsEntity> loadTransactionsForUser(Long userId) {
        return transactionRepository.findTransactionsByUser(userId);
    }

    @Override
    public Collection<TransactionsEntity> getTransactionsByPendingTrue() {
        return List.of();
    }

    @Override
    public Collection<TransactionsEntity> getTransactionsByAuthorizedDate(LocalDate date) {
        return List.of();
    }

    @Override
    public Optional<TransactionsEntity> getTransactionByAccountId(String accountId) {
        return Optional.empty();
    }

    @Override
    public Optional<TransactionsEntity> getTransactionByDescription(String description) {
        return Optional.empty();
    }

    @Override
    public Optional<TransactionsEntity> getTransactionByTransactionId(String transactionId) {
        return Optional.empty();
    }

    @Override
    public Collection<TransactionsEntity> getTransactionsByMerchantName(String merchantName) {
        return List.of();
    }
}
