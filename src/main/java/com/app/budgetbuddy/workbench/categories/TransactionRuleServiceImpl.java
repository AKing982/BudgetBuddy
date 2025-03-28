package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.TransactionRule;
import com.app.budgetbuddy.domain.UserCategoryRule;
import com.app.budgetbuddy.entities.TransactionRuleEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.repositories.TransactionRuleRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TransactionRuleServiceImpl implements TransactionRuleService
{
    private final TransactionRuleRepository transactionRuleRepository;

    @Autowired
    public TransactionRuleServiceImpl(TransactionRuleRepository transactionRuleRepository)
    {
        this.transactionRuleRepository = transactionRuleRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Collection<TransactionRuleEntity> findAll() {
        try
        {
            return transactionRuleRepository.findAll();
        }catch(DataAccessException ex){
            log.error("Error fetching all categories");
            return List.of();
        }
    }

    @Override
    @Transactional
    public void save(TransactionRuleEntity transactionRuleEntity) {
        try
        {
            transactionRuleRepository.save(transactionRuleEntity);
        }catch(DataAccessException ex){
            log.error("There was an error saving the category rules: ", ex);
        }
    }

    @Override
    public void delete(TransactionRuleEntity transactionRuleEntity) {
        try
        {
            transactionRuleRepository.delete(transactionRuleEntity);
        }catch(DataAccessException ex){
            log.error("There was an error deleting the category rule: ", ex);
        }
    }

    @Override
    public Optional<TransactionRuleEntity> findById(Long id) {
        return transactionRuleRepository.findById(id);
    }

    @Override
    public TransactionRuleEntity create(TransactionRule transactionRule) {
        TransactionRuleEntity transactionRuleEntity = new TransactionRuleEntity();
        transactionRuleEntity.setMerchantPattern(transactionRule.getMerchantPattern());
        transactionRuleEntity.setPriority(transactionRule.getPriority());
        transactionRuleEntity.setCategory(transactionRule.getMatchedCategory());
        transactionRuleEntity.setTransactionType("Debit");
        transactionRuleEntity.setActive(true);
        transactionRuleEntity.setDescriptionPattern(transactionRule.getDescriptionPattern());
        return transactionRuleRepository.save(transactionRuleEntity);
    }

    @Override
    public void createAll(final List<TransactionRule> transactionRules) {
        try {
            transactionRules.stream()
                    .map(this::create)
                    .map(transactionRuleRepository::save);
        } catch (DataException e) {
            log.error("Error creating multiple category rules", e);
        }
    }

    @Override
    public List<TransactionRuleEntity> findByUserId(Long userId) {
        return transactionRuleRepository.findAllByUser(userId);
    }

    @Override
    public List<TransactionRule> getConvertedCategoryRules(List<TransactionRuleEntity> categoryRuleEntities) {
        return categoryRuleEntities.stream()
                .map(this::createCategoryRuleFromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public TransactionRule createCategoryRuleFromEntity(TransactionRuleEntity transactionRuleEntity) {
        TransactionRule transactionRule = new TransactionRule();
        transactionRule.setMerchantPattern(transactionRuleEntity.getMerchantPattern());
//        transactionRule.setFrequency(transactionRuleEntity.getFrequency());
        transactionRule.setMatchedCategory(transactionRuleEntity.getCategory());
        transactionRule.setDescriptionPattern(transactionRuleEntity.getDescriptionPattern());
        return transactionRule;
    }

    @Override
    public List<TransactionRuleEntity> findAllSystemCategoryRules() {
        return transactionRuleRepository.findAllByUserIsNull();
    }

    @Override
    public List<TransactionRule> getSystemCategoryRules() {
        List<TransactionRuleEntity> categoryRuleEntities = transactionRuleRepository.findAll();
        return categoryRuleEntities.stream()
                .filter(TransactionRuleEntity::isActive)
                .map(this::createCategoryRuleFromEntity)
                .toList();
    }

    @Override
    public List<UserCategoryRule> getUserCategoryRules(Long userId) {
        List<TransactionRuleEntity> categoryRuleEntities = transactionRuleRepository.findAllByUser(userId);
//        return categoryRuleEntities.stream()
//                .filter(CategoryRuleEntity::isActive)
//                .map(this::createCategoryRuleFromEntity)
//                .toList();
        return null;
    }
}
