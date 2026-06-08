package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.EnvelopeLink;
import com.app.budgetbuddy.entities.LinkedEnvelopesEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface LinkedEnvelopesService extends ServiceModel<LinkedEnvelopesEntity>
{
    Optional<EnvelopeLink> findByLinkedEnvelopeId(Long linkedEnvelopeId);

    List<LinkedEnvelopesEntity> findByUserId(Long userId);

    List<LinkedEnvelopesEntity> findByUserIdAndDates(Long userId, LocalDate startDate, LocalDate endDate);
}
