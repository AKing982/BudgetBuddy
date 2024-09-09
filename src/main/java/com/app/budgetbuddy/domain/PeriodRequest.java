package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.plaid.client.model.DateRange;

public record PeriodRequest(@JsonProperty("period") BudgetPeriod period, @JsonProperty("range") DateRange dateRange) {
}
