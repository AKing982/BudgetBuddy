package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.UserCategoryRule;
import com.app.budgetbuddy.entities.CategoryRuleEntity;
import com.app.budgetbuddy.repositories.CategoryRuleRepository;
import com.plaid.client.model.Transaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class CategoryRuleServiceImpl implements CategoryRuleService
{
    private final CategoryRuleRepository categoryRuleRepository;

    @Autowired
    public CategoryRuleServiceImpl(CategoryRuleRepository categoryRuleRepository)
    {
        this.categoryRuleRepository = categoryRuleRepository;
    }

    @Override
    public Collection<CategoryRuleEntity> findAll() {
        return categoryRuleRepository.findAll();
    }

    @Override
    public void save(CategoryRuleEntity categoryRuleEntity) {
        categoryRuleRepository.save(categoryRuleEntity);
    }

    @Override
    public void delete(CategoryRuleEntity categoryRuleEntity) {
        categoryRuleRepository.delete(categoryRuleEntity);
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
    public void createAll(List<CategoryRule> categoryRules) {
        for(CategoryRule categoryRule : categoryRules)
        {
            create(categoryRule);
        }
    }
}
