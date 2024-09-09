package com.app.budgetbuddy.domain;

import java.time.LocalDate;

public record SpendingRequest(Long userId, BudgetPeriod period, LocalDate startDate, LocalDate endDate) {
}
