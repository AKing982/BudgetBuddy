package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.PlaidCategoriesEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlaidCategoriesRepository extends JpaRepository<PlaidCategoriesEntity, Long>
{
    @Query("SELECT p FROM PlaidCategoriesEntity p " +
           "WHERE p.categoryId =:categoryId " +
           "AND p.primaryCategory =:primary " +
           "AND p.secondaryCategory =:secondary " +
           "ORDER BY p.categoryId DESC ")
    Optional<PlaidCategoriesEntity> findByPlaidFull(@Param("categoryId") String categoryId, @Param("primary") String primary, @Param("secondary") String secondary);

    @Query("SELECT p FROM PlaidCategoriesEntity p " +
           "WHERE p.primaryCategory =:primary AND p.secondaryCategory =:secondary " +
           "ORDER BY p.categoryId DESC")
    Optional<PlaidCategoriesEntity> findByPlaidPrimaryAndSecondary(@Param("primary") String primary, @Param("secondary") String secondary);

    @Query("SELECT p FROM PlaidCategoriesEntity p " +
           "WHERE p.categoryId =:categoryId AND p.secondaryCategory =:secondary")
    Optional<PlaidCategoriesEntity> findByPlaidCategoryIdAndSecondary(@Param("categoryId") String categoryId, @Param("secondary") String secondary);

    @Query("SELECT p FROM PlaidCategoriesEntity p " +
           "WHERE p.categoryId =:categoryId AND p.primaryCategory =:primary")
    Optional<PlaidCategoriesEntity> findByPlaidCategoryIdAndPrimary(@Param("categoryId") String categoryId, @Param("primary") String primary);

    @Query("SELECT p FROM PlaidCategoriesEntity p " +
           "WHERE p.primaryCategory =:primary")
    Optional<PlaidCategoriesEntity> findByPlaidPrimaryOnly(@Param("primary") String primary);

    @Query("SELECT p FROM PlaidCategoriesEntity p " +
           "WHERE p.secondaryCategory =:secondary")
    Optional<PlaidCategoriesEntity> findByPlaidSecondaryOnly(@Param("secondary") String secondary);

    @Query("SELECT p FROM PlaidCategoriesEntity p " +
           "WHERE p.categoryId =:categoryId")
    Optional<PlaidCategoriesEntity> findByPlaidCategoryIdOnly(@Param("categoryId") String categoryId);

}
