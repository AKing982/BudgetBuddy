package com.app.budgetbuddy.domain;

import java.time.LocalDate;

public record SpendingRequest(BudgetPeriod period, LocalDate startDate, LocalDate endDate) {
}
