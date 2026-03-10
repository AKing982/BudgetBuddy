package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.CSVTransactionEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CSVTransactionRepository extends JpaRepository<CSVTransactionEntity, Long>
{

    @Modifying
    @Query("UPDATE CSVTransactionEntity cte SET cte.merchantName =:merchantName WHERE cte.id =:id")
    void updateCSVTransactionEntityMerchantName(@Param("merchantName") String merchantName, @Param("id") Long id);

    @Query("SELECT cte FROM CSVTransactionEntity cte WHERE cte.user.id =:userId AND cte.transactionDate BETWEEN :startDate AND :endDate")
    List<CSVTransactionEntity> findCSVTransactionIdAndCategoryByUserIdAndDateRange(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(*) FROM CSVTransactionEntity cte WHERE cte.user.id =:userId AND cte.transactionDate BETWEEN :startDate AND :endDate")
    Long countByUserIdAndDateRange(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN TRUE ELSE FALSE END " +
           "FROM CSVTransactionEntity c " +
           "WHERE c.user.id =:userId " +
           "AND c.transactionDate >= :startDate " +
           "AND c.transactionDate <= :endDate")
    boolean existsByUserAndDateRange(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT cte FROM CSVTransactionEntity cte WHERE cte.id IN :ids")
    List<CSVTransactionEntity> findAllByIds(@Param("ids") List<Long> ids);

    @Query("SELECT cte " +
            "FROM CSVTransactionEntity cte " +
            "WHERE cte.user.id =:userId " +
            "AND cte.transactionDate = :date " +
            "AND cte.merchantName =:merchant " +
            "AND cte.extendedDescription =:extended " +
            "AND cte.description =:description " +
            "AND cte.transactionAmount =:amount")
    Optional<CSVTransactionEntity> findCSVTransactionByUserIdAndParams(@Param("userId") Long userId, @Param("date") LocalDate date, @Param("merchant") String merchantName, @Param("extended") String extendedDescription, @Param("description") String description, @Param("amount") Double amount);

    @Query("SELECT ct FROM CSVTransactionEntity ct WHERE ct.transactionDate BETWEEN :startDate AND :endDate AND ct.user.id=:userId")
    Page<CSVTransactionEntity> findCSVTransactionEntitiesByUserIdAndStartDateAndEndDate(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, Pageable pageable);
}
