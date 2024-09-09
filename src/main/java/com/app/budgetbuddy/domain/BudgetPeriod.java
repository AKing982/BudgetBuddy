package com.app.budgetbuddy.domain;

import java.time.LocalDate;

public record BudgetPeriod(Period period, LocalDate startDate, LocalDate endDate) {
}
