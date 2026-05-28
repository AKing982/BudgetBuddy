package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.EnvelopeContributionsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EnvelopeContributionsRepository extends JpaRepository<EnvelopeContributionsEntity, Long>
{
    @Query("SELECT e FROM EnvelopeContributionsEntity e WHERE e.envelope.id =:id")
    List<EnvelopeContributionsEntity> findByEnvelopeId(@Param("id") Long id);

    @Query("SELECT e FROM EnvelopeContributionsEntity e WHERE e.envelope.id =:id AND e.scheduledDate =:date")
    Optional<EnvelopeContributionsEntity> findByEnvelopeIdAndScheduledDate(@Param("id") Long id, @Param("date") LocalDate date);

    @Modifying
    @Query("UPDATE EnvelopeContributionsEntity e SET e.contributionAmount =:amount, e.contributionDate =:date WHERE e.id =:id")
    void updateContributionAmount(@Param("id") Long id, @Param("amount") Double amount, @Param("date") LocalDate date);

}
