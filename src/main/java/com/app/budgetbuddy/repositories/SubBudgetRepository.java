package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.SubBudgetEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
}
