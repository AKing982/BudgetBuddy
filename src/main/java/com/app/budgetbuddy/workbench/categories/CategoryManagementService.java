package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.Transaction;

import java.util.List;
import java.util.Map;

public interface CategoryManagementService
{
    List<Category> createDefaultCategories(Long userId);
    void mapPlaidCategories(List<String> plaidCategories, List<Category> systemCategories);
    void storeCategoryMappings(Long userId, Map<String, Category> categoryMappings);
    void updateCategoryMappings(Long userId, Map<String, Category> categoryMappings);

    // 3. Rule Application and Conflict Resolution
    Category applyRuleToTransaction(Transaction transaction);
    void setRulePriority(int priority);
    Category resolveConflict(Transaction transaction, List<CategoryRule> matchingRules);


    // 4. User interaction
    Category userAssignCategory(Long userId, Transaction transaction, Category category);


}
