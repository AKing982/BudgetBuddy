package com.app.budgetbuddy.domain;

public record BPSavings(DateRange dateRange, double actualSavings, double goalAmount, boolean metGoal) {
}
