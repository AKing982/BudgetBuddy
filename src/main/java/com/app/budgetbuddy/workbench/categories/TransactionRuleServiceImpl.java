package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CSVTransactionRule;
import com.app.budgetbuddy.domain.TransactionRule;
import com.app.budgetbuddy.entities.TransactionRuleEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.repositories.TransactionRuleRepository;
import com.app.budgetbuddy.workbench.converter.TransactionRuleConverter;
import com.app.budgetbuddy.workbench.converter.TransactionRuleToEntityConverter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TransactionRuleServiceImpl implements TransactionRuleService
{
    private final TransactionRuleRepository transactionRuleRepository;
    private final TransactionRuleToEntityConverter transactionRuleToEntityConverter;
    private final TransactionRuleConverter transactionRuleConverter;

    @Autowired
    public TransactionRuleServiceImpl(TransactionRuleRepository transactionRuleRepository,
                                      TransactionRuleToEntityConverter transactionRuleToEntityConverter,
                                      TransactionRuleConverter transactionRuleConverter)
    {
        this.transactionRuleRepository = transactionRuleRepository;
        this.transactionRuleToEntityConverter = transactionRuleToEntityConverter;
        this.transactionRuleConverter = transactionRuleConverter;
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
    @Transactional
    public TransactionRuleEntity create(TransactionRule transactionRule)
    {
       try
       {
          return transactionRuleToEntityConverter.convert(transactionRule);
       }catch(DataException ex){
           log.error("There was an error creating the transaction rule: ", ex);
           throw new DataException("There was an error creating the transaction rule: ", ex);
       }
    }

    @Override
    public void createAll(final List<TransactionRule> transactionRules) {
        try {
            List<TransactionRuleEntity> transactionRules1 = transactionRules.stream()
                    .map(this::create)
                    .toList();
            transactionRuleRepository.saveAll(transactionRules1);
        } catch (DataException e) {
            log.error("Error creating multiple category rules", e);
        }
    }

    @Override
    @Transactional
    public List<TransactionRule> findByUserId(Long userId)
    {
        try
        {
            List<TransactionRuleEntity> transactionRuleEntities = transactionRuleRepository.findAllByUser(userId);
            log.info("Transaction rules size: " + transactionRuleEntities.size());
            return transactionRuleEntities.stream()
                    .map(this::createCategoryRuleFromEntity)
                    .toList();
        }catch(DataAccessException ex){
            log.error("There was an error fetching the category rules for user: ", ex);
            return Collections.emptyList();
        }

    }

    @Override
    public List<TransactionRule> getConvertedCategoryRules(List<TransactionRuleEntity> categoryRuleEntities) {
        return categoryRuleEntities.stream()
                .map(this::createCategoryRuleFromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public TransactionRule createCategoryRuleFromEntity(TransactionRuleEntity transactionRuleEntity)
    {
        return transactionRuleConverter.convert(transactionRuleEntity);
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
    public void updateTransactionRule(TransactionRule transactionRule)
    {
        try
        {
            Long ruleId = transactionRule.getId();
            Optional<TransactionRuleEntity> transactionRuleEntityOptional = transactionRuleRepository.findById(ruleId);
            if(transactionRuleEntityOptional.isPresent())
            {
                TransactionRuleEntity existingTransactionRule = transactionRuleEntityOptional.get();

                // Convert the transaction rule
                TransactionRuleEntity updatedTransactionRule = transactionRuleToEntityConverter.convert(transactionRule);
                transactionRuleRepository.updateTransactionRule(updatedTransactionRule, ruleId);

            }
        }catch(DataAccessException ex){
            log.error("There was an error updating the transaction rule: ", ex);

        }
    }


    @Override
    @Transactional
    public void updateTransactionRuleActiveStatus(boolean active, Long ruleId, Long userId)
    {
        try
        {
            transactionRuleRepository.updateActive(ruleId, active, userId);
        }catch(DataAccessException ex){
            log.error("There was an error updating the transaction rule: ", ex);
            return;
        }
    }

    @Override
    @Transactional
    public void updateMatchCount(Long ruleId, int matchCount)
    {
        try
        {
            transactionRuleRepository.updateMatchCount(ruleId, matchCount);
        }catch(DataAccessException ex){
            log.error("There was an error updating the match count: ", ex);
            throw new DataException("There was an error updating the match count: ", ex);
        }
    }

}
