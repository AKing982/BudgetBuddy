package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.EnvelopePaymentPlansEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EnvelopePaymentPlansRepository extends JpaRepository<EnvelopePaymentPlansEntity, Long> {
}
