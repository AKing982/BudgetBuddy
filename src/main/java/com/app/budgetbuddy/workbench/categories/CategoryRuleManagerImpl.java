package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.UserCategoryRule;
import com.plaid.client.model.Transaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class CategoryRuleManagerImpl implements CategoryRuleManager
{
    private CategoryRuleService categoryRuleService;

    @Autowired
    public CategoryRuleManagerImpl(final CategoryRuleService categoryRuleService)
    {
        this.categoryRuleService = categoryRuleService;
    }

    @Override
    public CategoryRule userUpdatedCategoryRule(UserCategoryRule userCategoryRule) {
        return null;
    }

    @Override
    public CategoryRule updateCategoryRuleForTransaction(CategoryRule categoryRule) {
        return null;
    }

    @Override
    public Boolean isCategoryRuleMatchForTransaction(CategoryRule categoryRule) {
        return null;
    }

    @Override
    public List<UserCategoryRule> getUserCategoryRules(Long userId) {
        return List.of();
    }

    @Override
    public List<CategoryRule> getMatchingCategoryRulesForTransaction(Transaction transaction) {
        return List.of();
    }

    @Override
    public boolean validateCategoryRule(CategoryRule categoryRule) {
        return false;
    }

    @Override
    public void saveOverrideAsNewRule(Transaction transaction, CategoryRule categoryRule, Category category) {

    }

    @Override
    public Map<CategoryRule, Double> getRuleSuccessRate() {
        return Map.of();
    }

    @Override
    public CategoryRule getTransactionCategoryRule(Transaction transaction) {
        return null;
    }

    @Override
    public UserCategoryRule getTransactionUserCategoryRule(Transaction transaction) {
        return null;
    }

    @Override
    public Category resolveCategoryRuleConflict(Transaction transaction, List<CategoryRule> categoryRules) {
        return null;
    }

    @Override
    public void setCategoryRulePriority(int priority, CategoryRule categoryRule) {

    }

    @Override
    public void setUserCategoryRulePriority(int priority, UserCategoryRule userCategoryRule) {

    }

    @Override
    public double getCategoryRuleSuccessRate(CategoryRule categoryRule) {
        return 0;
    }

    @Override
    public void notifyUserOnCategoryRuleAssignment(Transaction transaction, Category category) {

    }
}
