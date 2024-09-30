package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.domain.RecurringTransactionType;
import com.app.budgetbuddy.entities.RecurringTransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RecurringTransactionsRepository extends JpaRepository<RecurringTransactionEntity, Long>
{
    @Query("SELECT rt FROM RecurringTransactionEntity rt WHERE rt.merchantName LIKE :name")
    List<RecurringTransactionEntity> findByMerchantName(@Param("name") String name);

    @Query("SELECT rt FROM RecurringTransactionEntity rt WHERE rt.account.id =:id")
    List<RecurringTransactionEntity> findByAccountId(@Param("id") String id);

    @Query("SELECT rt FROM RecurringTransactionEntity rt WHERE " +
                  "(:startDate BETWEEN rt.firstDate AND rt.lastDate OR " +
                  ":endDate BETWEEN rt.firstDate AND rt.lastDate OR " +
                  "(rt.firstDate >= :startDate AND rt.lastDate <= :endDate))")
    List<RecurringTransactionEntity> findTransactionsInDateRange(@Param("startDate") LocalDate startDate,
                                                           @Param("endDate") LocalDate endDate);


    @Query("SELECT rt FROM RecurringTransactionEntity rt WHERE rt.user.id = :userId AND " +
            "(:startDate BETWEEN rt.firstDate AND rt.lastDate OR " +
            ":endDate BETWEEN rt.firstDate AND rt.lastDate OR " +
            "(rt.firstDate >= :startDate AND rt.lastDate <= :endDate))")
    List<RecurringTransactionEntity> findTransactionsInDateRangeForUser(@Param("userId") Integer userId,
                                                                  @Param("startDate") LocalDate startDate,
                                                                  @Param("endDate") LocalDate endDate);


    @Query("SELECT rt FROM RecurringTransactionEntity rt WHERE rt.type =:type")
    List<RecurringTransactionEntity> findTransactionsByType(@Param("type") RecurringTransactionType type);
}
