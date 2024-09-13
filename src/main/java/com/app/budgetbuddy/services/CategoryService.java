package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.CategoryEntity;

public interface CategoryService extends ServiceModel<CategoryEntity>
{
    CategoryEntity createAndSaveCategory(String categoryId, String categoryName, String description);
}
