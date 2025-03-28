package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BudgetCategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BudgetCategoryRepository extends JpaRepository<BudgetCategoryEntity, Long>
{
    @Query("SELECT u FROM BudgetCategoryEntity u WHERE u.subBudget.budget.user.id =:id")
    List<BudgetCategoryEntity> findAllByUserId(@Param("id") Long id);

    @Query("SELECT u FROM BudgetCategoryEntity u WHERE u.subBudget.budget.user.id =:id AND u.isactive = true")
    List<BudgetCategoryEntity> findActiveCategoriesByUser(@Param("id") Long userId);

    @Query("SELECT u FROM BudgetCategoryEntity u WHERE u.subBudget.id =:id")
    List<BudgetCategoryEntity> findByBudgetId(@Param("id") Long budgetId);

    @Query("SELECT u FROM BudgetCategoryEntity u WHERE u.subBudget.id =:id AND u.startDate =:start AND u.endDate =:end")
    List<BudgetCategoryEntity> findByBudgetIdAndDateRange(@Param("id") Long budgetId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT u FROM BudgetCategoryEntity u WHERE u.subBudget.budget.user.id =:id AND u.startDate =:startDate AND u.endDate =:endDate")
    List<BudgetCategoryEntity> findCategoriesByUserAndDateRange(@Param("id") Long userId, @Param("startDate")LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT SUM(u.budgetedAmount) FROM BudgetCategoryEntity u WHERE u.subBudget.budget.user.id =:id AND u.startDate =:start AND u.endDate =:end")
    Integer sumBudgetedAmountByUserAndDateRange(@Param("id") Long userId, @Param("start") LocalDate start, @Param("end") LocalDate end);




}
