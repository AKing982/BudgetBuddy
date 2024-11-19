package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.UserCategoryRule;
import com.app.budgetbuddy.entities.CategoryRuleEntity;
import com.app.budgetbuddy.services.ServiceModel;
import com.plaid.client.model.Transaction;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface CategoryRuleService extends ServiceModel<CategoryRuleEntity>
{
    CategoryRuleEntity create(CategoryRule categoryRule);

    Optional<CategoryRuleEntity> findById(Long id);

    void createAll(List<CategoryRule> categoryRules);

    List<CategoryRuleEntity> findByUserId(Long userId);

    List<CategoryRule> getConvertedCategoryRules(List<CategoryRuleEntity> categoryRuleEntities);

    CategoryRule createCategoryRuleFromEntity(CategoryRuleEntity categoryRuleEntity);

    List<CategoryRuleEntity> findAllSystemCategoryRules();

    List<CategoryRule> getSystemCategoryRules();

    List<UserCategoryRule> getUserCategoryRules(Long userId);
}
