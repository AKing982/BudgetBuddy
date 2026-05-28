package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.EnvelopeNotificationsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EnvelopeNotificationRepository extends JpaRepository<EnvelopeNotificationsEntity, Long> {
}
