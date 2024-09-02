package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.repositories.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
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
    public Collection<TransactionsEntity> findAll() {
        return transactionRepository.findAll();
    }

    @Override
    public void save(TransactionsEntity transactionsEntity) {
        transactionRepository.save(transactionsEntity);
    }

    @Override
    public void delete(TransactionsEntity transactionsEntity) {
        transactionRepository.delete(transactionsEntity);
    }

    @Override
    public Optional<TransactionsEntity> findById(Long id) {
        return transactionRepository.findById(id);
    }
}
