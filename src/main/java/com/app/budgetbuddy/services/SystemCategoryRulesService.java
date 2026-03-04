package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.PlaidCategoriesEntity;
import com.app.budgetbuddy.entities.SystemCategoryRulesEntity;

import java.util.List;
import java.util.Optional;


public interface SystemCategoryRulesService extends ServiceModel<SystemCategoryRulesEntity>
{
    Optional<SystemCategoryRulesEntity> findByMerchantOnly(String merchant);
    Optional<SystemCategoryRulesEntity> findByMerchantAndCategory(String merchant, String category);
    Optional<SystemCategoryRulesEntity> findByMerchantCategoryAndAmount(String merchant, String category, Double amount);
    Optional<SystemCategoryRulesEntity> findByMerchantAndAmount(String merchant, Double amount);
    Optional<SystemCategoryRulesEntity> findByCategoryOnly(String category);
    List<SystemCategoryRulesEntity> findAllOrderedByPriority();

    // --- Plaid methods ---
    Optional<SystemCategoryRulesEntity> findByPlaidFull(String categoryId, String primary, String secondary);
    Optional<SystemCategoryRulesEntity> findByPlaidPrimaryAndSecondary(String primary, String secondary);
    Optional<SystemCategoryRulesEntity> findByPlaidCategoryIdAndSecondary(String categoryId, String secondary);
    Optional<SystemCategoryRulesEntity> findByPlaidCategoryIdAndPrimary(String categoryId, String primary);
    Optional<SystemCategoryRulesEntity> findByPlaidPrimaryOnly(String primary);
    Optional<SystemCategoryRulesEntity> findByPlaidSecondaryOnly(String secondary);
    Optional<SystemCategoryRulesEntity> findByPlaidCategoryIdOnly(String categoryId);
}
