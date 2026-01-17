package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.UserCategory;
import com.app.budgetbuddy.entities.UserCategoryEntity;

import java.util.Optional;

public interface UserCategoryService extends ServiceModel<UserCategoryEntity>
{
    Optional<UserCategory> addCustomUserCategory(String categoryName, Long userId);
}
