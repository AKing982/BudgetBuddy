package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.EnvelopeNotificationsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnvelopeNotificationRepository extends JpaRepository<EnvelopeNotificationsEntity, Long>
{
    @Query("SELECT ene FROM EnvelopeNotificationsEntity ene WHERE ene.envelope.id =:id")
    List<EnvelopeNotificationsEntity> findAllByEnvelopeId(@Param("id") Long id);

    @Modifying
    @Query("UPDATE EnvelopeNotificationsEntity ene SET ene.isRead =:status WHERE ene.id =:id")
    void updateEnvelopeNotificationStatus(@Param("id") Long id, @Param("status") boolean status);
}
