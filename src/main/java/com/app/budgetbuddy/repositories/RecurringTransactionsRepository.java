package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.domain.RecurringTransactionType;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.RecurringTransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RecurringTransactionsRepository extends JpaRepository<RecurringTransactionEntity, Long>
{
    @Query("SELECT rt FROM RecurringTransactionEntity rt WHERE rt.merchantName LIKE :name")
    List<RecurringTransactionEntity> findByMerchantName(@Param("name") String name);


    @Query("SELECT rt.streamId FROM RecurringTransactionEntity rt JOIN rt.transactionsLinks tl WHERE tl.transaction.id IN :transactionIds")
    List<String> findRecurringTransactionIds(@Param("transactionIds") List<String> transactionIds);

    @Query("SELECT rt FROM RecurringTransactionEntity rt WHERE rt.category.id =:id AND rt.category.name LIKE :name AND rt.user.id =:uId")
    List<RecurringTransactionEntity> findRecurringTransactionsWithIncome(@Param("id") String categoryId, @Param("name") String categoryName, @Param("uId") Long userId);

    @Query("SELECT rt FROM RecurringTransactionEntity rt WHERE rt.user.id =:id")
    List<RecurringTransactionEntity> findByUser(@Param("id") Long id);

    @Query("SELECT rt FROM RecurringTransactionEntity rt WHERE rt.account.id =:id")
    List<RecurringTransactionEntity> findByAccountId(@Param("id") String id);

    @Query("SELECT rt FROM RecurringTransactionEntity rt WHERE rt.streamId =:id")
    List<RecurringTransactionEntity> findByStreamId(@Param("id") String id);

    @Query("SELECT rt FROM RecurringTransactionEntity rt WHERE " +
                  "(:startDate BETWEEN rt.firstDate AND rt.lastDate OR " +
                  ":endDate BETWEEN rt.firstDate AND rt.lastDate OR " +
                  "(rt.firstDate >= :startDate AND rt.lastDate <= :endDate))")
    List<RecurringTransactionEntity> findTransactionsInDateRange(@Param("startDate") LocalDate startDate,
                                                           @Param("endDate") LocalDate endDate);

    @Query("SELECT rt FROM RecurringTransactionEntity rt WHERE rt.user =:userId AND rt.active = true AND rt.firstDate <= :date AND (rt.lastDate IS NULL OR rt.lastDate >= :date)")
    List<RecurringTransactionEntity> findRecurringTransactionEntitiesByUserAndDate(@Param("userId") Long userId, @Param("date") LocalDate date);

    @Query("SELECT rt FROM RecurringTransactionEntity rt WHERE rt.user.id = :userId AND " +
            "(:startDate BETWEEN rt.firstDate AND rt.lastDate OR " +
            ":endDate BETWEEN rt.firstDate AND rt.lastDate OR " +
            "(rt.firstDate >= :startDate AND rt.lastDate <= :endDate))")
    List<RecurringTransactionEntity> findTransactionsInDateRangeForUser(@Param("userId") Long userId,
                                                                  @Param("startDate") LocalDate startDate,
                                                                  @Param("endDate") LocalDate endDate);

    @Query("SELECT SUM(rt.lastAmount) as totalExpenses FROM RecurringTransactionEntity rt JOIN rt.category c WHERE rt.active = true AND rt.user.id =:id AND (rt.lastDate >= :start AND rt.lastDate <= :end) AND rt.averageAmount > 0")
    BigDecimal findTotalExpensesForDateRange(@Param("id") Long id, @Param("start") LocalDate startDate, @Param("end") LocalDate endDate);

    @Query("SELECT rt FROM RecurringTransactionEntity rt WHERE rt.type =:type")
    List<RecurringTransactionEntity> findTransactionsByType(@Param("type") RecurringTransactionType type);


    @Query("SELECT rt FROM RecurringTransactionEntity rt WHERE rt.category =:category")
    List<RecurringTransactionEntity> findTransactionsByCategory(@Param("category")CategoryEntity category);
}
