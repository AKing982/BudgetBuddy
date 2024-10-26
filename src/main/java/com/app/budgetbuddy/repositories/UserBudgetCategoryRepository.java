package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.UserBudgetCategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface UserBudgetCategoryRepository extends JpaRepository<UserBudgetCategoryEntity, Long>
{
    @Query("SELECT u FROM UserBudgetCategoryEntity u WHERE u.user.id =:id")
    List<UserBudgetCategoryEntity> findAllByUserId(@Param("id") Long id);

    @Query("SELECT u FROM UserBudgetCategoryEntity u WHERE u.user.id =:id AND u.isactive = true")
    List<UserBudgetCategoryEntity> findActiveCategoriesByUser(@Param("id") Long userId);

    @Query("SELECT u FROM UserBudgetCategoryEntity u WHERE u.user.id =:id AND u.startDate =:startDate AND u.endDate =:endDate")
    List<UserBudgetCategoryEntity> findCategoriesByUserAndDateRange(@Param("id") Long userId, @Param("startDate")LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT SUM(u.budgetedAmount) FROM UserBudgetCategoryEntity u WHERE u.user.id =:id AND u.startDate =:start AND u.endDate =:end")
    Integer sumBudgetedAmountByUserAndDateRange(@Param("id") Long userId, @Param("start") LocalDate start, @Param("end") LocalDate end);




}
