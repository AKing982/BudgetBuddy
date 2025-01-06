package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BudgetEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<BudgetEntity, Long>
{
    @Query("SELECT b FROM BudgetEntity b WHERE b.budgetName =:name")
    List<BudgetEntity> findByBudgetName(@Param("name") String name);

    @Query("SELECT b FROM BudgetEntity b WHERE b.user.id =:id")
    List<BudgetEntity> findByUser(@Param("id") Long id);

    @Query("SELECT b FROM BudgetEntity b WHERE b.user.id =:id AND b.startDate =:start AND b.endDate =:end")
    Optional<BudgetEntity> findBudgetByUserAndPeriod(@Param("id") Long userId, @Param("start") LocalDate startDate, @Param("end") LocalDate endDate);

    @Query("SELECT b.budgetAmount FROM BudgetEntity b WHERE b.user.id =:id AND b.startDate >= :start AND b.endDate <= :end AND b.id =:budgetid")
    BigDecimal findBudgetAmountByPeriod(@Param("id") Long userId, @Param("start")LocalDate startDate, @Param("end") LocalDate endDate, @Param("budgetid") Long budgetId);




}
