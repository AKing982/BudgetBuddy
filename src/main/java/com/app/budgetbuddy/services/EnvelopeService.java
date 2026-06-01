package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.Envelope;
import com.app.budgetbuddy.entities.EnvelopeEntity;

import java.util.List;
import java.util.Optional;

public interface EnvelopeService extends ServiceModel<EnvelopeEntity>
{
    List<EnvelopeEntity> findByUserId(Long userId);

    Envelope save(Envelope envelope);

    Optional<Envelope> findByEnvelopeId(Long envelopeId);
}
