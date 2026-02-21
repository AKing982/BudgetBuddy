package com.app.budgetbuddy.domain;

import java.time.YearMonth;

public record HistoricalMonthStats(YearMonth worstMonth, YearMonth bestMonth, double bestSaved, double worstSaved) {
}
