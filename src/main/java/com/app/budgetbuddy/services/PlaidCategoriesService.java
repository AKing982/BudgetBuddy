package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.PlaidCategoriesEntity;

import java.util.Optional;

public interface PlaidCategoriesService extends ServiceModel<PlaidCategoriesEntity>
{
    Optional<PlaidCategoriesEntity> findByPlaidFull(String categoryId, String primary, String secondary);
    Optional<PlaidCategoriesEntity> findByPlaidPrimaryAndSecondary(String primary, String secondary);
    Optional<PlaidCategoriesEntity> findByPlaidCategoryIdAndSecondary(String categoryId, String secondary);
    Optional<PlaidCategoriesEntity> findByPlaidCategoryIdAndPrimary(String categoryId, String primary);
    Optional<PlaidCategoriesEntity> findByPlaidPrimaryOnly(String primary);
    Optional<PlaidCategoriesEntity> findByPlaidSecondaryOnly(String secondary);
    Optional<PlaidCategoriesEntity> findByPlaidCategoryIdOnly(String categoryId);
}
