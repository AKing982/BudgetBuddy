package com.app.budgetbuddy.domain;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BPIncomeCriteria(BigDecimal monthlyIncome, LocalDate lastPayDate, LocalDate nextPayDate, PayPeriod payPeriod) {
}
