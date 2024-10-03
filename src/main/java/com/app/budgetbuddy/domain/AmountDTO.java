package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AmountDTO(@JsonProperty("amount") BigDecimal amount,
                        @JsonProperty("isoCurrency") String isoCurrency,
                        @JsonProperty("unofficialCurrency") String unofficialCurrency) {
}
