package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PeriodRequest(@JsonProperty("period") BudgetPeriod period) {
}
