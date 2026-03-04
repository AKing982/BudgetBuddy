package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.SystemCategoryRulesEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemCategoryRulesRepository extends JpaRepository<SystemCategoryRulesEntity, Long>
{
    @Query("SELECT s FROM SystemCategoryRulesEntity s " +
           "WHERE UPPER(s.merchant) = UPPER(:merchant) " +
           "AND s.type = 'Merchant' " +
           "ORDER BY s.priority ASC")
    Optional<SystemCategoryRulesEntity> findByMerchant(@Param("merchant") String merchant);


    @Query("SELECT s FROM SystemCategoryRulesEntity s " +
           "WHERE UPPER(s.merchant) = UPPER(:merchant) " +
           "AND s.category = :category " +
           "AND s.amount IS NULL " +
           "AND s.type = 'MERCHANT_CATEGORY' " +
           "ORDER BY s.priority ASC")
    Optional<SystemCategoryRulesEntity> findByMerchantAndCategory(@Param("merchant") String merchant, @Param("category") String category);

    @Query("SELECT s FROM SystemCategoryRulesEntity s " +
            "WHERE UPPER(s.merchant) = UPPER(:merchant) " +
            "AND s.category = :category " +
            "AND s.amount = :amount " +
            "AND s.type = 'MERCHANT_CATEGORY_AMOUNT' " +
            "ORDER BY s.priority ASC")
    Optional<SystemCategoryRulesEntity> findByMerchantCategoryAndAmount(
            @Param("merchant") String merchant,
            @Param("category") String category,
            @Param("amount") Double amount);

    // --- csvMerchantCategoryMap equivalent (merchant + amount, null category) ---
    // Matches: merchant + amount only (type = "MERCHANT_AMOUNT")
    @Query("SELECT s FROM SystemCategoryRulesEntity s " +
            "WHERE UPPER(s.merchant) = UPPER(:merchant) " +
            "AND s.amount = :amount " +
            "AND s.category IS NULL " +
            "AND s.type = 'MERCHANT_AMOUNT' " +
            "ORDER BY s.priority ASC")
    Optional<SystemCategoryRulesEntity> findByMerchantAndAmount(
            @Param("merchant") String merchant,
            @Param("amount") Double amount);

    // --- transactionCategoryMap equivalent ---
    // Matches: category string only (type = "CATEGORY")
    @Query("SELECT s FROM SystemCategoryRulesEntity s " +
            "WHERE s.category = :category " +
            "AND s.type = 'CATEGORY' " +
            "ORDER BY s.priority ASC")
    Optional<SystemCategoryRulesEntity> findByCategoryOnly(@Param("category") String category);

    // Bulk fetch for a given institution - useful to load all rules upfront if caching
    @Query("SELECT s FROM SystemCategoryRulesEntity s ORDER BY s.priority ASC")
    List<SystemCategoryRulesEntity> findAllOrderedByPriority();

    // For the Plaid transaction engine - matches on plaid category data
    @Query("SELECT s FROM SystemCategoryRulesEntity s " +
            "WHERE s.plaidCategoryId.categoryId = :categoryId " +
            "AND s.plaidCategoryId.primaryCategory = :primary " +
            "AND s.plaidCategoryId.secondaryCategory = :secondary " +
            "AND s.type = 'PLAID_FULL' " +
            "ORDER BY s.priority ASC")
    Optional<SystemCategoryRulesEntity> findByPlaidFull(
            @Param("categoryId") String categoryId,
            @Param("primary") String primary,
            @Param("secondary") String secondary);

    @Query("SELECT s FROM SystemCategoryRulesEntity s " +
            "WHERE s.plaidCategoryId.primaryCategory = :primary " +
            "AND s.plaidCategoryId.secondaryCategory = :secondary " +
            "AND s.type = 'PLAID_PRIMARY_SECONDARY' " +
            "ORDER BY s.priority ASC")
    Optional<SystemCategoryRulesEntity> findByPlaidPrimaryAndSecondary(
            @Param("primary") String primary,
            @Param("secondary") String secondary);

    @Query("SELECT s FROM SystemCategoryRulesEntity s " +
            "WHERE s.plaidCategoryId.categoryId = :categoryId " +
            "AND s.plaidCategoryId.secondaryCategory = :secondary " +
            "AND s.type = 'PLAID_ID_SECONDARY' " +
            "ORDER BY s.priority ASC")
    Optional<SystemCategoryRulesEntity> findByPlaidCategoryIdAndSecondary(
            @Param("categoryId") String categoryId,
            @Param("secondary") String secondary);

    @Query("SELECT s FROM SystemCategoryRulesEntity s " +
            "WHERE s.plaidCategoryId.categoryId = :categoryId " +
            "AND s.plaidCategoryId.primaryCategory = :primary " +
            "AND s.type = 'PLAID_ID_PRIMARY' " +
            "ORDER BY s.priority ASC")
    Optional<SystemCategoryRulesEntity> findByPlaidCategoryIdAndPrimary(
            @Param("categoryId") String categoryId,
            @Param("primary") String primary);

    @Query("SELECT s FROM SystemCategoryRulesEntity s " +
            "WHERE s.plaidCategoryId.primaryCategory = :primary " +
            "AND s.type = 'PLAID_PRIMARY' " +
            "ORDER BY s.priority ASC")
    Optional<SystemCategoryRulesEntity> findByPlaidPrimaryOnly(@Param("primary") String primary);

    @Query("SELECT s FROM SystemCategoryRulesEntity s " +
            "WHERE s.plaidCategoryId.secondaryCategory = :secondary " +
            "AND s.type = 'PLAID_SECONDARY' " +
            "ORDER BY s.priority ASC")
    Optional<SystemCategoryRulesEntity> findByPlaidSecondaryOnly(@Param("secondary") String secondary);

    @Query("SELECT s FROM SystemCategoryRulesEntity s " +
            "WHERE s.plaidCategoryId.categoryId = :categoryId " +
            "AND s.type = 'PLAID_ID' " +
            "ORDER BY s.priority ASC")
    Optional<SystemCategoryRulesEntity> findByPlaidCategoryIdOnly(@Param("categoryId") String categoryId);


}
