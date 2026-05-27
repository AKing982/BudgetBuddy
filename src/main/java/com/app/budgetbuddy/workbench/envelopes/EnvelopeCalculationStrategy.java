package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.Envelope;
import com.app.budgetbuddy.domain.EnvelopeType;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface EnvelopeCalculationStrategy
{
    EnvelopeType supported();

    BigDecimal calculateMinimumPayment(Envelope envelope, BigDecimal currentBudget, BigDecimal threshold, LocalDate deadline);
    BigDecimal calculateEnvelopeScore(Envelope envelope);
    BigDecimal calculateRecommendedContribution(Envelope envelope, LocalDate deadline);

    LocalDate calculateTargetDate(Envelope envelope);

    boolean isMainBudgetImpacted(Envelope envelope);
    boolean isUnderFunded(Envelope envelope);
    boolean isAlertSent(Envelope envelope);
}
