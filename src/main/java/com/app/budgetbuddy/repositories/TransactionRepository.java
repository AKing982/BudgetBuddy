package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.entities.TransactionsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<TransactionsEntity, Long>
{
    @Query("SELECT t FROM TransactionsEntity t WHERE t.amount BETWEEN :startAmount AND :endAmount")
    Collection<TransactionsEntity> findByAmountBetween(@Param("startAmount") BigDecimal startAmount, @Param("endAmount") BigDecimal endAmount);

    @Query("SELECT t FROM TransactionsEntity t WHERE t.pending = true")
    Collection<TransactionsEntity> findByPendingTrue();

    @Query("SELECT t FROM TransactionsEntity t WHERE t.authorizedDate =:date")
    Collection<TransactionsEntity> findByAuthorizedDate(@Param("date") LocalDate date);

    @Query("SELECT t FROM TransactionsEntity t WHERE t.account.accountId =:accountId")
    Optional<TransactionsEntity> findTransactionByAccountId(@Param("accountId") String accountId);

    @Query("SELECT t FROM TransactionsEntity t WHERE t.id =:id AND t.description =:descr")
    Optional<TransactionsEntity> findTransactionByDescription(@Param("descr") String description, @Param("id") Long id);

    @Query("SELECT t FROM TransactionsEntity t WHERE t.transactionId =:id")
    Optional<TransactionsEntity> findTransactionByTransactionId(@Param("id") String transactionId);

    @Query("SELECT t FROM TransactionsEntity t WHERE t.merchantName =:merchant")
    Collection<TransactionsEntity> findTransactionsByMerchant(@Param("merchant") String merchant);

    @Query("SELECT SUM(t.amount) FROM TransactionsEntity t WHERE t.posted BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT SUM(t.amount) FROM TransactionsEntity t WHERE t.category =:category AND t.posted BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByCategoryAndDateRange(@Param("category") Category category, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT AVG(t.amount) FROM TransactionsEntity t WHERE t.category =:category AND t.posted BETWEEN :startDate AND :endDate")
    BigDecimal averageAmountByCategoryAndDateRange(@Param("category") Category category, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    BigDecimal sumAmountByDate()






}
