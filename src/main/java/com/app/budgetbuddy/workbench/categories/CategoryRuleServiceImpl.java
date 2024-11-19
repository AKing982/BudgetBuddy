package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.UserCategoryRule;
import com.app.budgetbuddy.entities.CategoryRuleEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.repositories.CategoryRuleRepository;
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
public class CategoryRuleServiceImpl implements CategoryRuleService
{
    private final CategoryRuleRepository categoryRuleRepository;

    @Autowired
    public CategoryRuleServiceImpl(CategoryRuleRepository categoryRuleRepository)
    {
        this.categoryRuleRepository = categoryRuleRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Collection<CategoryRuleEntity> findAll() {
        try
        {
            return categoryRuleRepository.findAll();
        }catch(DataAccessException ex){
            log.error("Error fetching all categories");
            return List.of();
        }
    }

    @Override
    @Transactional
    public void save(CategoryRuleEntity categoryRuleEntity) {
        try
        {
            categoryRuleRepository.save(categoryRuleEntity);
        }catch(DataAccessException ex){
            log.error("There was an error saving the category rules: ", ex);
        }
    }

    @Override
    public void delete(CategoryRuleEntity categoryRuleEntity) {
        try
        {
            categoryRuleRepository.delete(categoryRuleEntity);
        }catch(DataAccessException ex){
            log.error("There was an error deleting the category rule: ", ex);
        }
    }

    @Override
    public Optional<CategoryRuleEntity> findById(Long id) {
        return categoryRuleRepository.findById(id);
    }

    @Override
    public CategoryRuleEntity create(CategoryRule categoryRule) {
        CategoryRuleEntity categoryRuleEntity = new CategoryRuleEntity();
        categoryRuleEntity.setMerchantPattern(categoryRule.getMerchantPattern());
        categoryRuleEntity.setFrequency(categoryRule.getFrequency());
        categoryRuleEntity.setPriority(1);
        categoryRuleEntity.setRecurring(categoryRule.isRecurring());
        categoryRuleEntity.setActive(true);
        categoryRuleEntity.setDescriptionPattern(categoryRule.getDescriptionPattern());
        return categoryRuleRepository.save(categoryRuleEntity);
    }

    @Override
    public void createAll(final List<CategoryRule> categoryRules) {
        try {
            categoryRules.stream()
                    .map(this::create)
                    .map(categoryRuleRepository::save);
        } catch (DataException e) {
            log.error("Error creating multiple category rules", e);
        }
    }

    @Override
    public List<CategoryRuleEntity> findByUserId(Long userId) {
        return categoryRuleRepository.findAllByUser(userId);
    }

    @Override
    public List<CategoryRule> getConvertedCategoryRules(List<CategoryRuleEntity> categoryRuleEntities) {
        return categoryRuleEntities.stream()
                .map(this::createCategoryRuleFromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public CategoryRule createCategoryRuleFromEntity(CategoryRuleEntity categoryRuleEntity) {
        CategoryRule categoryRule = new CategoryRule();
        categoryRule.setMerchantPattern(categoryRuleEntity.getMerchantPattern());
        categoryRule.setFrequency(categoryRuleEntity.getFrequency());
        categoryRule.setRecurring(categoryRuleEntity.isRecurring());
        categoryRule.setCategoryName(categoryRuleEntity.getCategory().getName());
        categoryRule.setCategoryId(categoryRuleEntity.getCategory().getId());
        categoryRule.setDescriptionPattern(categoryRuleEntity.getDescriptionPattern());
        return categoryRule;
    }

    @Override
    public List<CategoryRuleEntity> findAllSystemCategoryRules() {
        return categoryRuleRepository.findAllByUserIsNull();
    }

    @Override
    public List<CategoryRule> getSystemCategoryRules() {
        List<CategoryRuleEntity> categoryRuleEntities = categoryRuleRepository.findAll();
        return categoryRuleEntities.stream()
                .filter(CategoryRuleEntity::isActive)
                .map(this::createCategoryRuleFromEntity)
                .toList();
    }

    @Override
    public List<UserCategoryRule> getUserCategoryRules(Long userId) {
        List<CategoryRuleEntity> categoryRuleEntities = categoryRuleRepository.findAllByUser(userId);
        return categoryRuleEntities.stream()
                .filter(CategoryRuleEntity::isActive)
                .map(this::createCategoryRuleFromEntity)
                .toList();
    }
}
