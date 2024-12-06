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
    @Query("SELECT u FROM TransactionCategoryEntity u WHERE u.budget.user.id =:id")
    List<TransactionCategoryEntity> findAllByUserId(@Param("id") Long id);

    @Query("SELECT u FROM TransactionCategoryEntity u WHERE u.budget.user.id =:id AND u.isactive = true")
    List<TransactionCategoryEntity> findActiveCategoriesByUser(@Param("id") Long userId);

    @Query("SELECT u FROM TransactionCategoryEntity u WHERE u.budget.id =:id")
    List<TransactionCategoryEntity> findByBudgetId(@Param("id") Long budgetId);

    @Query("SELECT u FROM TransactionCategoryEntity u WHERE u.budget.id =:id AND u.startDate =:start AND u.endDate =:end")
    List<TransactionCategoryEntity> findByBudgetIdAndDateRange(@Param("id") Long budgetId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT u FROM TransactionCategoryEntity u WHERE u.budget.user.id =:id AND u.startDate =:startDate AND u.endDate =:endDate")
    List<TransactionCategoryEntity> findCategoriesByUserAndDateRange(@Param("id") Long userId, @Param("startDate")LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT SUM(u.budgetedAmount) FROM TransactionCategoryEntity u WHERE u.budget.user.id =:id AND u.startDate =:start AND u.endDate =:end")
    Integer sumBudgetedAmountByUserAndDateRange(@Param("id") Long userId, @Param("start") LocalDate start, @Param("end") LocalDate end);




}
