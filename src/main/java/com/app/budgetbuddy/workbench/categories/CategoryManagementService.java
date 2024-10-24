package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;

import java.util.List;
import java.util.Map;

public interface CategoryManagementService
{
    List<Category> createDefaultCategories(Long userId);
    void mapPlaidCategories(List<String> plaidCategories, List<Category> systemCategories);
    void storeCategoryMappings(Long userId, Map<String, Category> categoryMappings);
    void updateCategoryMappings(Long userId, Map<String, Category> categoryMappings);
}
