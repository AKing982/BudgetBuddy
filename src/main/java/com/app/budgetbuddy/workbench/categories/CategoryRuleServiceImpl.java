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
        return List.of();
    }

    @Override
    public void save(CategoryRuleEntity categoryRuleEntity) {

    }

    @Override
    public void delete(CategoryRuleEntity categoryRuleEntity) {

    }

    @Override
    public Optional<CategoryRuleEntity> findById(Long id) {
        return Optional.empty();
    }
}
