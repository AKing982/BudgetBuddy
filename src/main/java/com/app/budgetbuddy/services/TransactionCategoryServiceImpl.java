package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.entities.TransactionCategoryEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.TransactionsNotFoundException;
import com.app.budgetbuddy.repositories.TransactionCategoryRepository;
import com.app.budgetbuddy.repositories.TransactionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class TransactionCategoryServiceImpl implements TransactionCategoryService
{
    private final TransactionCategoryRepository transactionCategoryRepository;
    private final TransactionRepository transactionRepository;

    @Autowired
    public TransactionCategoryServiceImpl(TransactionCategoryRepository transactionCategoryRepository,
                                          TransactionRepository transactionRepository)
    {
        this.transactionCategoryRepository = transactionCategoryRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    public Collection<TransactionCategoryEntity> findAll()
    {
        return List.of();
    }

    @Override
    public void save(TransactionCategoryEntity transactionCategorizationEntity)
    {
        try
        {
            transactionCategoryRepository.save(transactionCategorizationEntity);
        }catch(DataAccessException e){
            log.error("There was an error while saving the TransactionCategory entity", e);
        }
    }

    @Override
    public void delete(TransactionCategoryEntity transactionCategorizationEntity) {

    }

    @Override
    public Optional<TransactionCategoryEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    public void saveAll(List<TransactionCategory> transactionCategoryList)
    {
        transactionCategoryList.stream()
                .map(this::convertToEntity)
                .forEach(this::save);
    }

    @Override
    public TransactionCategoryEntity convertToEntity(TransactionCategory transactionCategory)
    {
        TransactionCategoryEntity transactionCategoryEntity = new TransactionCategoryEntity();
        transactionCategoryEntity.setMatchedCategory(transactionCategory.getMatchedCategory());
        transactionCategoryEntity.setPlaidCategory(transactionCategory.getPlaidCategory());
        transactionCategoryEntity.setRecurring(transactionCategory.isRecurring());
        transactionCategoryEntity.setRulePriority(transactionCategory.getPriority());
        transactionCategoryEntity.setCategorizedBy(transactionCategory.getCategorizedBy());
        Optional<TransactionsEntity> transactionsEntityOptional = findTransactionEntityById(transactionCategory.getTransactionId());
        if(transactionsEntityOptional.isEmpty()){
            throw new TransactionsNotFoundException("Transaction Not Found: " + transactionCategory.getTransactionId());
        }
        TransactionsEntity transactionsEntity = transactionsEntityOptional.get();
        transactionCategoryEntity.setTransaction(transactionsEntity);
        return transactionCategoryEntity;
    }

    private Optional<TransactionsEntity> findTransactionEntityById(String id)
    {
        try
        {
            return transactionRepository.findTransactionByTransactionId(id);
        }catch(DataAccessException e){
            log.error("There was an error while getting the TransactionCategory entity", e);
            return Optional.empty();
        }
    }
}
