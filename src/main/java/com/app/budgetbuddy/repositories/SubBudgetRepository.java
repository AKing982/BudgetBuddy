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
    @Query("SELECT sb FROM SubBudgetEntity sb WHERE sb.budget.user.id =:uId AND sb.startDate =:beginDate AND sb.endDate =:endDate")
    Optional<SubBudgetEntity> findSubBudgetEntityByIdAndDate(@Param("uId") Long userId, @Param("beginDate")LocalDate beginDate, @Param("endDate")LocalDate endDate);
}
