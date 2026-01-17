package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.CategoryEntity;

import java.util.List;
import java.util.Optional;

public interface CategoryService extends ServiceModel<CategoryEntity>
{
    CategoryEntity createAndSaveCategory(String categoryId, List<String> categories);

    Optional<CategoryEntity> findCategoryById(String categoryId);

    List<CategoryEntity> findAllSystemCategories();

    Optional<CategoryEntity> findCategoryByName(String categoryName);

    Optional<CategoryEntity> getCategoryByNameOrDescription(String description, String name);

    Optional<String> getCategoryIdByName(String categoryName);


}
