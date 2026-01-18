package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.UserCategory;
import com.app.budgetbuddy.entities.UserCategoryEntity;

import java.util.List;
import java.util.Optional;

public interface UserCategoryService extends ServiceModel<UserCategoryEntity>
{
    List<UserCategory> findAllCategoriesByUser(Long userId);

    void deleteUserCategory(Long categoryId, Long userId);
    Optional<UserCategory> addCustomUserCategory(String categoryName, Long userId);
}
