package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.SubBudgetEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubBudgetRepository extends JpaRepository<SubBudgetEntity, Long>
{
    @Query("SELECT sb FROM SubBudgetEntity sb JOIN sb.budget b WHERE b.user.id=:uId AND sb.startDate =:beginDate OR sb.endDate =:endDate")
    Optional<SubBudgetEntity> findSubBudgetEntityByIdAndDateRange(@Param("uId") Long userId, @Param("beginDate")LocalDate beginDate, @Param("endDate")LocalDate endDate);

    @Query("SELECT sb FROM SubBudgetEntity sb JOIN sb.budget b WHERE b.user.id =:uId AND sb.startDate =:start AND sb.endDate =:end")
    Optional<SubBudgetEntity> findSubBudgetEntityByUserIdAndDates(@Param("uId") Long userId, @Param("start") LocalDate startDate, @Param("end") LocalDate endDate);

    @Query("SELECT sb FROM SubBudgetEntity sb JOIN sb.budget b WHERE sb.id =:id AND :date BETWEEN sb.startDate AND sb.endDate AND b.user.id =:uId")
    Optional<SubBudgetEntity> findSubBudgetEntityByIdAndDate(@Param("id") Long id, @Param("date") LocalDate date, @Param("uId") Long userId);

    @Query("SELECT sb FROM SubBudgetEntity sb JOIN sb.budget b WHERE b.user.id =:uId")
    List<SubBudgetEntity> findSubBudgetEntitiesByUserId(@Param("uId") Long userId);

    @Modifying
    @Query("UPDATE SubBudgetEntity sb SET sb.subSavingsAmount = " +
            "(SELECT COALESCE(SUM(bc.budgetedAmount - bc.actual), 0) " +
            "FROM BudgetCategoryEntity bc " +
            "WHERE bc.subBudget.id = :id " +
            "AND bc.startDate >= :startDate " +
            "AND bc.endDate <= :endDate " +
            "AND bc.active = TRUE) " +
            "WHERE sb.id = :id")
    @Transactional
    void updateSubBudgetSavingsByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("id") Long id);

    @Modifying
    @Query("UPDATE SubBudgetEntity sb SET sb.spentOnBudget = (SELECT COALESCE(SUM(bc.actual), 0)" +
            "FROM BudgetCategoryEntity bc WHERE bc.subBudget.id =:id AND bc.startDate >= :startDate AND bc.endDate <=:endDate AND bc.active = TRUE AND bc.categoryName NOT IN ('Income', 'Uncategorized')) WHERE sb.id =:id")
    @Transactional
    void updateSubBudgetSpendingByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("id") Long id);

    @Query("SELECT sb FROM SubBudgetEntity sb JOIN sb.budget b WHERE b.user.id =:uId AND sb.year =:year ORDER BY sb.startDate LIMIT :numMonths")
    List<SubBudgetEntity> findSubBudgetEntitiesByUserIdAndLimit(@Param("uId") Long userId, @Param("year") int year, @Param("numMonths") Integer numMonths);
}
