package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.RecurringTransactionEntity;
import com.app.budgetbuddy.repositories.RecurringTransactionsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Optional;

@Service
public class RecurringTransactionServiceImpl implements RecurringTransactionService
{
    private final RecurringTransactionsRepository recurringTransactionsRepository;

    @Autowired
    public RecurringTransactionServiceImpl(RecurringTransactionsRepository recurringTransactionsRepository){
        this.recurringTransactionsRepository = recurringTransactionsRepository;
    }

    @Override
    public Collection<RecurringTransactionEntity> findAll() {
        return recurringTransactionsRepository.findAll();
    }

    @Override
    public void save(RecurringTransactionEntity recurringTransactionEntity) {
        recurringTransactionsRepository.save(recurringTransactionEntity);
    }

    @Override
    public void delete(RecurringTransactionEntity recurringTransactionEntity) {
        recurringTransactionsRepository.delete(recurringTransactionEntity);
    }

    @Override
    public Optional<RecurringTransactionEntity> findById(Long id) {
        return recurringTransactionsRepository.findById(id);
    }
}
