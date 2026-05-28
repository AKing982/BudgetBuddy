package com.app.budgetbuddy.domain;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EnvelopeManualEntry(Long envelopeId, BigDecimal amount, LocalDate date, Long userId) {
}
