package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.LinkedEnvelopesEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LinkedEnvelopesRepository extends JpaRepository<LinkedEnvelopesEntity, Long>
{
    @Query("SELECT le FROM LinkedEnvelopesEntity le " +
            "JOIN le.linkedEnvelopeMembers e " +
            "JOIN e.user u " +
            "WHERE u.id = :userId")
    List<LinkedEnvelopesEntity> findByUserId(Long userId);

    @Query("SELECT le FROM LinkedEnvelopesEntity le " +
           "JOIN le.linkedEnvelopeMembers e " +
           "JOIN e.user u " +
           "JOIN e.subBudgets sb " +
           "WHERE u.id =:userId AND sb.startDate >=:monthStart AND sb.endDate <=:monthEnd")
    List<LinkedEnvelopesEntity> findByUserIdAndDateRange(@Param("userId") Long userId, @Param("monthStart") LocalDate monthStart, @Param("monthEnd") LocalDate monthEnd);
}
