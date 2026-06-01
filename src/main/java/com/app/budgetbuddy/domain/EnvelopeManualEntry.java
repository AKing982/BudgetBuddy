package com.app.budgetbuddy.domain;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder
public record EnvelopeManualEntry(Long envelopeId, BigDecimal amount, LocalDate date, Long userId) {
}
