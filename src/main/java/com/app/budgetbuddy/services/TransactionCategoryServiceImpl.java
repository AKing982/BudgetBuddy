package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.entities.TransactionCategoryEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.TransactionsNotFoundException;
import com.app.budgetbuddy.repositories.TransactionCategoryRepository;
import com.app.budgetbuddy.repositories.TransactionRepository;
import com.app.budgetbuddy.workbench.converter.TransactionCategoryConverter;
import com.app.budgetbuddy.workbench.converter.TransactionCategoryToEntityConverter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class TransactionCategoryServiceImpl implements TransactionCategoryService
{
    private final TransactionCategoryRepository transactionCategoryRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionCategoryToEntityConverter transactionCategoryToEntityConverter;
    private final TransactionCategoryConverter transactionCategoryConverter;

    @Autowired
    public TransactionCategoryServiceImpl(TransactionCategoryRepository transactionCategoryRepository,
                                          TransactionRepository transactionRepository,
                                          TransactionCategoryToEntityConverter transactionCategoryToEntityConverter,
                                          TransactionCategoryConverter transactionCategoryConverter)
    {
        this.transactionCategoryRepository = transactionCategoryRepository;
        this.transactionRepository = transactionRepository;
        this.transactionCategoryToEntityConverter = transactionCategoryToEntityConverter;
        this.transactionCategoryConverter = transactionCategoryConverter;
    }

    @Override
    public Collection<TransactionCategoryEntity> findAll()
    {
        try
        {
            return transactionCategoryRepository.findAll();
        }catch(DataAccessException e){
            log.error("There was an error while trying to find all transaction categories", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
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
    @Transactional
    public void delete(TransactionCategoryEntity transactionCategorizationEntity)
    {
        try
        {
            transactionCategoryRepository.delete(transactionCategorizationEntity);
        }catch(DataAccessException e){
            log.error("There was an error while deleting the TransactionCategory entity", e);
        }
    }

    @Override
    public Optional<TransactionCategoryEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    @Transactional
    public void saveAll(List<TransactionCategory> transactionCategoryList)
    {
        transactionCategoryList.stream()
                .map(this::convertToEntity)
                .forEach(this::save);
    }

    @Override
    public TransactionCategoryEntity convertToEntity(TransactionCategory transactionCategory)
    {
        return transactionCategoryToEntityConverter.convert(transactionCategory);
    }

    @Override
    public TransactionCategory convertFromEntity(TransactionCategoryEntity transactionCategoryEntity)
    {
        return transactionCategoryConverter.convert(transactionCategoryEntity);
    }

    @Override
    public List<TransactionCategory> getTransactionCategoryListByTransactionIds(List<String> transactionIds)
    {
        if(transactionIds.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            List<TransactionCategoryEntity> transactionCategoryEntities = transactionCategoryRepository.findTransactionCategoryByTransactionIds(transactionIds);
            return transactionCategoryEntities.stream()
                    .map(this::convertFromEntity)
                    .distinct()
                    .toList();
        }catch(DataAccessException e){
            log.error("There was an error fetching the transaction categories: ", e);
            return Collections.emptyList();
        }
    }

    @Override
    public List<TransactionCategory> getTransactionCategoriesBetweenStartAndEndDates(final LocalDate startDate, final LocalDate endDate, final Long userId)
    {
        try
        {
            List<TransactionCategoryEntity> transactionCategoryEntities = transactionCategoryRepository.findTransactionCategoriesBetweenStartAndEndDates(startDate, endDate, userId);
            if(transactionCategoryEntities.isEmpty())
            {
                return Collections.emptyList();
            }
            return transactionCategoryEntities.stream()
                    .map(this::convertFromEntity)
                    .distinct()
                    .toList();

        }catch(DataAccessException e)
        {
            log.error("There was an error while getting the TransactionCategory entity", e);
            return Collections.emptyList();
        }
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
