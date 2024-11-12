package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.UserCategoryRule;
import com.app.budgetbuddy.entities.CategoryRuleEntity;
import com.app.budgetbuddy.services.ServiceModel;
import com.plaid.client.model.Transaction;

import java.util.List;
import java.util.Map;

public interface CategoryRuleService extends ServiceModel<CategoryRuleEntity>
{
    CategoryRuleEntity create(CategoryRule categoryRule);

    void createAll(List<CategoryRule> categoryRules);

    List<CategoryRuleEntity> findByUserId(Long userId);

    List<CategoryRule> getConvertedCategoryRules(List<CategoryRuleEntity> categoryRuleEntities);

    CategoryRule createCategoryRuleFromEntity(CategoryRuleEntity categoryRuleEntity);

    List<CategoryRuleEntity> findAllSystemCategoryRules();
}
