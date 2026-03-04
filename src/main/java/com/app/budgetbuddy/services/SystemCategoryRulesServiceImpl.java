package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.PlaidCategoriesEntity;
import com.app.budgetbuddy.entities.SystemCategoryRulesEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.SystemCategoryRulesRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class SystemCategoryRulesServiceImpl implements SystemCategoryRulesService
{
    private final SystemCategoryRulesRepository systemCategoryRulesRepository;

    @Autowired
    public SystemCategoryRulesServiceImpl(SystemCategoryRulesRepository systemCategoryRulesRepository)
    {
        this.systemCategoryRulesRepository = systemCategoryRulesRepository;
    }

    @Override
    @Transactional
    public Collection<SystemCategoryRulesEntity> findAll()
    {
        try
        {
            return systemCategoryRulesRepository.findAll();
        }catch(DataAccessException e){
            log.error("There was an error retrieving the data from the database", e);
            return List.of();
        }
    }

    @Override
    @Transactional
    public void save(SystemCategoryRulesEntity systemCategoryRulesEntity)
    {
        try
        {
            systemCategoryRulesRepository.save(systemCategoryRulesEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the data to the database", e);
            throw new DataAccessException("There was an error saving the data to the database", e);
        }
    }

    @Override
    @Transactional
    public void delete(SystemCategoryRulesEntity systemCategoryRulesEntity)
    {
        try
        {
            systemCategoryRulesRepository.delete(systemCategoryRulesEntity);
        }catch(DataAccessException e){
            log.error("There was an error deleting the data from the database", e);
        }
    }

    @Override
    public Optional<SystemCategoryRulesEntity> findById(Long id)
    {
        return Optional.empty();
    }


    @Override
    @Transactional
    public Optional<SystemCategoryRulesEntity> findByMerchantOnly(String merchant)
    {
        if(merchant == null || merchant.isEmpty())
        {
            return Optional.empty();
        }
        try
        {
            return systemCategoryRulesRepository.findByMerchant(merchant);
        }
        catch(DataAccessException e)
        {
            log.error("Error finding system category rule by merchant {}: {}", merchant, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public Optional<SystemCategoryRulesEntity> findByMerchantAndCategory(String merchant, String category)
    {
        if(merchant == null || merchant.isEmpty() || category == null || category.isEmpty())
        {
            return Optional.empty();
        }
        try
        {
            return systemCategoryRulesRepository.findByMerchantAndCategory(merchant, category);
        }
        catch(DataAccessException e)
        {
            log.error("Error finding system category rule by merchant {} and category {}: {}", merchant, category, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public Optional<SystemCategoryRulesEntity> findByMerchantCategoryAndAmount(String merchant, String category, Double amount)
    {
        if(merchant == null || merchant.isEmpty() || amount == null)
        {
            return Optional.empty();
        }
        try
        {
            return systemCategoryRulesRepository.findByMerchantCategoryAndAmount(merchant, category, amount);
        }
        catch(DataAccessException e)
        {
            log.error("Error finding system category rule by merchant {}, category {} and amount {}: {}", merchant, category, amount, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public Optional<SystemCategoryRulesEntity> findByMerchantAndAmount(String merchant, Double amount)
    {
        if(merchant == null || merchant.isEmpty() || amount == null)
        {
            return Optional.empty();
        }
        try
        {
            return systemCategoryRulesRepository.findByMerchantAndAmount(merchant, amount);
        }
        catch(DataAccessException e)
        {
            log.error("Error finding system category rule by merchant {} and amount {}: {}", merchant, amount, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public Optional<SystemCategoryRulesEntity> findByCategoryOnly(String category)
    {
        if(category == null || category.isEmpty())
        {
            return Optional.empty();
        }
        try
        {
            return systemCategoryRulesRepository.findByCategoryOnly(category);
        }
        catch(DataAccessException e)
        {
            log.error("Error finding system category rule by category {}: {}", category, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public List<SystemCategoryRulesEntity> findAllOrderedByPriority()
    {
        try
        {
            return systemCategoryRulesRepository.findAllOrderedByPriority();
        }
        catch(DataAccessException e)
        {
            log.error("Error finding all system category rules ordered by priority: {}", e.getMessage());
            return List.of();
        }
    }

    @Override
    public Optional<SystemCategoryRulesEntity> findByPlaidFull(String categoryId, String primary, String secondary)
    {
        return Optional.empty();
    }

    @Override
    public Optional<SystemCategoryRulesEntity> findByPlaidPrimaryAndSecondary(String primary, String secondary)
    {
        return Optional.empty();
    }

    @Override
    public Optional<SystemCategoryRulesEntity> findByPlaidCategoryIdAndSecondary(String categoryId, String secondary)
    {
        return Optional.empty();
    }

    @Override
    public Optional<SystemCategoryRulesEntity> findByPlaidCategoryIdAndPrimary(String categoryId, String primary)
    {
        return Optional.empty();
    }

    @Override
    public Optional<SystemCategoryRulesEntity> findByPlaidPrimaryOnly(String primary)
    {
        return Optional.empty();
    }

    @Override
    public Optional<SystemCategoryRulesEntity> findByPlaidSecondaryOnly(String secondary)
    {
        return Optional.empty();
    }

    @Override
    public Optional<SystemCategoryRulesEntity> findByPlaidCategoryIdOnly(String categoryId)
    {
        return Optional.empty();
    }
}
