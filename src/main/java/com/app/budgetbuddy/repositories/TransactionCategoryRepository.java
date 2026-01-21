package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.TransactionCategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionCategoryRepository extends JpaRepository<TransactionCategoryEntity, Long>
{
    @Query("SELECT tc FROM TransactionCategoryEntity tc WHERE tc.categorized_date BETWEEN :start AND :end AND tc.transaction.account.user.id =:uId")
    List<TransactionCategoryEntity> findTransactionCategoriesBetweenStartAndEndDates(@Param("start") LocalDate start, @Param("end") LocalDate end, @Param("uId") Long uId);

    @Query("SELECT tc FROM TransactionCategoryEntity tc WHERE tc.id =:id AND tc.categorized_date BETWEEN :start AND :end")
    List<TransactionCategoryEntity> findTransactionCategoryByStartAndEndDates(@Param("start") Long start, @Param("end") Long end, @Param("id") String transactionId);

    @Query("SELECT tc FROM TransactionCategoryEntity tc " +
            "JOIN tc.transaction t " +
            "WHERE t.id IN :transactionIds " +
            "ORDER BY tc.id")
    List<TransactionCategoryEntity> findTransactionCategoryByTransactionIds(@Param("transactionIds") List<String> transactionIds);


    @Query("SELECT tce FROM TransactionCategoryEntity tce WHERE tce.csvTransaction.id =:id AND tce.userCategory.id =:uId")
    Optional<TransactionCategoryEntity> findTransactionCategoryByIdAndUserCategoryId(@Param("id") Long id, @Param("uId") Long uId);

    @Query("SELECT tce FROM TransactionCategoryEntity tce WHERE tce.csvTransaction.id =:id AND tce.category.id =:catId")
    Optional<TransactionCategoryEntity> findTransactionCategoryByCategoryId(@Param("id") Long id, @Param("catId") Long categoryId);

    @Modifying
    @Query("UPDATE TransactionCategoryEntity tce SET tce.category =:category WHERE tce.csvTransaction.id =:id")
    void updateTransactionCategoryByIdAndCategory(@Param("id") Long id, @Param("category") String category);

    @Modifying
    @Query("UPDATE TransactionCategoryEntity tce SET tce.category =:category WHERE tce.category.id IS NOT NULL AND tce.id =:id")
    void updateTransactionCategoryByIdNotCategory(@Param("category") String category);
}
