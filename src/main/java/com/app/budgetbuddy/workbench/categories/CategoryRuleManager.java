package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.UserCategoryRule;
import com.plaid.client.model.Transaction;

import java.util.List;
import java.util.Map;

public interface CategoryRuleManager
{
    CategoryRule userUpdatedCategoryRule(UserCategoryRule userCategoryRule);
    CategoryRule updateCategoryRuleForTransaction(CategoryRule categoryRule);
    Boolean isCategoryRuleMatchForTransaction(CategoryRule categoryRule);

    List<UserCategoryRule> getUserCategoryRules(Long userId);
    List<CategoryRule> getMatchingCategoryRulesForTransaction(Transaction transaction);

    boolean validateCategoryRule(CategoryRule categoryRule);
    void saveOverrideAsNewRule(Transaction transaction, CategoryRule categoryRule, Category category);

    Map<CategoryRule, Double> getRuleSuccessRate();

    CategoryRule getTransactionCategoryRule(Transaction transaction);
    UserCategoryRule getTransactionUserCategoryRule(Transaction transaction);

    Category resolveCategoryRuleConflict(Transaction transaction, List<CategoryRule> categoryRules);
    void setCategoryRulePriority(int priority, CategoryRule categoryRule);
    void setUserCategoryRulePriority(int priority, UserCategoryRule userCategoryRule);

    double getCategoryRuleSuccessRate(CategoryRule categoryRule);

    void notifyUserOnCategoryRuleAssignment(Transaction transaction, Category category);
}
