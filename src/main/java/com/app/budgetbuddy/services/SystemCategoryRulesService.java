package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.PlaidCategoriesEntity;
import com.app.budgetbuddy.entities.SystemCategoryRulesEntity;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemCategoryRulesService extends ServiceModel<SystemCategoryRulesEntity>
{
    List<SystemCategoryRulesEntity> findByType(String type);
    List<SystemCategoryRulesEntity> findByMerchantIgnoreCase(String merchant);
    Optional<SystemCategoryRulesEntity> findByMerchantIgnoreCaseAndCategory(
            String merchant, String category);

    Optional<SystemCategoryRulesEntity> findByMerchantIgnoreCaseAndCategoryAndAmount(
            String merchant, String category, Double amount);

    // Null-category variant (FLEX FINANCE rules with no category but specific amount)
    Optional<SystemCategoryRulesEntity> findByMerchantIgnoreCaseAndCategoryIsNullAndAmount(
            String merchant, Double amount);

    // ── Category-only lookups (TRANSACTION_CATEGORY, PLAID_PRIMARY/SECONDARY) ─
    Optional<SystemCategoryRulesEntity> findByCategoryAndType(
            String category, String type);

    Optional<SystemCategoryRulesEntity> findByPlaidCategoryIdAndType(
            PlaidCategoriesEntity plaidCategoryId, String type);

    List<SystemCategoryRulesEntity> findByPlaidCategoryId(
            PlaidCategoriesEntity plaidCategoryId);

    boolean existsByMerchantIgnoreCaseAndType(String merchant, String type);
    boolean existsByCategoryAndType(String category, String type);
    boolean existsByMerchantIgnoreCaseAndCategoryAndAmount(
            String merchant, String category, Double amount);

}
