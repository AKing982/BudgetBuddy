package com.app.budgetbuddy.domain;

import lombok.Builder;

@Builder
public record ContributionValidationResult(boolean isValidated, String matchedTransactionId, String matchedAccountId, ContributionProvenance contributionProvenance, String errorMessage, EnvelopeNotification notification) {
}
