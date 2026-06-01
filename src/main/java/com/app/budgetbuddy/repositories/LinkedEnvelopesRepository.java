package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.LinkedEnvelopesEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LinkedEnvelopesRepository extends JpaRepository<LinkedEnvelopesEntity, Long>
{
    @Query("SELECT le FROM LinkedEnvelopesEntity le " +
            "JOIN le.linkedEnvelopeMembers e " +
            "JOIN e.user u " +
            "WHERE u.id = :userId")
    List<LinkedEnvelopesEntity> findByUserId(Long userId);
}
