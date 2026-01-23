package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.CSVTransactionEntity;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CSVTransactionRepository extends JpaRepository<CSVTransactionEntity, Long>
{

    @Modifying
    @Query("UPDATE CSVTransactionEntity cte SET cte.merchantName =:merchantName WHERE cte.id =:id")
    void updateCSVTransactionEntityMerchantName(@Param("merchantName") String merchantName, @Param("id") Long id);

    @Query("SELECT cte FROM CSVTransactionEntity cte INNER JOIN CSVAccountEntity cae ON cte.csvAccount.id = cae.id WHERE cae.user.id =:userId AND cte.transactionDate BETWEEN :startDate AND :endDate")
    List<CSVTransactionEntity> findCSVTransactionIdAndCategoryByUserIdAndDateRange(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(*) FROM CSVTransactionEntity cte INNER JOIN CSVAccountEntity cae ON cte.csvAccount.id = cae.id WHERE cae.user.id =:userId AND cte.transactionDate BETWEEN :startDate AND :endDate")
    Long countByUserIdAndDateRange(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN TRUE ELSE FALSE END " +
           "FROM CSVTransactionEntity c " +
           "WHERE c.csvAccount.user.id =:userId " +
           "AND c.transactionDate >= :startDate " +
           "AND c.transactionDate <= :endDate")
    boolean existsByUserAndDateRange(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT ct FROM CSVTransactionEntity ct WHERE ct.transactionDate BETWEEN :startDate AND :endDate AND ct.csvAccount.id =:acctId")
    List<CSVTransactionEntity> findCSVTransactionEntitiesByAcctIdAndStartDateAndEndDate(@Param("acctId") Long acctId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
