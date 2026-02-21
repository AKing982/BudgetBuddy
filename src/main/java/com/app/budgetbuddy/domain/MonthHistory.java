package com.app.budgetbuddy.domain;

import java.time.YearMonth;

public record MonthHistory(YearMonth month, double totalSaved, double totalSpent, double percentSaved, double totalBudgeted, double averageSaved, double averageSpent) {
}
