package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BPGridRow;
import com.app.budgetbuddy.entities.BPCategoryEntity;
import com.app.budgetbuddy.entities.BPColumnEntity;
import com.app.budgetbuddy.entities.CategoryEntity;

import java.util.List;
import java.util.Optional;

public interface CategoryService extends ServiceModel<CategoryEntity>
{
    CategoryEntity createAndSaveCategory(String categoryId, List<String> categories);

    Optional<CategoryEntity> findCategoryById(Long categoryId);

    List<CategoryEntity> findAllSystemCategories();

    String getCategoryType(String categoryName);

    int getCategoryBucketLevel(String categoryName);

    Optional<CategoryEntity> findCategoryByName(String categoryName);

    Optional<CategoryEntity> getCategoryByNameOrDescription(String description, String name);

    Long getCategoryIdByName(String categoryName);
}
