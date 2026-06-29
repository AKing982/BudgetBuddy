package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.EnvelopeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EnvelopeRepository extends JpaRepository<EnvelopeEntity, Long>
{
    @Query("SELECT e FROM EnvelopeEntity e WHERE e.user.id =:userId")
    List<EnvelopeEntity> findAllByUserId(Long userId);

    @Query("SELECT DISTINCT e FROM EnvelopeEntity e JOIN e.subBudgets sb WHERE e.user.id = :userId AND sb.startDate = :monthStart AND sb.endDate = :monthEnd")
    List<EnvelopeEntity> findAllByUserIdAndDateRange(@Param("userId") Long userId, @Param("monthStart") LocalDate monthStart, @Param("monthEnd") LocalDate monthEnd);

}
