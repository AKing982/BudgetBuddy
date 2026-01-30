package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.domain.TransactionCategoryStatus;
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

    @Modifying
    @Query("UPDATE TransactionCategoryEntity tce SET tce.isUpdated =:isUpdated WHERE tce.csvTransaction.id =:csvId")
    void updateTransactionCategoryIsUpdated(@Param("csvId") Long csvId, @Param("isUpdated") boolean isUpdated);

    @Modifying
    @Query("UPDATE TransactionCategoryEntity tce SET tce.status =:status WHERE tce.csvTransaction.id =:csvId")
    void updateTransactionCategoryStatus(@Param("csvId") Long csvId, @Param("status") TransactionCategoryStatus status);

    @Query("SELECT tce FROM TransactionCategoryEntity tce WHERE tce.matchedCategory =:category AND tce.csvTransaction.id =:id")
    Optional<TransactionCategoryEntity> findTransactionCategoryByCategoryAndId(@Param("category") String category, @Param("id") Long id);

    @Modifying
    @Query("UPDATE TransactionCategoryEntity tce SET tce.matchedCategory =:category, tce.isUpdated=true WHERE tce.csvTransaction.id =:id")
    void updateTransactionCategoryByIdAndCategory(@Param("id") Long id, @Param("category") String category);

    @Query("SELECT COUNT(tce) FROM TransactionCategoryEntity tce JOIN tce.csvTransaction ct JOIN ct.csvAccount cae WHERE tce.isUpdated = TRUE AND ct.transactionDate BETWEEN :start AND :end AND cae.user.id =:userId")
    int findUpdatedTransactionCategories(@Param("start") LocalDate start, @Param("end") LocalDate end, @Param("userId") Long userId);

    @Query("SELECT COUNT(tce) FROM TransactionCategoryEntity tce JOIN tce.csvTransaction ct JOIN ct.csvAccount cae WHERE (tce.isUpdated = FALSE AND tce.status = 'NEW') OR (tce.isUpdated = TRUE AND tce.status ='PROCESSED') AND ct.transactionDate BETWEEN :start AND :end AND cae.user.id =:userId")
    int findNewTransactionCategories(@Param("start") LocalDate start, @Param("end") LocalDate end, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE TransactionCategoryEntity tce SET tce.matchedCategory =:category WHERE tce.matchedCategory IS NOT NULL AND tce.id =:id")
    void updateTransactionCategoryByIdNotCategory(@Param("category") String category);
}
