package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.CategoryEntity;

import java.util.List;
import java.util.Optional;

public interface CategoryService extends ServiceModel<CategoryEntity>
{
    CategoryEntity createAndSaveCategory(String categoryId, List<String> categories);

    Optional<CategoryEntity> findCategoryById(String categoryId);
}
