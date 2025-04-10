package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.TransactionCategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionCategoryRepository extends JpaRepository<TransactionCategoryEntity, Long>
{
    @Query("SELECT tc FROM TransactionCategoryEntity tc WHERE tc.categorized_date BETWEEN :start AND :end AND tc.transaction.account.user.id =:uId")
    List<TransactionCategoryEntity> findTransactionCategoriesBetweenStartAndEndDates(@Param("start") LocalDate start, @Param("end") LocalDate end, @Param("uId") Long uId);

    @Query("SELECT tc FROM TransactionCategoryEntity tc WHERE tc.id =:id AND tc.categorized_date BETWEEN :start AND :end")
    List<TransactionCategoryEntity> findTransactionCategoryByStartAndEndDates(@Param("start") Long start, @Param("end") Long end, @Param("id") String transactionId);
}
