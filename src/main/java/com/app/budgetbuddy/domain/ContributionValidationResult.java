package com.app.budgetbuddy.domain;

public record ContributionValidationResult(boolean isValidated, String matchedTransactionId, ContributionProvenance contributionProvenance) {
}
