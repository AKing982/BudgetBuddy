package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<TransactionsEntity, Long>
{
    @Query("SELECT t FROM TransactionsEntity t WHERE t.amount BETWEEN :startAmount AND :endAmount")
    List<TransactionsEntity> findByAmountBetween(@Param("startAmount") BigDecimal startAmount, @Param("endAmount") BigDecimal endAmount);

    @Query("SELECT t FROM TransactionsEntity t WHERE t.amount =:amount")
    List<TransactionsEntity> findByAmount(@Param("amount") BigDecimal amount);

    @Query("SELECT t FROM TransactionsEntity t WHERE t.amount >=:amount")
    List<TransactionsEntity> findByAmountGreaterThan(@Param("amount") BigDecimal amount);

    @Query("SELECT t FROM TransactionsEntity t WHERE t.amount <=:amount")
    List<TransactionsEntity> findByAmountLessThan(@Param("amount") BigDecimal amount);

    @Query("SELECT t FROM TransactionsEntity t WHERE t.pending = true")
    List<TransactionsEntity> findByPendingTrue();

    @Query("SELECT t FROM TransactionsEntity t WHERE t.authorizedDate =:date")
    List<TransactionsEntity> findByAuthorizedDate(@Param("date") LocalDate date);

    @Query("SELECT t FROM TransactionsEntity t WHERE t.account.accountReferenceNumber =:num")
    List<TransactionsEntity> findByAccountReferenceNumber(@Param("num") String num);

    @Query("SELECT t FROM TransactionsEntity t WHERE t.description =:descr")
    List<TransactionsEntity> findTransactionByDescription(@Param("descr") String description);

    @Query("SELECT t FROM TransactionsEntity t WHERE t.transactionReferenceNumber =:id")
    Optional<TransactionsEntity> findTransactionByTransactionReferenceNumber(@Param("id") String transactionId);

    @Query("SELECT t FROM TransactionsEntity t WHERE t.merchantName =:merchant")
    Collection<TransactionsEntity> findTransactionsByMerchant(@Param("merchant") String merchant);

    @Query("SELECT t FROM TransactionsEntity t JOIN t.account a JOIN a.user u WHERE u.id =:id ")
    Collection<TransactionsEntity> findTransactionsByUser(@Param("id") Long id);

    @Query("SELECT t FROM TransactionsEntity t JOIN t.account a JOIN a.user u WHERE u.id =:id AND t.posted BETWEEN :startDate AND :endDate")
    List<TransactionsEntity> findTransactionsByUserIdAndDateRange(@Param("id") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT t FROM TransactionsEntity t JOIN t.account a JOIN a.user u WHERE u.id =:id AND t.authorizedDate BETWEEN :startDate AND :endDate")
    Collection<TransactionsEntity> findTransactionsByUserAndPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT SUM(t.amount) FROM TransactionsEntity t WHERE t.posted BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT SUM(t.amount) FROM TransactionsEntity t JOIN t.category c WHERE c =:category AND t.posted BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByCategoryAndDateRange(@Param("category") CategoryEntity category, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT AVG(t.amount) FROM TransactionsEntity t WHERE t.category =:category AND t.posted BETWEEN :startDate AND :endDate")
    BigDecimal findAverageSpendingByCategoryAndDateRange(@Param("category") CategoryEntity category, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT t.posted, t.category, SUM(t.amount) FROM TransactionsEntity t WHERE t.posted =:date GROUP BY t.posted, t.category, t.amount")
    List<Object[]> getDailySpendingBreakdown(@Param("date") LocalDate date);

    @Query("SELECT t.posted, t.category, SUM(t.amount) FROM TransactionsEntity t WHERE t.posted BETWEEN :startDate AND :endDate GROUP BY t.posted, t.category, t.amount")
    List<Object[]> getSpendingBreakdownOverDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT t.category.name, t.category.description, SUM(t.amount) as totalAmount FROM TransactionsEntity t JOIN t.category c WHERE t.posted BETWEEN :startDate AND :endDate GROUP BY t.category.description, t.category.name")
    List<Object[]> getSpendingCategoriesByPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT SUM(t.amount) FROM TransactionsEntity t JOIN t.category c WHERE c =:category")
    BigDecimal getTotalSpendingByCategory(@Param("category") CategoryEntity category);

    @Modifying
    @Query("UPDATE TransactionsEntity t SET t.category =:category")
    Optional<TransactionsEntity> updateTransactionCategory(@Param("category") CategoryEntity category);
}
