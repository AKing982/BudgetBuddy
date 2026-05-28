package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.EnvelopeContribution;
import com.app.budgetbuddy.entities.EnvelopeContributionsEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EnvelopeContributionsService extends ServiceModel<EnvelopeContributionsEntity>
{
    List<EnvelopeContributionsEntity> getEnvelopeContributionsByEnvelopeId(Long envelopeId);

    Optional<EnvelopeContribution> findByContributionId(Long contributionId);

    Optional<EnvelopeContribution> createAndSaveEntry(BigDecimal amount, LocalDate entryDate, Long envelopeId);

    Optional<EnvelopeContribution> updateAmountAndDate(Long contributionId, BigDecimal amount, LocalDate entryDate);

    Optional<EnvelopeContribution> getEnvelopeContributionsByEnvelopeIdAndScheduledDate(Long envelopeId, LocalDate scheduledDate);
}
