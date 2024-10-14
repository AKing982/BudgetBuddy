package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BudgetCreateRequest(@JsonProperty("userId") Long userId,
                            @JsonProperty("budgetName") String budgetName,
                            @JsonProperty("budgetDescription") String budgetDescription,
                            @JsonProperty("budgetAmount") BigDecimal budgetAmount,
                            @JsonProperty("monthlyIncome") BigDecimal monthlyIncome,
                            @JsonProperty("startDate")LocalDate startDate,
                            @JsonProperty("endDate") LocalDate endDate) {
}
