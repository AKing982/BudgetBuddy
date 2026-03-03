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
    public Optional<SystemCategoryRulesEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    public List<SystemCategoryRulesEntity> findByType(String type)
    {
        return List.of();
    }

    @Override
    public List<SystemCategoryRulesEntity> findByMerchantIgnoreCase(String merchant) {
        return List.of();
    }

    @Override
    public Optional<SystemCategoryRulesEntity> findByMerchantIgnoreCaseAndCategory(String merchant, String category) {
        return Optional.empty();
    }

    @Override
    public Optional<SystemCategoryRulesEntity> findByMerchantIgnoreCaseAndCategoryAndAmount(String merchant, String category, Double amount) {
        return Optional.empty();
    }

    @Override
    public Optional<SystemCategoryRulesEntity> findByMerchantIgnoreCaseAndCategoryIsNullAndAmount(String merchant, Double amount) {
        return Optional.empty();
    }

    @Override
    public Optional<SystemCategoryRulesEntity> findByCategoryAndType(String category, String type) {
        return Optional.empty();
    }

    @Override
    public Optional<SystemCategoryRulesEntity> findByPlaidCategoryIdAndType(PlaidCategoriesEntity plaidCategoryId, String type) {
        return Optional.empty();
    }

    @Override
    public List<SystemCategoryRulesEntity> findByPlaidCategoryId(PlaidCategoriesEntity plaidCategoryId) {
        return List.of();
    }

    @Override
    public boolean existsByMerchantIgnoreCaseAndType(String merchant, String type) {
        return false;
    }

    @Override
    public boolean existsByCategoryAndType(String category, String type) {
        return false;
    }

    @Override
    public boolean existsByMerchantIgnoreCaseAndCategoryAndAmount(String merchant, String category, Double amount) {
        return false;
    }
}
